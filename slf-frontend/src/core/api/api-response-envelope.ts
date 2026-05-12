// ─── BACKEND RESPONSE ENVELOPES ───────────────────────────────────────────────
//
// Le backend NestJS enveloppe chaque réponse dans un shape constant :
//   - Succès : { success: true,  data: <ce que le controller a retourné> }
//   - Erreur : { success: false, statusCode, message, ... }  (cf. api-error-handler.ts)
//
// Les helpers ici déballent l'enveloppe pour que le reste de l'app travaille
// avec des shapes domaine propres (zéro chaîne `data.data.data`).

import type { AxiosResponse } from 'axios';

// Shape exacte de toute réponse de succès. DOIT correspondre à
// `SuccessResponseEnvelope` côté backend (`response-envelope.interceptor.ts`).
export interface BackendSuccessEnvelope<TData> {
  success: true;
  data:    TData;
}

// ─── unwrapBackendEnvelope ────────────────────────────────────────────────────
//
// Extrait `data` d'une réponse Axios qu'on attend wrappée par notre backend.
//
// Stratégie STRICTE (changement vs précédent) :
//   • Si la shape est bien `{ success: true, data: ... }` → renvoie `data`.
//   • Si la shape ne match pas → THROW immédiatement.
//
// Avant, un fallback silencieux renvoyait `responseBody as TData` quand
// l'enveloppe n'était pas reconnue. Ça masquait des bugs sérieux (endpoint
// qui oubliait l'interceptor, status 204 No Content qui n'a pas d'enveloppe,
// version de l'API qui dérive, etc.).
//
// EXCEPTION : status HTTP 204 No Content. Axios renvoie `data: ''` (string
// vide) — comportement standard. Dans ce cas on renvoie undefined sans
// throw, parce que le caller s'attend de toute façon à `Promise<void>`.
export function unwrapBackendEnvelope<TData>(
  axiosResponse: AxiosResponse<BackendSuccessEnvelope<TData>>,
): TData {
  // 204 No Content — pas de body, le caller doit gérer Promise<void> côté
  // appel et ne devrait normalement pas appeler ce helper. Au cas où, on
  // renvoie undefined typé comme TData (caller assume la responsabilité).
  if (axiosResponse.status === 204) {
    return undefined as unknown as TData;
  }

  const responseBody = axiosResponse.data;

  if (
    responseBody &&
    typeof responseBody === 'object' &&
    'success' in responseBody &&
    (responseBody as { success: unknown }).success === true &&
    'data' in responseBody
  ) {
    return (responseBody as BackendSuccessEnvelope<TData>).data;
  }

  // Shape inattendue — c'est un bug serveur ou un endpoint mal intégré.
  // On préfère un throw bruyant à un fallback silencieux qui propagerait
  // une valeur incorrecte dans tout le flow.
  throw new Error(
    `Unexpected backend response shape on ${axiosResponse.config?.url ?? '?'} : ` +
    `expected { success: true, data: ... }, got ${JSON.stringify(responseBody).slice(0, 200)}`,
  );
}
