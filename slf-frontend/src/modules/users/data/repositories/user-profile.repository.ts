// ─── User-profile repository ──────────────────────────────────────────────────
//
// Thin orchestration layer between stores/hooks and the API data source.
// Add caching, retry logic, or offline fallbacks here — callers stay untouched.
//
// Toutes les méthodes ici délèguent vers la couche `data-sources/`. Aucun
// composant ni hook ne doit appeler `apiClient` directement (cf. règle ESLint
// `no-restricted-imports` côté projet).

import {
  callGetUserProfileApiEndpoint,
  callUpdateUserProfileApiEndpoint,
  callGetPrivacySettingsApiEndpoint,
  callUpdatePrivacySettingsApiEndpoint,
  callUploadProfilePhotoApiEndpoint,
  type UserProfileRaw,
  type UploadProfilePhotoFile,
} from '../data-sources/user-profile-api.data-source';
import type { PrivacySettingsEntity } from '../../domain/entities/privacy-settings.entity';

export const userProfileRepository = {
  // ── Profile ──────────────────────────────────────────────────────────────
  getProfile:    (): Promise<UserProfileRaw> =>
    callGetUserProfileApiEndpoint(),

  // Met à jour le profil et renvoie la version persistée par le backend
  // (utile pour récupérer les valeurs coerced ou les champs générés).
  updateProfile: (payload: Partial<UserProfileRaw>): Promise<UserProfileRaw> =>
    callUpdateUserProfileApiEndpoint(payload),

  // Upload une nouvelle photo de profil multipart → Cloudinary via backend.
  // Renvoie l'URL HTTPS persistée, à stocker dans le store local + Stream.
  uploadProfilePhoto: (file: UploadProfilePhotoFile): Promise<string> =>
    callUploadProfilePhotoApiEndpoint(file),

  // ── Privacy ──────────────────────────────────────────────────────────────
  getPrivacySettings:    (): Promise<PrivacySettingsEntity> =>
    callGetPrivacySettingsApiEndpoint(),

  updatePrivacySettings: (patch: Partial<PrivacySettingsEntity>): Promise<PrivacySettingsEntity> =>
    callUpdatePrivacySettingsApiEndpoint(patch),
};
