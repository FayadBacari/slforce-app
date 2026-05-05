import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { LoggedInUser } from '@shared/types/user.types';
import {
  saveValueToSecureStorage,
  readValueFromSecureStorage,
  deleteValueFromSecureStorage,
} from '@core/storage/secure-storage';
import { SECURE_STORAGE_KEYS } from '@core/storage/secure-storage-keys';

// The shape of the authentication state
interface AuthenticationState {
  loggedInUser:  LoggedInUser | null;
  accessToken:   string | null;
  refreshToken:  string | null;
  isHydrated:    boolean;   // True once we've finished reading saved data from storage
}

// The actions that can change the authentication state
interface AuthenticationActions {
  saveLoginDataAfterSuccessfulLogin: (params: {
    user: LoggedInUser;
    accessToken: string;
    refreshToken: string;
  }) => Promise<void>;

  // Updates the profile photo URL in memory AND in SecureStorage so it
  // survives app restarts. Call this after the user picks a new photo.
  updateProfilePhotoUrl: (photoUrl: string) => Promise<void>;

  // Updates disciplines in memory after the coach edits them in profile settings.
  updateDisciplines: (disciplines: string[]) => void;

  clearAllDataOnLogout: () => Promise<void>;

  restoreSessionFromDeviceStorage: () => Promise<void>;
}

type AuthenticationStore = AuthenticationState & AuthenticationActions;

// The global authentication store.
// Using immer middleware lets us write state mutations as if we were modifying
// the object directly — immer handles the immutability for us.
export const useAuthenticationStore = create<AuthenticationStore>()(
  immer((set) => ({
    // ── Initial State ──────────────────────────────────────────────────────
    loggedInUser: null,
    accessToken:  null,
    refreshToken: null,
    isHydrated:   false,

    // ── Actions ────────────────────────────────────────────────────────────

    // Called right after the user logs in or registers successfully
    saveLoginDataAfterSuccessfulLogin: async ({ user, accessToken, refreshToken }) => {
      // Save tokens + identity to secure storage so the session survives app restarts
      await saveValueToSecureStorage(SECURE_STORAGE_KEYS.accessToken,  accessToken);
      await saveValueToSecureStorage(SECURE_STORAGE_KEYS.refreshToken, refreshToken);
      await saveValueToSecureStorage(SECURE_STORAGE_KEYS.loggedInUserId,   user.id);
      await saveValueToSecureStorage(SECURE_STORAGE_KEYS.loggedInUserRole, user.role);

      // Persist the photo URL so it's available after an app restart
      if (user.profilePhotoUrl) {
        await saveValueToSecureStorage(SECURE_STORAGE_KEYS.profilePhotoUrl, user.profilePhotoUrl);
      }

      // Update the in-memory state
      set((state) => {
        state.loggedInUser = user;
        state.accessToken  = accessToken;
        state.refreshToken = refreshToken;
      });
    },

    // Updates the profile photo URL everywhere — SecureStorage + in-memory store.
    // Every component reading loggedInUser.profilePhotoUrl (AppAvatar, profile pages,
    // search avatars) will re-render automatically via Zustand subscriptions.
    updateProfilePhotoUrl: async (photoUrl: string) => {
      await saveValueToSecureStorage(SECURE_STORAGE_KEYS.profilePhotoUrl, photoUrl);
      set((state) => {
        if (state.loggedInUser) {
          state.loggedInUser.profilePhotoUrl = photoUrl;
        }
      });
    },

    // Updates disciplines in memory — called after the coach saves them in profile settings
    updateDisciplines: (disciplines: string[]) => {
      set((state) => {
        if (state.loggedInUser) {
          state.loggedInUser.disciplines = disciplines;
        }
      });
    },

    // Called when the user logs out — clears everything
    clearAllDataOnLogout: async () => {
      await deleteValueFromSecureStorage(SECURE_STORAGE_KEYS.accessToken);
      await deleteValueFromSecureStorage(SECURE_STORAGE_KEYS.refreshToken);
      await deleteValueFromSecureStorage(SECURE_STORAGE_KEYS.loggedInUserId);
      await deleteValueFromSecureStorage(SECURE_STORAGE_KEYS.loggedInUserRole);
      await deleteValueFromSecureStorage(SECURE_STORAGE_KEYS.profilePhotoUrl);

      set((state) => {
        state.loggedInUser = null;
        state.accessToken  = null;
        state.refreshToken = null;
      });
    },

    // Called once when the app starts — restores the session if tokens are saved.
    // profilePhotoUrl is now restored from SecureStorage so the avatar is correct
    // immediately without waiting for a network call to /users/profile.
    restoreSessionFromDeviceStorage: async () => {
      const savedAccessToken  = await readValueFromSecureStorage(SECURE_STORAGE_KEYS.accessToken);
      const savedRefreshToken = await readValueFromSecureStorage(SECURE_STORAGE_KEYS.refreshToken);
      const savedUserId       = await readValueFromSecureStorage(SECURE_STORAGE_KEYS.loggedInUserId);
      const savedUserRole     = await readValueFromSecureStorage(SECURE_STORAGE_KEYS.loggedInUserRole);
      const savedPhotoUrl     = await readValueFromSecureStorage(SECURE_STORAGE_KEYS.profilePhotoUrl);

      const hasASavedSession =
        savedAccessToken !== null &&
        savedRefreshToken !== null &&
        savedUserId !== null &&
        savedUserRole !== null;

      set((state) => {
        if (hasASavedSession) {
          state.accessToken  = savedAccessToken;
          state.refreshToken = savedRefreshToken;
          state.loggedInUser = {
            id:              savedUserId!,
            role:            savedUserRole as 'coach' | 'athlete',
            email:           '',  // Filled when the profile screen loads
            firstName:       '',
            lastName:        '',
            profilePhotoUrl: savedPhotoUrl ?? undefined,
            disciplines:     [],  // Refreshed when profile settings loads
          };
        }
        state.isHydrated = true;
      });
    },
  })),
);
