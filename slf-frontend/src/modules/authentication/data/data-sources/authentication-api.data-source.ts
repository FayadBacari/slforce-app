import { apiClient, withIdempotencyKey } from '@core/api/api-client';
import { API_ENDPOINTS } from '@core/api/api-endpoints';
import { unwrapBackendEnvelope, type BackendSuccessEnvelope } from '@core/api/api-response-envelope';
import { createLogger } from '@shared/logger/logger';
import type {
  LoginCredentials,
  AthleteRegistrationData,
  CoachRegistrationData,
  AuthenticationResult,
  UserEntity,
} from '../../domain/entities/user.entity';

const logger = createLogger('AuthApi');

// ─── Wire-shape de /auth/login, /auth/register, /auth/refresh ────────────────
//
// MIRROR du DTO backend `AuthenticatedUserResponse` (auth-response.dto.ts).
// Tant que les DTOs ne sont pas partagés via package, on synchronise ici
// à la main. À déplacer dans `@slforce/shared-dto` dans une PR future.
interface RawUserFromServer {
  id:               string;
  email:            string;
  firstName:        string;
  lastName:         string;
  displayName?:     string;
  role:             'coach' | 'athlete';
  profilePhotoUrl?: string;
  disciplines?:     string[];
  speciality?:      string;
  bio?:             string;
  location?:        string;
  monthlyRate?:     number;
  experienceYears?: number;
  gender?:          string;
  weightCategory?:  string;
  weightKg?:        number;
  heightCm?:        number;
  recordMuscleUp?:  number;
  recordTraction?:  number;
  recordDips?:      number;
  recordSquat?:     number;
}

interface RawAuthResponseFromServer {
  accessToken:  string;
  refreshToken: string;
  user:         RawUserFromServer;
}

// ─── Wire-shapes des bodies (DTOs côté backend) ─────────────────────────────
//
// Avant : `Record<string, unknown>` pour le register interne — loose typing
// qui cassait la chaîne de type-safety. Maintenant un type strict par body.

// Body envoyé sur POST /auth/register pour un athlète
interface RegisterAthleteRequestBody {
  role:           'athlete';
  firstName:      string;
  lastName:       string;
  email:          string;
  password:       string;
  athleteProfile: AthleteRegistrationData['athleteProfile'];
}

// Body envoyé sur POST /auth/register pour un coach
interface RegisterCoachRequestBody {
  role:         'coach';
  firstName:    string;
  lastName:     string;
  email:        string;
  password:     string;
  coachProfile: CoachRegistrationData['coachProfile'];
}

type RegisterRequestBody = RegisterAthleteRequestBody | RegisterCoachRequestBody;

// Body sur POST /auth/forgot-password — typé pour résister au drift.
interface ForgotPasswordRequestBody {
  email: string;
}

// Body sur POST /auth/reset-password.
interface ResetPasswordRequestBody {
  token:       string;
  newPassword: string;
}

// Body sur POST /auth/logout.
interface LogoutRequestBody {
  refreshToken: string;
}

