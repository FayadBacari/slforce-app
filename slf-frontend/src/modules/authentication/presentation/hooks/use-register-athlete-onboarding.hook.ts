import { useCallback, useMemo, useState } from 'react';
import { Animated } from 'react-native';
import { useAuthenticationStore } from '@stores/authentication-store';
import { usePendingRegistrationStore } from '@stores/pending-registration-store';
import { useAthleteProfileStore } from '@stores/athlete-profile-store';
import { authenticationRepository } from '../../data/repositories/authentication.repository';
import { convertAnyErrorToAppError } from '@core/api/api-error-handler';
import { connectCurrentUserToStreamChat } from '@core/stream-chat/stream-chat-client';
import { callGetStreamChatTokenApiEndpoint } from '@modules/chat/data/data-sources/chat-token-api.data-source';
import { APP_ROUTES, replaceRoute } from '@shared/navigation/app-routes';
import { ONBOARDING_FADE_DURATION_MS } from '@shared/constants/app-constants';
import { createLogger } from '@shared/logger/logger';
import { MALE_WEIGHT_CATEGORIES, FEMALE_WEIGHT_CATEGORIES } from '@modules/users/domain/constants/weight-categories';
import type { AthleteProfileData } from '../../domain/entities/user.entity';

const logger = createLogger('RegisterAthleteOnboarding');

const TOTAL_STEPS = 9;

function filterNumericInput(text: string): string {
  return text.replace(/[^0-9.]/g, '');
}

// Re-export pour ne pas casser les écrans qui importent depuis ce hook.
// La source de vérité est maintenant @modules/users/domain/constants/.
export { MALE_WEIGHT_CATEGORIES, FEMALE_WEIGHT_CATEGORIES };

export function useRegisterAthleteOnboarding() {
  const saveLoginData      = useAuthenticationStore((s) => s.saveLoginDataAfterSuccessfulLogin);
  const pendingAccount     = usePendingRegistrationStore((s) => s.pendingAccount);
  const clearPending       = usePendingRegistrationStore((s) => s.clearPendingAccountData);
  const hydrateAthleteProfile = useAthleteProfileStore((s) => s.hydrateFromRegistration);

  const [currentStep, setCurrentStep] = useState(1);
  const [fadeAnim]                    = useState(new Animated.Value(1));
  const [loading, setLoading]         = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [profileData, setProfileData] = useState<AthleteProfileData>({
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
  });

  // ── Animation between steps ─────────────────────────────────────────────────
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

  // ── Record change helper ─────────────────────────────────────────────────────
  const handleRecordChange = useCallback(
    (key: keyof AthleteProfileData['records'], value: string) => {
      const filtered = filterNumericInput(value);
      setProfileData((prev) => ({
        ...prev,
        records: { ...prev.records, [key]: filtered },
      }));
    },
    [],
  );

  // ── Final submit ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setErrorMessage('');

    if (!pendingAccount) {
      setErrorMessage('Informations de compte manquantes. Recommence depuis le début.');
      return;
    }

    setLoading(true);
    try {
      const authResult = await authenticationRepository.registerNewAthleteAccount({
        firstName:      pendingAccount.firstName,
        lastName:       pendingAccount.lastName,
        email:          pendingAccount.email,
        password:       pendingAccount.password,
        athleteProfile: profileData,
      });

      // Populate the in-memory store from the onboarding form data.
      // No network call needed — the registration endpoint already persisted everything.
      hydrateAthleteProfile(profileData);

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

      replaceRoute(APP_ROUTES.private.athleteProfile);
    } catch (unknownError) {
      const appError = convertAnyErrorToAppError(unknownError);
      setErrorMessage(appError.userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  }, [pendingAccount, profileData, hydrateAthleteProfile, clearPending, saveLoginData]);

  // ── canProceed per step ──────────────────────────────────────────────────────
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1: return profileData.displayName.trim().length >= 2;
      case 2: return profileData.gender === 'male' || profileData.gender === 'female';
      case 3: return profileData.weightCategory.trim().length > 0;
      case 4: return profileData.weightKg.trim().length > 0;
      case 5: return profileData.heightCm.trim().length > 0;
      case 6: return profileData.records.muscleUp.trim().length > 0;
      case 7: return profileData.records.traction.trim().length > 0;
      case 8: return profileData.records.dips.trim().length > 0;
      case 9: return profileData.records.squat.trim().length > 0;
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
    handleRecordChange,
  };
}
