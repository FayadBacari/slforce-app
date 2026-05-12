import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { router } from 'expo-router';
import { API_BASE_URL, API_ENDPOINTS } from './api-endpoints';
import { APP_VERSION, APP_PLATFORM } from './api-app-metadata';
import {
  type RetryableRequestConfig,
  retryAxiosRequest,
  shouldRetryAxiosError,
} from './api-retry';
import {
  type BackendSuccessEnvelope,
  unwrapBackendEnvelope,
} from './api-response-envelope';
import {
  readValueFromSecureStorage,
  saveValueToSecureStorage,
} from '@core/storage/secure-storage';
import { SECURE_STORAGE_KEYS } from '@core/storage/secure-storage-keys';
import {
  API_DEFAULT_TIMEOUT_MS,
  HTTP_HEADER_APP_PLATFORM,
  HTTP_HEADER_APP_VERSION,
  HTTP_HEADER_IDEMPOTENCY_KEY,
  HTTP_HEADER_REQUEST_ID,
} from '@shared/constants/app-constants';
import { createLogger } from '@shared/logger/logger';
import { generateUuidV4 } from '@shared/utils/generate-uuid.util';
// Stores importés lazy (via getState) pour casser les cycles au module-init.
import { useAuthenticationStore } from '@stores/authentication-store';
import { useCoachProfileStore } from '@stores/coach-profile-store';
import { useAthleteProfileStore } from '@stores/athlete-profile-store';

const logger = createLogger('ApiClient');

// ─── Instance Axios partagée ─────────────────────────────────────────────────
//
// Une seule instance pour TOUTE l'app. Tous les data-sources passent par elle.
// Aucun screen ni hook ne doit appeler `axios.<method>` directement.
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type':                'application/json',
    'Accept':                      'application/json',
    [HTTP_HEADER_APP_VERSION]:     APP_VERSION,
    [HTTP_HEADER_APP_PLATFORM]:    APP_PLATFORM,
  },
});

// Single-flight refresh token — toutes les requêtes 401 concurrentes attendent
// le MÊME appel /auth/refresh, évite N appels parallèles inutiles.
let tokenRefreshInProgress: Promise<string | null> | null = null;

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
//
// Trois responsabilités :
//   1. Injecter le Bearer access token
//   2. Générer (ou propager) un X-Request-Id par requête
//   3. Conserver le compteur `_retryAttemptCount` à travers les retries
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // ── 1. Auth token ──────────────────────────────────────────────────────
    // Path rapide : token in-memory (Zustand) — sync, zero IO.
    const inMemoryToken = useAuthenticationStore.getState().accessToken;
    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    } else {
      // Path lent : storage chiffré (cold start, store pas hydraté).
      const savedAccessToken = await readValueFromSecureStorage(
        SECURE_STORAGE_KEYS.accessToken,
      );
      if (savedAccessToken) {
        config.headers.Authorization = `Bearer ${savedAccessToken}`;
      }
    }

    // ── 2. X-Request-Id — généré côté client, propagé jusqu'au backend ───
    //
    // Si le caller a déjà mis un X-Request-Id (cas du retry ou d'un caller
    // qui veut tracer une opération composite), on le respecte. Sinon on
    // génère un UUID v4. Backend renvoie le même ID en réponse (cf. filter).
    if (!config.headers[HTTP_HEADER_REQUEST_ID]) {
      config.headers[HTTP_HEADER_REQUEST_ID] = generateUuidV4();
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
//
// Trois responsabilités, dans cet ordre :
//   1. Si 401 et non-déjà-tenté → rafraîchir le token et retry
//   2. Si erreur transitoire (network, 502/503/504) → retry exponentiel
//   3. Sinon → propager l'erreur au caller
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config as RetryableRequestConfig & {
      _refreshAttempted?: boolean;
    } | undefined;

    if (!originalConfig) {
      return Promise.reject(error);
    }

    // ── Couche 1 : refresh token (401) ────────────────────────────────────
    const isTokenExpiredError       = error.response?.status === 401;
    const hasNotAlreadyRefreshed    = !originalConfig._refreshAttempted;
    const isNotTheRefreshEndpoint   = !originalConfig.url?.includes(
      API_ENDPOINTS.authentication.refreshToken,
    );

    if (isTokenExpiredError && hasNotAlreadyRefreshed && isNotTheRefreshEndpoint) {
      originalConfig._refreshAttempted = true;
      try {
        const newAccessToken = await refreshAccessTokenSafely();
        if (newAccessToken) {
          originalConfig.headers = originalConfig.headers ?? {};
          (originalConfig.headers as Record<string, string>)['Authorization'] =
            `Bearer ${newAccessToken}`;
          return apiClient(originalConfig);
        }
      } catch (refreshError) {
        logger.warn('Refresh token flow failed, clearing session', refreshError);
        await deleteAllSavedUserCredentials();
      }
    }

    // ── Couche 2 : retry exponentiel pour erreurs transitoires ─────────────
    if (shouldRetryAxiosError(error)) {
      try {
        return await retryAxiosRequest(
          (configWithUpdatedCounter) => apiClient(configWithUpdatedCounter),
          originalConfig,
        );
      } catch (retryError) {
        // L'erreur du dernier retry est renvoyée au caller. Pas de log
        // bruyant ici : le logger des data-sources / convertAnyErrorToAppError
        // s'en charge contextuellement.
        return Promise.reject(retryError);
      }
    }

    return Promise.reject(error);
  },
);

