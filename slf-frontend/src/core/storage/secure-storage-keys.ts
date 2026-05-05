// Every key used to store sensitive data in the device's secure storage.
// Never write these strings by hand elsewhere — always import from here.
export const SECURE_STORAGE_KEYS = {
  accessToken:       'slforce_access_token',
  refreshToken:      'slforce_refresh_token',
  loggedInUserId:    'slforce_user_id',
  loggedInUserRole:  'slforce_user_role',
  profilePhotoUrl:   'slforce_profile_photo_url',
  isDarkModeEnabled: 'slforce_dark_mode',
  selectedLanguage:  'slforce_language',
  athleteProfile:    'slforce_athlete_profile',
  coachProfile:      'slforce_coach_profile',
} as const;

export type SecureStorageKey = (typeof SECURE_STORAGE_KEYS)[keyof typeof SECURE_STORAGE_KEYS];
