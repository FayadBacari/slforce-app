// ─── User-profile API data source ────────────────────────────────────────────
//
// Every HTTP call related to user profiles and privacy settings goes through
// here.  Stores and hooks MUST NOT import apiClient directly — they use the
// user-profile.repository.ts which delegates to these functions.

import { apiClient } from '@core/api/api-client';
import { API_ENDPOINTS } from '@core/api/api-endpoints';
import { unwrapBackendEnvelope, type BackendSuccessEnvelope } from '@core/api/api-response-envelope';
import { API_UPLOAD_TIMEOUT_MS } from '@shared/constants/app-constants';
import type { PrivacySettingsEntity } from '../../domain/entities/privacy-settings.entity';

// ─── Shared profile shape (backend DTO at the wire level) ────────────────────
// Both coach and athlete fields are optional — the server omits unused ones.
// Identity fields (id, email, firstName, lastName, role, profilePhotoUrl) are
// returned by the backend but never sent by the client in PUT/PATCH bodies.

export interface UserProfileRaw {
  // Identity — read-only from the server (never sent by the client)
  id?:              string;
  email?:           string;
  firstName?:       string;
  lastName?:        string;
  role?:            string;
  profilePhotoUrl?: string;
  // Common
  displayName?:    string;
  // Coach
  speciality?:      string;
  bio?:             string;
  location?:        string;
  monthlyRate?:     number;
  experienceYears?: number;
  disciplines?:     string[];
  // Athlete
  gender?:          string;
  weightCategory?:  string;
  weightKg?:        number;
  heightCm?:        number;
  recordMuscleUp?:  number;
  recordTraction?:  number;
  recordDips?:      number;
  recordSquat?:     number;
}

// ─── GET /users/profile ───────────────────────────────────────────────────────
export async function callGetUserProfileApiEndpoint(): Promise<UserProfileRaw> {
  const response = await apiClient.get<BackendSuccessEnvelope<UserProfileRaw>>(
    API_ENDPOINTS.userProfile.getMyProfile,
  );
  return unwrapBackendEnvelope(response);
}

// ─── PUT /users/profile ───────────────────────────────────────────────────────
// Returns the server-confirmed profile so callers can sync local state with
// whatever the backend persisted (coerced values, generated fields, etc.).
export async function callUpdateUserProfileApiEndpoint(
  payload: Partial<UserProfileRaw>,
): Promise<UserProfileRaw> {
  const response = await apiClient.put<BackendSuccessEnvelope<UserProfileRaw>>(
    API_ENDPOINTS.userProfile.updateMyProfile,
    payload,
  );
  return unwrapBackendEnvelope(response);
}

// ─── GET /users/privacy ───────────────────────────────────────────────────────
export async function callGetPrivacySettingsApiEndpoint(): Promise<PrivacySettingsEntity> {
  const response = await apiClient.get<BackendSuccessEnvelope<PrivacySettingsEntity>>(
    API_ENDPOINTS.userProfile.getPrivacySettings,
  );
  return unwrapBackendEnvelope(response);
}

// ─── PATCH /users/privacy ─────────────────────────────────────────────────────
export async function callUpdatePrivacySettingsApiEndpoint(
  patch: Partial<PrivacySettingsEntity>,
): Promise<PrivacySettingsEntity> {
  const response = await apiClient.patch<BackendSuccessEnvelope<PrivacySettingsEntity>>(
    API_ENDPOINTS.userProfile.updatePrivacySettings,
    patch,
  );
  return unwrapBackendEnvelope(response);
}

// ─── POST /users/profile/photo ────────────────────────────────────────────────
//
// Upload multipart d'une photo de profil. Le backend stocke le buffer sur
// Cloudinary et renvoie l'URL HTTPS finale.
//
// Auparavant, cet endpoint n'avait pas de data-source : les screens
// appelaient `apiClient` directement — violation de la frontière HTTP
// (cf. audit #21). Maintenant centralisé ici.
//
// Timeout custom (60s) — un upload 5MB sur 3G peut prendre 25-30s
// légitimement. React Native ajoute automatiquement la boundary multipart
// quand on passe Content-Type 'multipart/form-data' — ne PAS overrider en JSON.

export interface UploadProfilePhotoFile {
  uri:      string;
  name:     string;
  mimeType: string;
}

interface UploadProfilePhotoResponse {
  photoUrl: string;
}

export async function callUploadProfilePhotoApiEndpoint(
  file: UploadProfilePhotoFile,
): Promise<string> {
  const formData = new FormData();

  // React Native attend cet objet exact pour reconnaître un File dans FormData.
  // Le `as unknown as Blob` est nécessaire car le typage standard de FormData
  // est web-first (Blob) alors que RN accepte ce shape `{ uri, name, type }`.
  formData.append('photo', {
    uri:  file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);

  const httpResponse = await apiClient.post<BackendSuccessEnvelope<UploadProfilePhotoResponse>>(
    API_ENDPOINTS.userProfile.uploadProfilePhoto,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: API_UPLOAD_TIMEOUT_MS,
    },
  );
  return unwrapBackendEnvelope(httpResponse).photoUrl;
}
