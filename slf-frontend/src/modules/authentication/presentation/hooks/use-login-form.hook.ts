import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthenticationStore } from '@stores/authentication-store';
import { authenticationRepository } from '../../data/repositories/authentication.repository';
import { convertAnyErrorToAppError } from '@core/api/api-error-handler';
import {
  validateEmailAddress,
  validateThatFieldIsNotEmpty,
} from '@shared/utils/validate-form-fields.util';
import { connectCurrentUserToStreamChat } from '@core/stream-chat/stream-chat-client';
import { apiClient } from '@core/api/api-client';
import { API_ENDPOINTS } from '@core/api/api-endpoints';
import { unwrapBackendEnvelope, type BackendSuccessEnvelope } from '@core/api/api-response-envelope';

// All the state and logic needed by the Login screen.
// The screen itself only handles display — all the logic lives here.
export function useLoginForm() {
  const router = useRouter();
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
      // Step 1: Login and get tokens + user data
      const authResult = await authenticationRepository.loginWithEmailAndPassword({
        email:    emailInputValue.trim(),
        password: passwordInputValue,
      });

      // Step 2: Save login data to the store and secure storage
      await saveLoginData({
        user:         { ...authResult.user, profilePhotoUrl: authResult.user.profilePhotoUrl },
        accessToken:  authResult.accessToken,
        refreshToken: authResult.refreshToken,
      });

      // Step 3: Connect to Stream Chat using the token from our backend.
      // The backend wraps the response in { success: true, data: { token } }
      // so we unwrap it before passing to the Stream client.
      try {
        const streamTokenResponse = await apiClient.get<BackendSuccessEnvelope<{ token: string }>>(
          API_ENDPOINTS.chat.getStreamChatToken,
        );
        const { token: streamToken } = unwrapBackendEnvelope(streamTokenResponse);
        await connectCurrentUserToStreamChat(
          authResult.user.id,
          `${authResult.user.firstName} ${authResult.user.lastName}`,
          authResult.user.profilePhotoUrl,
          streamToken,
        );
      } catch {
        // Chat connection failing should not block the login
      }

      // Step 4: Navigate to the user's profile (the home tab, like the legacy app)
      const profileRoute =
        authResult.user.role === 'coach'
          ? '/(private)/(coach)/profile'
          : '/(private)/(athlete)/profile';

      router.replace(profileRoute as never);
    } catch (unknownError) {
      const appError = convertAnyErrorToAppError(unknownError);
      setErrorMessage(appError.userFriendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [emailInputValue, passwordInputValue, validateAllFormFields, saveLoginData, router]);

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
