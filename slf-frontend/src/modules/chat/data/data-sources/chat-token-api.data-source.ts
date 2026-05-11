import { apiClient } from '@core/api/api-client';
import { API_ENDPOINTS } from '@core/api/api-endpoints';
import { unwrapBackendEnvelope, type BackendSuccessEnvelope } from '@core/api/api-response-envelope';

// ─── Stream Chat token API ──────────────────────────────────────────────────
//
// Récupère un token Stream Chat signé par notre backend.
// Le token est scopé à l'utilisateur authentifié (le backend utilise le JWT
// pour identifier l'user) et permet au mobile de connecter le SDK Stream
// via `streamChatClient.connectUser(...)`.
//
// Cette data-source isole l'accès `apiClient` — aucun screen ni hook n'a le
// droit d'appeler `apiClient.get(API_ENDPOINTS.chat.getStreamChatToken)`
// directement. Cf. règle ESLint `no-restricted-imports` côté projet.

interface StreamChatTokenResponse {
  token: string;
}

export async function callGetStreamChatTokenApiEndpoint(): Promise<string> {
  const httpResponse = await apiClient.get<BackendSuccessEnvelope<StreamChatTokenResponse>>(
    API_ENDPOINTS.chat.getStreamChatToken,
  );
  const { token } = unwrapBackendEnvelope(httpResponse);
  return token;
}
