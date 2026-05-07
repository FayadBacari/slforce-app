import { useEffect, useMemo } from 'react';
import React from 'react';
import { useAuthenticationStore } from '@stores/authentication-store';
import { useAthleteProfileStore } from '@stores/athlete-profile-store';

// Weight category lists — defined here so they're not re-created on every render.
export const WEIGHT_CATEGORIES_MALE   = ['-66', '-73', '-80', '-87', '-94', '-104', '+104'] as const;
export const WEIGHT_CATEGORIES_FEMALE = ['-52', '-63', '-70', '+70'] as const;

// Card configuration for the personal records section.
export type AthleteRecordKey = 'muscleUp' | 'traction' | 'dips' | 'squat';
export const RECORD_CARDS: {
  key:      AthleteRecordKey;
  label:    string;
  colorKey: 'recordItemRed' | 'recordItemBlue' | 'recordItemGreen' | 'recordItemYellow';
  isOnDark: boolean;
}[] = [
  { key: 'muscleUp', label: 'Muscle-Up', colorKey: 'recordItemRed',    isOnDark: false },
  { key: 'traction', label: 'Traction',  colorKey: 'recordItemBlue',   isOnDark: true  },
  { key: 'dips',     label: 'Dips',      colorKey: 'recordItemGreen',  isOnDark: false },
  { key: 'squat',    label: 'Squat',     colorKey: 'recordItemYellow', isOnDark: false },
];

// Gender options for the toggle row.
export type AthleteGender = 'male' | 'female';
export const GENDER_OPTIONS: { key: AthleteGender; label: string; emoji: string }[] = [
  { key: 'male',   label: 'HOMME', emoji: '👱'    },
  { key: 'female', label: 'FEMME', emoji: '👱‍♀️' },
];

export function useAthleteProfileScreen() {
  const loggedInUser = useAuthenticationStore((s) => s.loggedInUser);

  const {
    isHydrated,
    displayName,
    gender,
    weightCategory,
    weightKg,
    heightCm,
    records,
    fetchProfileFromServer,
    updateAthleteProfileField,
    updateAthleteRecord,
    saveProfileToServer,
  } = useAthleteProfileStore();

  // Load from backend once on mount — MongoDB is the single source of truth.
  useEffect(() => {
    if (!isHydrated) {
      void fetchProfileFromServer();
    }
  }, [isHydrated, fetchProfileFromServer]);

  // ── Edit mode toggles ──────────────────────────────────────────────────────
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [isEditingRecords, setIsEditingRecords] = React.useState(false);

  // ── Derived values ─────────────────────────────────────────────────────────

  // Sum of all four personal records (the "Total Street Lifting" stat).
  const totalKilograms = useMemo(() => {
    return RECORD_CARDS.reduce((acc, card) => {
      const val = parseInt(records[card.key], 10);
      return acc + (Number.isFinite(val) ? val : 0);
    }, 0);
  }, [records]);

  // "@handle" shown under the avatar — display name preferred, falls back to account name.
  const handleAtUsername = (() => {
    if (displayName) return `@${displayName.toLowerCase().replace(/\s+/g, '_')}`;
    const firstName = loggedInUser?.firstName ?? '';
    const lastName  = loggedInUser?.lastName  ?? '';
    return `@${(firstName + lastName).toLowerCase().replace(/\s+/g, '_') || 'athlete'}`;
  })();

  // Normalise gender to a valid value (defaults to 'male' for category list selection).
  const currentGender = (gender === 'male' || gender === 'female') ? gender : 'male';

  // Weight categories depend on the athlete's declared gender.
  const weightCategoryList =
    currentGender === 'female' ? WEIGHT_CATEGORIES_FEMALE : WEIGHT_CATEGORIES_MALE;

  return {
    // Auth
    loggedInUser,
    // Profile store state
    displayName,
    gender,
    weightCategory,
    weightKg,
    heightCm,
    records,
    // Edit modes
    isEditingProfile,
    setIsEditingProfile,
    isEditingRecords,
    setIsEditingRecords,
    // Derived
    totalKilograms,
    handleAtUsername,
    currentGender,
    weightCategoryList,
    // Store actions
    updateAthleteProfileField,
    updateAthleteRecord,
    saveProfileToServer,
  };
}
