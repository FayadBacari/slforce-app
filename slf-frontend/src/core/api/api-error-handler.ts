import { AxiosError } from 'axios';

// ─── BackendErrorEnvelope (wire shape) ───────────────────────────────────────
//
// Doit rester ALIGNÉ à 100% avec `ErrorResponseBody` côté backend
// (`src/core/filters/all-exceptions.filter.ts`). Toute modif là-bas doit être
// répercutée ici — voir la roadmap "Shared DTOs" pour automatiser ça.
//
// Champs :
//   • success            : toujours false (constante)
//   • statusCode         : code HTTP
//   • message            : 1er message user-friendly (ou seul message)
//   • validationErrors?  : tous les messages class-validator pour ce body
//   • errorCode?         : code machine-readable optionnel (ex: "STRIPE_NO_ACCOUNT")
//   • timestamp          : ISO date string
//   • path               : URL appelée
//   • requestId?         : correlation ID — facilite le support utilisateur
export interface BackendErrorEnvelope {
  success:           false;
  statusCode:        number;
  message:           string;
  validationErrors?: string[];
  errorCode?:        string;
  timestamp?:        string;
  path?:             string;
  requestId?:        string;
}

// ─── AppError — shape uniforme manipulée par tous les screens ────────────────
//
// Aucun screen ne doit jamais voir un AxiosError ou un Error brut. Toutes les
// erreurs passent par `convertAnyErrorToAppError` qui les normalise vers AppError.
export interface AppError {
  // Message lisible à afficher à l'utilisateur (toujours en français pour
  // l'instant — i18n côté backend à venir avec Content-Language).
  userFriendlyMessage: string;
  // Message technique pour les logs / Sentry.
  technicalMessage:    string;
  // Code HTTP si l'erreur vient du serveur, null sinon (offline, timeout, …).
  statusCode:          number | null;
  // Liste de tous les messages de validation. Le screen peut les afficher
  // un par un sous chaque champ. Null si pas une erreur de validation.
  validationErrors:    string[] | null;
  // Code business machine-readable (`STRIPE_NO_ACCOUNT`, `EMAIL_TAKEN`...).
  // Permet à l'UI de personnaliser le message ou de prendre une action
  // spécifique au-delà du simple `message` utilisateur.
  errorCode:           string | null;
  // Correlation ID propagé depuis le backend — à logger systématiquement.
  requestId:           string | null;
  // Discrimine entre "erreur HTTP avec réponse", "pas de réseau" et "timeout".
  // Permet aux screens de proposer une UX adaptée (ex: Retry sur timeout
  // immédiat, Refresh sur 5xx, Reconfigurer le wifi sur offline).
  kind:                'http' | 'offline' | 'timeout' | 'unknown';
}

// ─── convertAnyErrorToAppError ───────────────────────────────────────────────
// Converts ANY type of error (Axios, network, unknown) into a clean AppError.
export function convertAnyErrorToAppError(unknownError: unknown): AppError {
  // ── Axios errors ──────────────────────────────────────────────────────────
  if (unknownError instanceof AxiosError) {
    // No response = network failure (offline) OR timeout. Axios différencie
    // via `code === 'ECONNABORTED'` (timeout) vs absence de response (offline).
    if (!unknownError.response) {
      const isTimeout = unknownError.code === 'ECONNABORTED'
        || unknownError.message.toLowerCase().includes('timeout');

      return {
        userFriendlyMessage: isTimeout
          ? 'La requête a pris trop de temps. Réessaie.'
          : 'Pas de connexion internet. Vérifie ton réseau et réessaie.',
        technicalMessage:    unknownError.message,
        statusCode:          null,
        validationErrors:    null,
        errorCode:           null,
        requestId:           null,
        kind:                isTimeout ? 'timeout' : 'offline',
      };
    }

    // HTTP error with a server response (400, 401, 404, 500, …)
    const serverResponse = unknownError.response.data as Partial<BackendErrorEnvelope> | undefined;
    const statusCode     = unknownError.response.status;

    // Le backend renvoie aussi `X-Request-Id` en header — on le lit en priorité
    // depuis le header (toujours présent), avec fallback sur le body au cas où.
    const requestIdFromHeader =
      typeof unknownError.response.headers?.['x-request-id'] === 'string'
        ? (unknownError.response.headers['x-request-id'] as string)
        : null;

    return {
      userFriendlyMessage: serverResponse?.message ?? getMessageForStatusCode(statusCode),
      technicalMessage:    unknownError.message,
      statusCode,
      validationErrors:    serverResponse?.validationErrors ?? null,
      errorCode:           serverResponse?.errorCode        ?? null,
      requestId:           requestIdFromHeader ?? serverResponse?.requestId ?? null,
      kind:                'http',
    };
  }

  // ── Standard JavaScript error ──────────────────────────────────────────────
  if (unknownError instanceof Error) {
    return {
      userFriendlyMessage: 'Une erreur est survenue. Veuillez réessayer.',
      technicalMessage:    unknownError.message,
      statusCode:          null,
      validationErrors:    null,
      errorCode:           null,
      requestId:           null,
      kind:                'unknown',
    };
  }

  // ── Completely unknown error ───────────────────────────────────────────────
  return {
    userFriendlyMessage: 'Une erreur inattendue est survenue.',
    technicalMessage:    String(unknownError),
    statusCode:          null,
    validationErrors:    null,
    errorCode:           null,
    requestId:           null,
    kind:                'unknown',
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
