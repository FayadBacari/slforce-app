import { AxiosError } from 'axios';

interface BackendErrorResponse {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// A standard error shape that every screen in the app can rely on.
// No screen ever has to deal with raw Axios or network errors directly.
export interface AppError {
  userFriendlyMessage: string;
  technicalMessage: string;
  statusCode: number | null;
  fieldErrors: Record<string, string> | null;
}

// Converts ANY type of error (Axios, network, unknown) into a clean AppError.
export function convertAnyErrorToAppError(unknownError: unknown): AppError {
  // ── Axios errors (HTTP response OR no network) ────────────────────────────
  if (unknownError instanceof AxiosError) {
    // No response at all → device is offline or server is unreachable.
    // Checking !response is more robust than matching on the message string
    // 'Network Error', which can differ between Axios versions and environments.
    if (!unknownError.response) {
      return {
        userFriendlyMessage: 'Pas de connexion internet. Vérifie ton réseau et réessaie.',
        technicalMessage: unknownError.message,
        statusCode: null,
        fieldErrors: null,
      };
    }

    // HTTP error with a server response (400, 401, 404, 500, …)
    const serverResponse = unknownError.response.data as BackendErrorResponse | undefined;
    const statusCode     = unknownError.response.status;

    return {
      userFriendlyMessage: serverResponse?.message ?? getMessageForStatusCode(statusCode),
      technicalMessage: unknownError.message,
      statusCode,
      fieldErrors: serverResponse?.errors
        ? flattenServerFieldErrors(serverResponse.errors)
        : null,
    };
  }

  // ── Standard JavaScript error ──────────────────────────────────────────────
  if (unknownError instanceof Error) {
    return {
      userFriendlyMessage: 'Une erreur est survenue. Veuillez réessayer.',
      technicalMessage: unknownError.message,
      statusCode: null,
      fieldErrors: null,
    };
  }

  // ── Completely unknown error ───────────────────────────────────────────────
  return {
    userFriendlyMessage: 'Une erreur inattendue est survenue.',
    technicalMessage: String(unknownError),
    statusCode: null,
    fieldErrors: null,
  };
}

function getMessageForStatusCode(statusCode: number | null): string {
  switch (statusCode) {
    case 400: return 'Les informations fournies sont invalides.';
    case 401: return 'Ta session a expiré. Reconnecte-toi.';
    case 403: return "Tu n'as pas la permission d'effectuer cette action.";
    case 404: return 'La ressource demandée est introuvable.';
    case 409: return 'Cette information existe déjà.';
    case 429: return 'Trop de tentatives. Attends un moment et réessaie.';
    case 500:
    case 502:
    case 503: return 'Le serveur rencontre un problème. Réessaie dans un moment.';
    default:  return 'Une erreur est survenue. Veuillez réessayer.';
  }
}

// Turns { email: ['is required', 'is invalid'] } → { email: 'is required, is invalid' }
function flattenServerFieldErrors(
  errorsFromServer: Record<string, string[]>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const fieldName of Object.keys(errorsFromServer)) {
    const messages = errorsFromServer[fieldName];
    if (messages && messages.length > 0) {
      result[fieldName] = messages.join(', ');
    }
  }
  return result;
}
