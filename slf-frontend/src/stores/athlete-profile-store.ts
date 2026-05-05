import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { apiClient } from '@core/api/api-client';
import { API_ENDPOINTS } from '@core/api/api-endpoints';
import { unwrapBackendEnvelope, type BackendSuccessEnvelope } from '@core/api/api-response-envelope';

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

interface AthleteProfileActions {
  // Called after registration — saves onboarding data to the backend + in memory
  saveAthleteProfile:        (data: Omit<AthleteProfileState, 'isHydrated'>) => Promise<void>;
  // Mutates a single field in memory (call saveProfileToServer to persist)
  updateAthleteProfileField: (field: keyof Omit<AthleteProfileState, 'records' | 'isHydrated'>, value: string) => void;
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

interface ProfileFromServer {
  displayName?:    string;
  gender?:         string;
  weightCategory?: string;
  weightKg?:       number;
  heightCm?:       number;
  recordMuscleUp?: number;
  recordTraction?: number;
  recordDips?:     number;
  recordSquat?:    number;
}

// Maps raw server numbers to the store's string fields.
function mapServerProfileToState(p: ProfileFromServer): Omit<AthleteProfileState, 'isHydrated'> {
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
  const toNum = (v: string) => v ? Number(v) : undefined;
  return {
    displayName:    data.displayName    || undefined,
    gender:         data.gender         || undefined,
    weightCategory: data.weightCategory || undefined,
    weightKg:       toNum(data.weightKg),
    heightCm:       toNum(data.heightCm),
    recordMuscleUp: toNum(data.records.muscleUp),
    recordTraction: toNum(data.records.traction),
    recordDips:     toNum(data.records.dips),
    recordSquat:    toNum(data.records.squat),
  };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAthleteProfileStore = create<AthleteProfileStore>()(
  immer((set, get) => ({
    ...DEFAULT_PROFILE,
    isHydrated: false,

    // ── Called once after successful athlete registration ──────────────────────
    saveAthleteProfile: async (data) => {
      set((state) => { Object.assign(state, data); });
      try {
        await apiClient.put(
          API_ENDPOINTS.userProfile.updateMyProfile,
          buildServerPayload(data),
        );
      } catch {
        // Non-fatal — registration succeeded, profile can be filled later
      }
    },

    // ── In-memory mutations (no network) ──────────────────────────────────────
    updateAthleteProfileField: (field, value) => {
      set((state) => { (state as Record<string, unknown>)[field] = value; });
    },

    updateAthleteRecord: (key, value) => {
      set((state) => { state.records[key] = value; });
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
      } finally {
        set((state) => { state.isHydrated = true; });
      }
    },

    // ── Pushes current in-memory state to the backend ─────────────────────────
    saveProfileToServer: async () => {
      const s = get();
      await apiClient.put(
        API_ENDPOINTS.userProfile.updateMyProfile,
        buildServerPayload({
          displayName:    s.displayName,
          gender:         s.gender,
          weightCategory: s.weightCategory,
          weightKg:       s.weightKg,
          heightCm:       s.heightCm,
          records:        s.records,
        }),
      );
    },

    // ── Called on logout ──────────────────────────────────────────────────────
    clearAthleteProfile: () => {
      set((state) => { Object.assign(state, DEFAULT_PROFILE); state.isHydrated = false; });
    },
  })),
);
