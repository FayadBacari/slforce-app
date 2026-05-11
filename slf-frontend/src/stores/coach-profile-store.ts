import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  callGetUserProfileApiEndpoint,
  callUpdateUserProfileApiEndpoint,
  type UserProfileRaw,
} from '@modules/users/data/data-sources/user-profile-api.data-source';
import { createLogger } from '@shared/logger/logger';

const logger = createLogger('CoachProfileStore');

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

// Champs scalaires (string) éditables un par un dans l'écran profil coach.
// Type extrait pour donner une signature précise à updateCoachProfileField()
// — élimine le besoin d'un cast `as Record<string, unknown>`.
type CoachProfileScalarField = keyof Omit<CoachProfileState, 'skills' | 'isHydrated'>;

interface CoachProfileActions {
  // Called after registration — populates in-memory state from the onboarding form.
  // Does NOT make a network call: the registration endpoint already persisted the data.
  hydrateFromRegistration: (data: Omit<CoachProfileState, 'isHydrated'>) => void;
  // Mutates a single text field in memory (no network call — use saveProfileToServer to persist)
  updateCoachProfileField: (field: CoachProfileScalarField, value: string) => void;
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
function mapServerProfileToState(profile: UserProfileRaw): Omit<CoachProfileState, 'isHydrated'> {
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

    // ── Called once after successful coach registration (in-memory only) ─────
    // The backend already persisted everything via the registration endpoint.
    hydrateFromRegistration: (data) => {
      set((state) => { Object.assign(state, data); state.isHydrated = true; });
    },

    // ── In-memory mutations (no network) ─────────────────────────────────────
    updateCoachProfileField: (field, value) => {
      // Pas de cast — le type CoachProfileScalarField restreint `field` aux
      // clés string du state, donc l'assignation est sound aux yeux de TS.
      set((state) => {
        state[field] = value;
      });
    },

    updateSkills: (skills) => {
      set((state) => { state.skills = skills; });
    },

    // ── Loads profile from backend (on app start / after login) ──────────────
    fetchProfileFromServer: async () => {
      try {
        const profile = await callGetUserProfileApiEndpoint();
        set((state) => { Object.assign(state, mapServerProfileToState(profile)); });
      } catch (fetchError) {
        // Network unavailable — store stays at defaults. La page profil
        // affichera des champs vides que le coach pourra remplir.
        logger.warn('Profile fetch failed, store stays at defaults', fetchError);
      } finally {
        set((state) => { state.isHydrated = true; });
      }
    },

    // ── Pushes current in-memory state to the backend ────────────────────────
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
      // Re-apply server-confirmed shape so any coerced values are reflected locally
      const confirmed = await callUpdateUserProfileApiEndpoint(buildServerPayload(snapshot));
      set((state) => { Object.assign(state, mapServerProfileToState(confirmed)); });
    },

    // ── Called on logout ─────────────────────────────────────────────────────
    clearCoachProfile: () => {
      set((state) => { Object.assign(state, DEFAULT_PROFILE); state.isHydrated = false; });
    },
  })),
);