// ─── Shape de la réponse /auth/refresh ───────────────────────────────────────
// Inclut le `user` optionnel pour pouvoir rafraîchir l'identité locale sans
// un appel /users/profile supplémentaire.
interface RefreshResponseData {
  accessToken:  string;
  refreshToken: string;
  user?: {
    email?:           string;
    firstName?:       string;
    lastName?:        string;
    profilePhotoUrl?: string;
  };
}

// ─── refreshAccessTokenSafely ────────────────────────────────────────────────
//
// Single-flight : si plusieurs requêtes échouent à 401 simultanément, elles
// partagent la même promesse de refresh.
//
// Throws (pas return null) si pas de refresh en storage — la session est
// définitivement perdue, le caller doit forcer le logout.
async function refreshAccessTokenSafely(): Promise<string | null> {
  if (tokenRefreshInProgress) {
    return tokenRefreshInProgress;
  }

  tokenRefreshInProgress = (async () => {
    const savedRefreshToken = await readValueFromSecureStorage(
      SECURE_STORAGE_KEYS.refreshToken,
    );

    if (!savedRefreshToken) {
      throw new Error('No refresh token in storage — session expired');
    }

    // Bypass volontaire de l'instance apiClient pour éviter une boucle infinie
    // si l'endpoint /refresh retournait 401 (case dégénéré).
    // On réutilise le SHAPE typé `BackendSuccessEnvelope` au lieu de redéfinir
    // l'enveloppe inline (DRY + alignement contractuel garanti).
    const httpResponse = await axios.post<BackendSuccessEnvelope<RefreshResponseData>>(
      `${API_BASE_URL}${API_ENDPOINTS.authentication.refreshToken}`,
      { refreshToken: savedRefreshToken },
      {
        headers: {
          'Content-Type':            'application/json',
          [HTTP_HEADER_APP_VERSION]: APP_VERSION,
          [HTTP_HEADER_REQUEST_ID]:  generateUuidV4(),
        },
      },
    );

    const refreshPayload = unwrapBackendEnvelope(httpResponse);

    await saveValueToSecureStorage(SECURE_STORAGE_KEYS.accessToken,  refreshPayload.accessToken);
    await saveValueToSecureStorage(SECURE_STORAGE_KEYS.refreshToken, refreshPayload.refreshToken);

    if (refreshPayload.user) {
      await useAuthenticationStore.getState().refreshUserIdentity(refreshPayload.user);
    }

    return refreshPayload.accessToken;
  })();

  try {
    return await tokenRefreshInProgress;
  } finally {
    tokenRefreshInProgress = null;
  }
}

// ─── deleteAllSavedUserCredentials ───────────────────────────────────────────
//
// Wipe COMPLET de la session locale + redirection vers l'écran de login.
// Appelé quand le refresh échoue (token révoqué, expiré, secret tourné backend).
async function deleteAllSavedUserCredentials(): Promise<void> {
  await useAuthenticationStore.getState().clearAllDataOnLogout();
  useCoachProfileStore.getState().clearCoachProfile();
  useAthleteProfileStore.getState().clearAthleteProfile();
  router.replace('/(public)/login');
}

// ─── withIdempotencyKey ──────────────────────────────────────────────────────
//
// Helper à utiliser dans les data-sources pour les POST critiques (paiement,
// register, etc.). Génère un UUID unique côté client et l'envoie en
// `X-Idempotency-Key`. Le backend pourra l'utiliser pour dédupliquer si on
// implémente le middleware d'idempotence (cf. roadmap audit).
//
// Pour l'instant le backend dédoublonne déjà via les contraintes uniques
// (stripePaymentIntentId, email) ; ce helper PRÉPARE le terrain pour un
// middleware d'idempotence générique sans casser l'API.
export function withIdempotencyKey(
  config: AxiosRequestConfig = {},
): AxiosRequestConfig {
  return {
    ...config,
    headers: {
      ...config.headers,
      [HTTP_HEADER_IDEMPOTENCY_KEY]: generateUuidV4(),
    },
  };
}

export { apiClient };
