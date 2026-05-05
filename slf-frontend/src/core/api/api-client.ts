import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from './api-endpoints';
import {
  readValueFromSecureStorage,
  saveValueToSecureStorage,
  deleteValueFromSecureStorage,
} from '@core/storage/secure-storage';
import { SECURE_STORAGE_KEYS } from '@core/storage/secure-storage-keys';

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
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
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

// Refreshes the access token using the refresh token.
// Uses the single-flight pattern: multiple callers share one refresh call.
async function refreshAccessTokenSafely(): Promise<string | null> {
  if (tokenRefreshInProgress) {
    return tokenRefreshInProgress;
  }

  tokenRefreshInProgress = (async () => {
    const savedRefreshToken = await readValueFromSecureStorage(
      SECURE_STORAGE_KEYS.refreshToken,
    );
    if (!savedRefreshToken) return null;

    // The backend rotates refresh tokens on every refresh, AND wraps responses
    // in the standard envelope { success: true, data: { ... } }.
    const response = await axios.post<{
      success: true;
      data: { accessToken: string; refreshToken: string };
    }>(
      `${API_BASE_URL}${API_ENDPOINTS.authentication.refreshToken}`,
      { refreshToken: savedRefreshToken },
    );

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

    await saveValueToSecureStorage(SECURE_STORAGE_KEYS.accessToken,  newAccessToken);
    await saveValueToSecureStorage(SECURE_STORAGE_KEYS.refreshToken, newRefreshToken);

    return newAccessToken;
  })();

  try {
    return await tokenRefreshInProgress;
  } finally {
    tokenRefreshInProgress = null;
  }
}

// Clears all saved credentials — called when the session is truly expired.
async function deleteAllSavedUserCredentials(): Promise<void> {
  await deleteValueFromSecureStorage(SECURE_STORAGE_KEYS.accessToken);
  await deleteValueFromSecureStorage(SECURE_STORAGE_KEYS.refreshToken);
  await deleteValueFromSecureStorage(SECURE_STORAGE_KEYS.loggedInUserId);
  await deleteValueFromSecureStorage(SECURE_STORAGE_KEYS.loggedInUserRole);
}

export { apiClient };
