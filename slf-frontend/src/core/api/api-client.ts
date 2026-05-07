import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { router } from 'expo-router';
import { API_BASE_URL, API_ENDPOINTS } from './api-endpoints';
import {
  readValueFromSecureStorage,
  saveValueToSecureStorage,
} from '@core/storage/secure-storage';
import { SECURE_STORAGE_KEYS } from '@core/storage/secure-storage-keys';
// Imported lazily (via getState) to avoid circular dependencies at module init time.
// These are plain Zustand stores — calling .getState() outside a React component is safe.
import { useAuthenticationStore } from '@stores/authentication-store';
import { useCoachProfileStore } from '@stores/coach-profile-store';
import { useAthleteProfileStore } from '@stores/athlete-profile-store';

// One shared Axios instance for the entire app.
// Every API call goes through here and automatically gets the right headers.
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Stores the in-flight token refresh promise.
// If two requests fail at the same time, they both wait for ONE refresh
// instead of each making their own refresh request (single-flight pattern).
let tokenRefreshInProgress: Promise<string | null> | null = null;

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
// Runs before every request. Attaches the access token to the Authorization header.
// Q-03: Prefers the in-memory Zustand token (zero-cost synchronous read) and only
// falls back to SecureStorage when the store is still empty (first request on cold start).
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Fast path: read from in-memory store (no async keychain call)
    const inMemoryToken = useAuthenticationStore.getState().accessToken;
    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
      return config;
    }

    // Slow path: store not hydrated yet — fall back to SecureStorage
    const savedAccessToken = await readValueFromSecureStorage(
      SECURE_STORAGE_KEYS.accessToken,
    );
    if (savedAccessToken) {
      config.headers.Authorization = `Bearer ${savedAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
// Runs after every response.
// If the server returns a 401 (token expired), it automatically fetches a new
// token and retries the original request — transparently to the caller.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retryAttempted?: boolean;
    };

    const isTokenExpiredError = error.response?.status === 401;
    const hasNotAlreadyRetried = !originalRequest._retryAttempted;
    const isNotTheRefreshEndpointItself = !originalRequest.url?.includes(
      API_ENDPOINTS.authentication.refreshToken,
    );

    if (isTokenExpiredError && hasNotAlreadyRetried && isNotTheRefreshEndpointItself) {
      originalRequest._retryAttempted = true;

      try {
        const newAccessToken = await refreshAccessTokenSafely();
        if (newAccessToken) {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch {
        await deleteAllSavedUserCredentials();
      }
    }

    return Promise.reject(error);
  },
);

// ─── Shape of the token-refresh backend response ──────────────────────────────
// A-04: includes the optional `user` identity snapshot so we can keep
// email/firstName/lastName fresh without a separate /users/profile call.
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

// Refreshes the access token using the refresh token.
// Uses the single-flight pattern: multiple callers share one refresh call.
// Q-01: throws instead of returning null when there is no refresh token so the
// caller (response interceptor) can catch and trigger a full sign-out.
async function refreshAccessTokenSafely(): Promise<string | null> {
  if (tokenRefreshInProgress) {
    return tokenRefreshInProgress;
  }

  tokenRefreshInProgress = (async () => {
    const savedRefreshToken = await readValueFromSecureStorage(
      SECURE_STORAGE_KEYS.refreshToken,
    );

    // Q-01: no refresh token means the session is definitively expired — throw so
    // the catch block in the response interceptor can call deleteAllSavedUserCredentials.
    if (!savedRefreshToken) {
      throw new Error('No refresh token in storage — session expired');
    }

    // The backend rotates refresh tokens on every refresh, AND wraps responses
    // in the standard envelope { success: true, data: { ... } }.
    const response = await axios.post<{
      success: true;
      data: RefreshResponseData;
    }>(
      `${API_BASE_URL}${API_ENDPOINTS.authentication.refreshToken}`,
      { refreshToken: savedRefreshToken },
    );

    const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } =
      response.data.data;

    await saveValueToSecureStorage(SECURE_STORAGE_KEYS.accessToken,  newAccessToken);
    await saveValueToSecureStorage(SECURE_STORAGE_KEYS.refreshToken, newRefreshToken);

    // A-04: sync fresh identity fields into the auth store so email/firstName/lastName
    // are never stale after a long-lived session refresh.
    if (user) {
      await useAuthenticationStore.getState().refreshUserIdentity(user);
    }

    return newAccessToken;
  })();

  try {
    return await tokenRefreshInProgress;
  } finally {
    tokenRefreshInProgress = null;
  }
}

// Wipes all session data when the refresh token is expired or invalid.
// Clears SecureStorage, the auth Zustand store, and both profile stores so the
// router's auth guard sees loggedInUser === null and redirects to the login screen.
// Q-02: explicitly navigates to the login screen after clearing credentials so the
// user is never left on a protected screen with a null loggedInUser.
async function deleteAllSavedUserCredentials(): Promise<void> {
  // clearAllDataOnLogout handles SecureStorage + in-memory auth state in one call.
  await useAuthenticationStore.getState().clearAllDataOnLogout();
  // Clear whichever profile store is populated (safe to clear both).
  useCoachProfileStore.getState().clearCoachProfile();
  useAthleteProfileStore.getState().clearAthleteProfile();
  // Q-02: drive navigation imperatively so the user lands on the login screen
  // even when the auth guard hasn't re-evaluated yet.
  router.replace('/(public)/login');
}

export { apiClient };