// Shape renvoyé par forgot/reset-password (1 ligne mais on l'exprime
// proprement pour conserver le contrat HTTP côté caller).
interface SimpleMessageResponse {
  message: string;
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

export async function callLoginApiEndpoint(
  credentials: LoginCredentials,
): Promise<AuthenticationResult> {
  const httpResponse = await apiClient.post<BackendSuccessEnvelope<RawAuthResponseFromServer>>(
    API_ENDPOINTS.authentication.login,
    credentials,
  );
  return convertServerResponseToAuthResult(unwrapBackendEnvelope(httpResponse));
}

export async function callRegisterAthleteApiEndpoint(
  data: AthleteRegistrationData,
): Promise<AuthenticationResult> {
  return callRegisterApiEndpoint({
    role:      'athlete',
    firstName: data.firstName,
    lastName:  data.lastName,
    email:     data.email,
    password:  data.password,
    athleteProfile: data.athleteProfile,
  });
}

export async function callRegisterCoachApiEndpoint(
  data: CoachRegistrationData,
): Promise<AuthenticationResult> {
  return callRegisterApiEndpoint({
    role:      'coach',
    firstName: data.firstName,
    lastName:  data.lastName,
    email:     data.email,
    password:  data.password,
    coachProfile: data.coachProfile,
  });
}

// `Promise<string>` au lieu de `void` : on remonte le message backend
// (utile en dev pour afficher le lien de reset depuis la log Resend, ou
// pour confirmer à l'utilisateur que l'email a été pris en compte).
export async function callForgotPasswordApiEndpoint(email: string): Promise<string> {
  const body: ForgotPasswordRequestBody = { email };
  const httpResponse = await apiClient.post<BackendSuccessEnvelope<SimpleMessageResponse>>(
    API_ENDPOINTS.authentication.forgotPassword,
    body,
  );
  return unwrapBackendEnvelope(httpResponse).message;
}

export async function callResetPasswordApiEndpoint(
  token:       string,
  newPassword: string,
): Promise<string> {
  const body: ResetPasswordRequestBody = { token, newPassword };
  const httpResponse = await apiClient.post<BackendSuccessEnvelope<SimpleMessageResponse>>(
    API_ENDPOINTS.authentication.resetPassword,
    body,
  );
  return unwrapBackendEnvelope(httpResponse).message;
}

// ─── callLogoutApiEndpoint ───────────────────────────────────────────────────
//
// Renforcement vs version précédente :
//   • Accepte `string | null` mais LOG explicitement si null (au lieu d'un
//     silent return qui masquait des bugs callers).
//   • Body typé `LogoutRequestBody`.
//   • Erreurs réseau swallowées car le logout côté UI doit toujours réussir
//     localement (clearAllDataOnLogout dans le store) — le serveur peut être
//     down sans bloquer la déconnexion utilisateur.
export async function callLogoutApiEndpoint(refreshToken: string | null): Promise<void> {
  if (!refreshToken) {
    logger.warn('callLogoutApiEndpoint called without refresh token — server revoke skipped');
    return;
  }

  const body: LogoutRequestBody = { refreshToken };
  try {
    await apiClient.post(API_ENDPOINTS.authentication.logout, body);
  } catch (logoutError) {
    // Best-effort : le serveur peut être down ou le token déjà révoqué.
    // L'utilisateur doit pouvoir se déconnecter localement quoi qu'il arrive.
    logger.warn('Server-side logout failed (non-fatal)', logoutError);
  }
}

// ─── INTERNAL ────────────────────────────────────────────────────────────────

async function callRegisterApiEndpoint(
  body: RegisterRequestBody,
): Promise<AuthenticationResult> {
  // POST /auth/register est CRITIQUE : un double-tap mobile pourrait tenter
  // deux créations de compte. Le backend dédouble via l'index unique sur
  // email (409 Conflict) mais on envoie quand même une Idempotency-Key
  // pour préparer le middleware backend d'idempotence générique.
  const httpResponse = await apiClient.post<BackendSuccessEnvelope<RawAuthResponseFromServer>>(
    API_ENDPOINTS.authentication.register,
    body,
    withIdempotencyKey(),
  );
  return convertServerResponseToAuthResult(unwrapBackendEnvelope(httpResponse));
}

function convertServerResponseToAuthResult(
  rawResponse: RawAuthResponseFromServer,
): AuthenticationResult {
  const cleanUser: UserEntity = {
    id:              rawResponse.user.id,
    email:           rawResponse.user.email,
    firstName:       rawResponse.user.firstName,
    lastName:        rawResponse.user.lastName,
    displayName:     rawResponse.user.displayName,
    role:            rawResponse.user.role,
    profilePhotoUrl: rawResponse.user.profilePhotoUrl,
    // `createdAt` n'est pas renvoyé par le backend sur /auth — on n'invente
    // pas une date locale (qui serait factuellement fausse et trompeuse).
    // Le champ est laissé `undefined` ; le profil complet GET /users/profile
    // peut être appelé séparément pour récupérer la vraie date.
    createdAt:       undefined,
    disciplines:     rawResponse.user.disciplines ?? [],
    speciality:      rawResponse.user.speciality,
    bio:             rawResponse.user.bio,
    location:        rawResponse.user.location,
    monthlyRate:     rawResponse.user.monthlyRate,
    experienceYears: rawResponse.user.experienceYears,
    gender:          rawResponse.user.gender,
    weightCategory:  rawResponse.user.weightCategory,
    weightKg:        rawResponse.user.weightKg,
    heightCm:        rawResponse.user.heightCm,
    recordMuscleUp:  rawResponse.user.recordMuscleUp,
    recordTraction:  rawResponse.user.recordTraction,
    recordDips:      rawResponse.user.recordDips,
    recordSquat:     rawResponse.user.recordSquat,
  };

  return {
    user:         cleanUser,
    accessToken:  rawResponse.accessToken,
    refreshToken: rawResponse.refreshToken,
  };
}
