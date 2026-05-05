// ─── BACKEND RESPONSE ENVELOPES ───────────────────────────────────────────────
//
// The NestJS backend wraps every response in a consistent shape:
//   - Success: { success: true,  data: <whatever the controller returned> }
//   - Error:   { success: false, statusCode, message, errorCode?, timestamp, path }
//
// Helpers in this file unwrap the envelope so the rest of the app works with
// clean domain shapes (no "data.data.data" chains).

import type { AxiosResponse } from 'axios';

// What every successful response looks like at the wire level.
export interface BackendSuccessEnvelope<TData> {
  success: true;
  data:    TData;
}

// What every error response looks like at the wire level.
export interface BackendErrorEnvelope {
  success:    false;
  statusCode: number;
  message:    string;
  errorCode?: string;
  timestamp:  string;
  path:       string;
}

// Extracts `data` from an Axios response wrapped by our backend envelope.
// Throws if the envelope shape is malformed (defensive — the backend should always send a shape).
export function unwrapBackendEnvelope<TData>(
  axiosResponse: AxiosResponse<BackendSuccessEnvelope<TData>>,
): TData {
  const responseBody = axiosResponse.data;
  if (responseBody && typeof responseBody === 'object' && 'data' in responseBody) {
    return responseBody.data;
  }
  // Fallback — some endpoints return raw bodies (e.g. legacy routes)
  return responseBody as unknown as TData;
}
