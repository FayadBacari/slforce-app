import { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import {
  API_RETRY_MAX_ATTEMPTS,
  API_RETRY_INITIAL_DELAY_MS,
  API_RETRYABLE_STATUS_CODES,
} from '@shared/constants/app-constants';

// ─── Retry policy pour erreurs HTTP transitoires ─────────────────────────────
//
// L'interceptor de réponse d'Axios (cf. api-client.ts) délègue à cette
// fonction la décision de retry. Si on retourne `true`, l'appelant relance la
// requête originale après le délai exponentiel.
//
// Cas couverts :
//   • Pas de response (offline, timeout, DNS) → retry
//   • 502/503/504 (backend transient) → retry
//   • 401 (token expiré) → PAS GÉRÉ ici, c'est l'interceptor refresh qui s'en charge
//   • 4xx autres → erreur client définitive, pas de retry
//   • Méthodes non-idempotentes (POST sans Idempotency-Key) → retry uniquement
//     si l'erreur est "pre-flight" (pas de response du tout). Une fois que le
//     serveur a répondu 5xx, on ne sait pas si le side-effect a eu lieu →
//     mieux vaut renvoyer l'erreur au caller que de risquer un double-write.

const SAFE_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface RetryableRequestConfig extends AxiosRequestConfig {
  // Compteur interne pour ne pas dépasser MAX_ATTEMPTS. Préfixé `_` car non
  // exposé volontairement aux call-sites — c'est de la plomberie interne.
  _retryAttemptCount?: number;
}

// Décide si une erreur Axios mérite un retry.
//
// Approche conservative : pour les méthodes non-idempotentes (POST, PUT, DELETE),
// on retry uniquement quand on n'a pas reçu de réponse du serveur (donc le
// side-effect ne peut pas avoir eu lieu). Si on a une réponse 5xx, le serveur
// pourrait avoir traité partiellement la requête.
export function shouldRetryAxiosError(
  error:  AxiosError,
): boolean {
  const config = error.config as RetryableRequestConfig | undefined;
  if (!config) return false;

  const attemptCount = config._retryAttemptCount ?? 0;
  if (attemptCount >= API_RETRY_MAX_ATTEMPTS - 1) {
    return false;
  }

  // Pas de réponse du serveur — soit network, soit timeout. Toujours retryable
  // (le side-effect n'a pas pu avoir lieu si la requête n'est même pas arrivée).
  if (!error.response) {
    return true;
  }

  // Réponse 5xx transitoire — retry uniquement sur méthodes SAFE (GET) car
  // on ne peut pas savoir si un POST 502 a eu son side-effect.
  const httpMethod = (config.method ?? 'GET').toUpperCase();
  const isSafeMethod = SAFE_HTTP_METHODS.has(httpMethod);
  const isRetryableStatus = API_RETRYABLE_STATUS_CODES.includes(error.response.status);

  return isSafeMethod && isRetryableStatus;
}

// Délai avant la prochaine tentative — exponential backoff binaire :
//   attempt 1 → 250ms
//   attempt 2 → 500ms
//   attempt 3 → 1000ms (jamais atteint si MAX_ATTEMPTS=3 ; bornage défensif)
export function computeRetryDelayMs(currentAttemptCount: number): number {
  return API_RETRY_INITIAL_DELAY_MS * Math.pow(2, currentAttemptCount);
}

export function sleep(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

// Helper pour exécuter une requête avec retry. Utilisé par l'interceptor de
// réponse — encapsule le pattern `attempt → sleep → retry`.
export async function retryAxiosRequest<TResponse>(
  performRequest: (config: RetryableRequestConfig) => Promise<AxiosResponse<TResponse>>,
  originalConfig: RetryableRequestConfig,
): Promise<AxiosResponse<TResponse>> {
  const previousAttempts = originalConfig._retryAttemptCount ?? 0;
  const nextAttemptIndex = previousAttempts;   // 0-indexed pour le délai

  await sleep(computeRetryDelayMs(nextAttemptIndex));

  return performRequest({
    ...originalConfig,
    _retryAttemptCount: previousAttempts + 1,
  });
}
