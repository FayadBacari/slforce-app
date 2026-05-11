import { useCallback, useMemo, useState } from 'react';
import { Animated } from 'react-native';
import { useAuthenticationStore } from '@stores/authentication-store';
import { usePendingRegistrationStore } from '@stores/pending-registration-store';
import { useCoachProfileStore } from '@stores/coach-profile-store';
import { authenticationRepository } from '../../data/repositories/authentication.repository';
import { convertAnyErrorToAppError } from '@core/api/api-error-handler';
import { connectCurrentUserToStreamChat } from '@core/stream-chat/stream-chat-client';
import { callGetStreamChatTokenApiEndpoint } from '@modules/chat/data/data-sources/chat-token-api.data-source';
import { APP_ROUTES, replaceRoute } from '@shared/navigation/app-routes';
import { ONBOARDING_FADE_DURATION_MS } from '@shared/constants/app-constants';
import { createLogger } from '@shared/logger/logger';
import {
  COACH_DISCIPLINE_OPTIONS,
  MAX_COACH_DISCIPLINES,
} from '@modules/users/domain/constants/disciplines';
import type { CoachProfileData } from '../../domain/entities/user.entity';

const logger = createLogger('RegisterCoachOnboarding');

const TOTAL_STEPS = 7;

export const SPECIALITY_OPTIONS = ['Calisthenics', 'Autre'] as const;

// Re-export pour ne pas casser les écrans qui importent depuis ce hook.
// La source de vérité est maintenant @modules/users/domain/constants/.
export {
  COACH_DISCIPLINE_OPTIONS as DISCIPLINE_OPTIONS,
  MAX_COACH_DISCIPLINES as MAX_DISCIPLINES,
};

export function useRegisterCoachOnboarding() {
  const saveLoginData     = useAuthenticationStore((s) => s.saveLoginDataAfterSuccessfulLogin);
  const pendingAccount    = usePendingRegistrationStore((s) => s.pendingAccount);
  const clearPending      = usePendingRegistrationStore((s) => s.clearPendingAccountData);
  const hydrateCoachProfile = useCoachProfileStore((s) => s.hydrateFromRegistration);

  const [currentStep, setCurrentStep] = useState(1);
  const [fadeAnim]                    = useState(new Animated.Value(1));
  const [loading, setLoading]         = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [profileData, setProfileData] = useState<CoachProfileData>({
    displayName:     '',
    speciality:      '',
    location:        '',
    pricePerMonth:   '',
    experienceYears: '',
    description:     '',
    skills:          [],
  });

  // ── Animation ───────────────────────────────────────────────────────────────
  const animateStep = useCallback((callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: ONBOARDING_FADE_DURATION_MS, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: ONBOARDING_FADE_DURATION_MS, useNativeDriver: true }),
    ]).start();
    callback();
  }, [fadeAnim]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (currentStep > 1) animateStep(() => setCurrentStep((s) => s - 1));
  }, [animateStep, currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) animateStep(() => setCurrentStep((s) => s + 1));
  }, [animateStep, currentStep]);

  // ── Selection helpers ────────────────────────────────────────────────────────
  const selectSpeciality = useCallback((speciality: string) => {
    setProfileData((prev) => ({ ...prev, speciality }));
  }, []);

  const toggleDiscipline = useCallback((discipline: string) => {
    setProfileData((prev) => {
      if (prev.skills.includes(discipline)) {
        return { ...prev, skills: prev.skills.filter((s) => s !== discipline) };
      }
      if (prev.skills.length >= MAX_COACH_DISCIPLINES) return prev;
      return { ...prev, skills: [...prev.skills, discipline] };
    });
  }, []);

  // ── Final submit ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setErrorMessage('');

    if (!pendingAccount) {
      setErrorMessage('Informations de compte manquantes. Recommence depuis le début.');
      return;
    }

    setLoading(true);
    try {
      const authResult = await authenticationRepository.registerNewCoachAccount({
        firstName:    pendingAccount.firstName,
        lastName:     pendingAccount.lastName,
        email:        pendingAccount.email,
        password:     pendingAccount.password,
        coachProfile: profileData,
      });

      // Populate the in-memory store from the onboarding form data.
      // No network call needed — the registration endpoint already persisted everything.
      hydrateCoachProfile(profileData);

      clearPending();

      await saveLoginData({
        user:         { ...authResult.user, profilePhotoUrl: authResult.user.profilePhotoUrl },
        accessToken:  authResult.accessToken,
        refreshToken: authResult.refreshToken,
      });

      // Connect to Stream Chat — token is obtainable now that the JWT is saved.
      // Best-effort : un échec ici ne doit JAMAIS bloquer l'inscription.
      try {
        const streamToken = await callGetStreamChatTokenApiEndpoint();
        await connectCurrentUserToStreamChat(
          authResult.user.id,
          `${authResult.user.firstName} ${authResult.user.lastName}`,
          authResult.user.profilePhotoUrl,
          streamToken,
        );
      } catch (chatConnectError) {
        logger.warn('Stream Chat connection failed during registration (non-fatal)', chatConnectError);
      }

      replaceRoute(APP_ROUTES.private.coachProfile);
    } catch (unknownError) {
      const appError = convertAnyErrorToAppError(unknownError);
      setErrorMessage(appError.userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  }, [pendingAccount, profileData, hydrateCoachProfile, clearPending, saveLoginData]);

  // ── canProceed per step ──────────────────────────────────────────────────────
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1: return profileData.displayName.trim().length >= 2;
      case 2: return profileData.speciality.trim().length > 0;
      case 3: return profileData.location.trim().length > 0;
      case 4: return profileData.pricePerMonth.trim().length > 0 && parseFloat(profileData.pricePerMonth) > 0;
      case 5: return profileData.experienceYears.trim().length > 0 && parseInt(profileData.experienceYears, 10) >= 0;
      case 6: return profileData.description.trim().length >= 20;
      case 7: return profileData.skills.length > 0;
      default: return false;
    }
  }, [currentStep, profileData]);

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    fadeAnim,
    profileData,
    setProfileData,
    loading,
    errorMessage,
    setErrorMessage,
    canProceed,
    handleBack,
    handleNext,
    handleSubmit,
    selectSpeciality,
    toggleDiscipline,
  };
}
