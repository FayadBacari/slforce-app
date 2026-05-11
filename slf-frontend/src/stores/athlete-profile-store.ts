import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  callGetUserProfileApiEndpoint,
  callUpdateUserProfileApiEndpoint,
  type UserProfileRaw,
} from '@modules/users/data/data-sources/user-profile-api.data-source';
import { createLogger } from '@shared/logger/logger';

const logger = createLogger('AthleteProfileStore');

// ─── Shape ───────────────────────────────────────────────────────────────────

export interface AthleteProfileState {
  displayName:    string;
  gender:         'male' | 'female' | '';
  weightCategory: string;
  weightKg:       string;
  heightCm:       string;
  records: {
    muscleUp: string;
    traction: string;
    dips:     string;
    squat:    string;
  };
  isHydrated: boolean;
}

// Champs scalaires (string) éditables un par un dans l'écran profil athlète.
// `gender` est inclus mais reçoit son union restreinte côté caller : on utilise
// `string` ici pour la simplicité d'API, et on cast en type étroit dans la mutation.
type AthleteProfileScalarField = keyof Omit<AthleteProfileState, 'records' | 'isHydrated'>;

interface AthleteProfileActions {
  // Called after registration — populates in-memory state from the onboarding form.
  // Does NOT make a network call: the registration endpoint already persisted the data.
  hydrateFromRegistration:   (data: Omit<AthleteProfileState, 'isHydrated'>) => void;
  // Mutates a single scalar field in memory (call saveProfileToServer to persist)
  updateAthleteProfileField: (field: AthleteProfileScalarField, value: string) => void;
  // Mutates a single record in memory (call saveProfileToServer to persist)
  updateAthleteRecord:       (key: keyof AthleteProfileState['records'], value: string) => void;
  // Loads the athlete profile from the backend (called on app start / login)
  fetchProfileFromServer:    () => Promise<void>;
  // Pushes the current in-memory state to the backend
  saveProfileToServer:       () => Promise<void>;
  // Resets in-memory state (called on logout)
  clearAthleteProfile:       () => void;
}

type AthleteProfileStore = AthleteProfileState & AthleteProfileActions;

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: Omit<AthleteProfileState, 'isHydrated'> = {
  displayName:    '',
  gender:         '',
  weightCategory: '',
  weightKg:       '',
  heightCm:       '',
  records: {
    muscleUp: '',
    traction: '',
    dips:     '',
    squat:    '',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Maps raw server numbers to the store's string fields.
function mapServerProfileToState(p: UserProfileRaw): Omit<AthleteProfileState, 'isHydrated'> {
  return {
    displayName:    p.displayName ?? '',
    gender:         (p.gender === 'male' || p.gender === 'female') ? p.gender : '',
    weightCategory: p.weightCategory ?? '',
    weightKg:       p.weightKg  ? String(p.weightKg)  : '',
    heightCm:       p.heightCm  ? String(p.heightCm)  : '',
    records: {
      muscleUp: p.recordMuscleUp ? String(p.recordMuscleUp) : '',
      traction: p.recordTraction ? String(p.recordTraction) : '',
      dips:     p.recordDips     ? String(p.recordDips)     : '',
      squat:    p.recordSquat    ? String(p.recordSquat)    : '',
    },
  };
}

// Converts the store's string fields to the numeric payload the backend expects.
function buildServerPayload(data: Omit<AthleteProfileState, 'isHydrated'>) {
  const toNumber = (rawValue: string): number | undefined =>
    rawValue ? Number(rawValue) : undefined;
  return {
    displayName:    data.displayName    || undefined,
    gender:         data.gender         || undefined,
    weightCategory: data.weightCategory || undefined,
    weightKg:       toNumber(data.weightKg),
    heightCm:       toNumber(data.heightCm),
    recordMuscleUp: toNumber(data.records.muscleUp),
    recordTraction: toNumber(data.records.traction),
    recordDips:     toNumber(data.records.dips),
    recordSquat:    toNumber(data.records.squat),
  };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAthleteProfileStore = create<AthleteProfileStore>()(
  immer((set, get) => ({
    ...DEFAULT_PROFILE,
    isHydrated: false,

    // ── Called once after successful athlete registration (in-memory only) ───
    // The backend already persisted everything via the registration endpoint.
    hydrateFromRegistration: (data) => {
      set((state) => { Object.assign(state, data); state.isHydrated = true; });
    },

    // ── In-memory mutations (no network) ─────────────────────────────────────
    updateAthleteProfileField: (field, value) => {
      set((state) => {
        // `gender` a une union restreinte (`'male' | 'female' | ''`) ; on
        // l'accepte sous string et on contrôle au point d'entrée pour éviter
        // une valeur incohérente. Les autres champs sont des string libres.
        if (field === 'gender') {
          if (value === 'male' || value === 'female' || value === '') {
            state.gender = value;
          }
          return;
        }
        state[field] = value;
      });
    },

    updateAthleteRecord: (key, value) => {
      set((state) => { state.records[key] = value; });
    },

    // ── Loads profile from backend (on app start / after login) ──────────────
    fetchProfileFromServer: async () => {
      try {
        const profile = await callGetUserProfileApiEndpoint();
        set((state) => { Object.assign(state, mapServerProfileToState(profile)); });
      } catch (fetchError) {
        // Network unavailable — store stays at defaults. La page profil
        // affichera des champs vides que l'athlète pourra remplir.
        logger.warn('Profile fetch failed, store stays at defaults', fetchError);
      } finally {
        set((state) => { state.isHydrated = true; });
      }
    },

    // ── Pushes current in-memory state to the backend ────────────────────────
    saveProfileToServer: async () => {
      const snapshot = get();
      // Re-apply server-confirmed shape so any coerced values are reflected locally
      const confirmed = await callUpdateUserProfileApiEndpoint(buildServerPayload({
        displayName:    snapshot.displayName,
        gender:         snapshot.gender,
        weightCategory: snapshot.weightCategory,
        weightKg:       snapshot.weightKg,
        heightCm:       snapshot.heightCm,
        records:        snapshot.records,
      }));
      set((state) => { Object.assign(state, mapServerProfileToState(confirmed)); });
    },

    // ── Called on logout ─────────────────────────────────────────────────────
    clearAthleteProfile: () => {
      set((state) => { Object.assign(state, DEFAULT_PROFILE); state.isHydrated = false; });
    },
  })),
);
