import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { apiClient } from '@core/api/api-client';
import { API_ENDPOINTS } from '@core/api/api-endpoints';
import { unwrapBackendEnvelope, type BackendSuccessEnvelope } from '@core/api/api-response-envelope';

// ─── Shape ───────────────────────────────────────────────────────────────────

export interface CoachProfileState {
  displayName:     string;
  speciality:      string;
  location:        string;
  pricePerMonth:   string;
  experienceYears: string;
  description:     string;
  skills:          string[];
  isHydrated:      boolean;
}

interface CoachProfileActions {
  // Called after registration — saves onboarding data to the backend + in memory
  saveCoachProfile:        (data: Omit<CoachProfileState, 'isHydrated'>) => Promise<void>;
  // Mutates a single text field in memory (no network call — use saveProfileToServer to persist)
  updateCoachProfileField: (field: keyof Omit<CoachProfileState, 'skills' | 'isHydrated'>, value: string) => void;
  // Mutates the disciplines list in memory (no network call — use saveProfileToServer to persist)
  updateSkills:            (skills: string[]) => void;
  // Loads the coach profile from the backend (called on app start / login)
  fetchProfileFromServer:  () => Promise<void>;
  // Pushes the current in-memory state to the backend
  saveProfileToServer:     () => Promise<void>;
  // Resets in-memory state (called on logout)
  clearCoachProfile:       () => void;
}

type CoachProfileStore = CoachProfileState & CoachProfileActions;

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: Omit<CoachProfileState, 'isHydrated'> = {
  displayName:     '',
  speciality:      '',
  location:        '',
  pricePerMonth:   '',
  experienceYears: '',
  description:     '',
  skills:          [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Response shape from GET /users/profile (coach-specific fields only)
interface ProfileFromServer {
  displayName?:     string;
  speciality?:      string;
  bio?:             string;
  location?:        string;
  monthlyRate?:     number;
  experienceYears?: number;
  disciplines?:     string[];
}

// Builds the PUT body sent to PUT /users/profile.
// Omits undefined so we don't overwrite filled fields with blanks.
function buildServerPayload(data: Omit<CoachProfileState, 'isHydrated'>) {
  return {
    displayName:     data.displayName     || undefined,
    speciality:      data.speciality      || undefined,
    bio:             data.description     || undefined,
    location:        data.location        || undefined,
    monthlyRate:     data.pricePerMonth   ? Number(data.pricePerMonth)   : undefined,
    experienceYears: data.experienceYears ? Number(data.experienceYears) : undefined,
    disciplines:     data.skills,
  };
}

// Maps a raw server response to the in-memory store shape.
function mapServerProfileToState(profile: ProfileFromServer): Omit<CoachProfileState, 'isHydrated'> {
  return {
    displayName:     profile.displayName     ?? '',
    speciality:      profile.speciality      ?? '',
    location:        profile.location        ?? '',
    pricePerMonth:   profile.monthlyRate     ? String(profile.monthlyRate)     : '',
    experienceYears: profile.experienceYears ? String(profile.experienceYears) : '',
    description:     profile.bio             ?? '',
    skills:          profile.disciplines     ?? [],
  };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCoachProfileStore = create<CoachProfileStore>()(
  immer((set, get) => ({
    ...DEFAULT_PROFILE,
    isHydrated: false,

    // ── Called once after successful coach registration ────────────────────────
    saveCoachProfile: async (data) => {
      set((state) => { Object.assign(state, data); });
      // Best-effort push — if it fails the data is still in memory for this session
      // and will be re-saved the next time the user opens the profile edit screen.
      try {
        await apiClient.put(
          API_ENDPOINTS.userProfile.updateMyProfile,
          buildServerPayload(data),
        );
      } catch {
        // Non-fatal — the registration itself succeeded
      }
    },

    // ── In-memory mutations (no network) ──────────────────────────────────────
    updateCoachProfileField: (field, value) => {
      set((state) => { (state as Record<string, unknown>)[field] = value; });
    },

    updateSkills: (skills) => {
      set((state) => { state.skills = skills; });
    },

    // ── Loads profile from backend (on app start / after login) ───────────────
    fetchProfileFromServer: async () => {
      try {
        const response = await apiClient.get<BackendSuccessEnvelope<ProfileFromServer>>(
          API_ENDPOINTS.userProfile.getMyProfile,
        );
        const profile = unwrapBackendEnvelope(response);
        set((state) => { Object.assign(state, mapServerProfileToState(profile)); });
      } catch {
        // Network unavailable — store stays at defaults
        // The profile page will show empty fields that the coach can fill in
      } finally {
        set((state) => { state.isHydrated = true; });
      }
    },

    // ── Pushes current in-memory state to the backend ─────────────────────────
    saveProfileToServer: async () => {
      const snapshot = {
        displayName:     get().displayName,
        speciality:      get().speciality,
        location:        get().location,
        pricePerMonth:   get().pricePerMonth,
        experienceYears: get().experienceYears,
        description:     get().description,
        skills:          get().skills,
      };
      await apiClient.put(
        API_ENDPOINTS.userProfile.updateMyProfile,
        buildServerPayload(snapshot),
      );
    },

    // ── Called on logout ──────────────────────────────────────────────────────
    clearCoachProfile: () => {
      set((state) => { Object.assign(state, DEFAULT_PROFILE); state.isHydrated = false; });
    },
  })),
);
