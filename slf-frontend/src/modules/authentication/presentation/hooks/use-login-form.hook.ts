import { useState, useCallback } from 'react';
import { useAuthenticationStore } from '@stores/authentication-store';
import { authenticationRepository } from '../../data/repositories/authentication.repository';
import { convertAnyErrorToAppError } from '@core/api/api-error-handler';
import {
  validateEmailAddress,
  validateThatFieldIsNotEmpty,
} from '@shared/utils/validate-form-fields.util';
import { connectCurrentUserToStreamChat } from '@core/stream-chat/stream-chat-client';
import { callGetStreamChatTokenApiEndpoint } from '@modules/chat/data/data-sources/chat-token-api.data-source';
import { APP_ROUTES, replaceRoute } from '@shared/navigation/app-routes';
import { createLogger } from '@shared/logger/logger';

const logger = createLogger('LoginForm');

// All the state and logic needed by the Login screen.
// The screen itself only handles display — all the logic lives here.
export function useLoginForm() {
  const saveLoginData = useAuthenticationStore(
    (store) => store.saveLoginDataAfterSuccessfulLogin,
  );

  const [emailInputValue, setEmailInputValue]       = useState('');
  const [passwordInputValue, setPasswordInputValue] = useState('');
  const [isPasswordVisible, setIsPasswordVisible]   = useState(false);
  const [isSubmitting, setIsSubmitting]             = useState(false);
  const [errorMessage, setErrorMessage]             = useState<string | null>(null);

  // Field-level errors shown inline under each input
  const [emailFieldError, setEmailFieldError]       = useState<string | null>(null);
  const [passwordFieldError, setPasswordFieldError] = useState<string | null>(null);

  // Validates all fields and returns true if everything is valid
  const validateAllFormFields = useCallback((): boolean => {
    const emailError    = validateEmailAddress(emailInputValue);
    const passwordError = validateThatFieldIsNotEmpty(passwordInputValue, 'Le mot de passe');

    setEmailFieldError(emailError);
    setPasswordFieldError(passwordError);

    return emailError === null && passwordError === null;
  }, [emailInputValue, passwordInputValue]);

  const handleLoginFormSubmit = useCallback(async () => {
    setErrorMessage(null);
    const formIsValid = validateAllFormFields();
    if (!formIsValid) return;

    setIsSubmitting(true);
    try {
      // Étape 1 : login + récupération des tokens et du user
      const authResult = await authenticationRepository.loginWithEmailAndPassword({
        email:    emailInputValue.trim(),
        password: passwordInputValue,
      });

      // Étape 2 : persister la session (store + secure storage)
      await saveLoginData({
        user:         { ...authResult.user, profilePhotoUrl: authResult.user.profilePhotoUrl },
        accessToken:  authResult.accessToken,
        refreshToken: authResult.refreshToken,
      });

      // Étape 3 : connecter Stream Chat. Best-effort — un échec ici ne doit
      // PAS bloquer le login (l'écran chat affichera un état déconnecté
      // jusqu'à la prochaine retry automatique du SDK).
      try {
        const streamToken = await callGetStreamChatTokenApiEndpoint();
        await connectCurrentUserToStreamChat(
          authResult.user.id,
          `${authResult.user.firstName} ${authResult.user.lastName}`,
          authResult.user.profilePhotoUrl,
          streamToken,
        );
      } catch (chatConnectError) {
        logger.warn('Stream Chat connection failed during login (non-fatal)', chatConnectError);
      }

      // Étape 4 : router vers le profil de l'utilisateur (home tab)
      const profileRoute = authResult.user.role === 'coach'
        ? APP_ROUTES.private.coachProfile
        : APP_ROUTES.private.athleteProfile;

      replaceRoute(profileRoute);
    } catch (unknownError) {
      const appError = convertAnyErrorToAppError(unknownError);
      setErrorMessage(appError.userFriendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [emailInputValue, passwordInputValue, validateAllFormFields, saveLoginData]);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((previous) => !previous);
  }, []);

  return {
    emailInputValue,
    passwordInputValue,
    isPasswordVisible,
    isSubmitting,
    errorMessage,
    emailFieldError,
    passwordFieldError,
    setEmailInputValue,
    setPasswordInputValue,
    handleLoginFormSubmit,
    togglePasswordVisibility,
  };
}
