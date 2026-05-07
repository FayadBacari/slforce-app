// ─── User-profile repository ──────────────────────────────────────────────────
//
// Thin orchestration layer between stores/hooks and the API data source.
// Add caching, retry logic, or offline fallbacks here — callers stay untouched.

import {
  callGetUserProfileApiEndpoint,
  callUpdateUserProfileApiEndpoint,
  callGetPrivacySettingsApiEndpoint,
  callUpdatePrivacySettingsApiEndpoint,
  type UserProfileRaw,
} from '../data-sources/user-profile-api.data-source';
import type { PrivacySettingsEntity } from '../../domain/entities/privacy-settings.entity';

export const userProfileRepository = {
  // ── Profile ──────────────────────────────────────────────────────────────
  getProfile:    (): Promise<UserProfileRaw> =>
    callGetUserProfileApiEndpoint(),

  updateProfile: (payload: Partial<UserProfileRaw>): Promise<void> =>
    callUpdateUserProfileApiEndpoint(payload),

  // ── Privacy ──────────────────────────────────────────────────────────────
  getPrivacySettings:    (): Promise<PrivacySettingsEntity> =>
    callGetPrivacySettingsApiEndpoint(),

  updatePrivacySettings: (patch: Partial<PrivacySettingsEntity>): Promise<PrivacySettingsEntity> =>
    callUpdatePrivacySettingsApiEndpoint(patch),
};
