import { apiClient } from '@core/api/api-client';
import { API_ENDPOINTS } from '@core/api/api-endpoints';
import { unwrapBackendEnvelope, type BackendSuccessEnvelope } from '@core/api/api-response-envelope';
import type {
  LoginCredentials,
  AthleteRegistrationData,
  CoachRegistrationData,
  AuthenticationResult,
  UserEntity,
} from '../../domain/entities/user.entity';

interface RawAuthResponseFromServer {
  accessToken:  string;
  refreshToken: string;
  user: {
    id:               string;
    email:            string;
    firstName:        string;
    lastName:         string;
    role:             'coach' | 'athlete';
    profilePhotoUrl?: string;
    disciplines?:     string[];
    speciality?:      string;
    bio?:             string;
    location?:        string;
    monthlyRate?:     number;
    experienceYears?: number;
  };
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

export async function callLoginApiEndpoint(
  credentials: LoginCredentials,
): Promise<AuthenticationResult> {
  const response = await apiClient.post<BackendSuccessEnvelope<RawAuthResponseFromServer>>(
    API_ENDPOINTS.authentication.login,
    credentials,
  );
  return convertServerResponseToAuthResult(unwrapBackendEnvelope(response));
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
    // Profile data sent for future backend support — ignored if backend not ready
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
    // Profile data sent for future backend support — ignored if backend not ready
    coachProfile: data.coachProfile,
  });
}

export async function callForgotPasswordApiEndpoint(email: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.authentication.forgotPassword, { email });
}

export async function callResetPasswordApiEndpoint(
  token: string,
  newPassword: string,
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.authentication.resetPassword, { token, newPassword });
}

export async function callLogoutApiEndpoint(refreshToken: string | null): Promise<void> {
  if (!refreshToken) return;
  await apiClient.post(API_ENDPOINTS.authentication.logout, { refreshToken });
}

// ─── INTERNAL ────────────────────────────────────────────────────────────────

async function callRegisterApiEndpoint(
  payload: Record<string, unknown>,
): Promise<AuthenticationResult> {
  const response = await apiClient.post<BackendSuccessEnvelope<RawAuthResponseFromServer>>(
    API_ENDPOINTS.authentication.register,
    payload,
  );
  return convertServerResponseToAuthResult(unwrapBackendEnvelope(response));
}

function convertServerResponseToAuthResult(
  rawResponse: RawAuthResponseFromServer,
): AuthenticationResult {
  const cleanUser: UserEntity = {
    id:              rawResponse.user.id,
    email:           rawResponse.user.email,
    firstName:       rawResponse.user.firstName,
    lastName:        rawResponse.user.lastName,
    role:            rawResponse.user.role,
    profilePhotoUrl: rawResponse.user.profilePhotoUrl,
    createdAt:       new Date(),
    disciplines:     rawResponse.user.disciplines ?? [],
    speciality:      rawResponse.user.speciality,
    bio:             rawResponse.user.bio,
    location:        rawResponse.user.location,
    monthlyRate:     rawResponse.user.monthlyRate,
    experienceYears: rawResponse.user.experienceYears,
  };

  return {
    user:         cleanUser,
    accessToken:  rawResponse.accessToken,
    refreshToken: rawResponse.refreshToken,
  };
}
