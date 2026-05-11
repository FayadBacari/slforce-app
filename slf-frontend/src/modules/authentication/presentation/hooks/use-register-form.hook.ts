import { useState, useCallback } from 'react';
import { usePendingRegistrationStore } from '@stores/pending-registration-store';
import { convertAnyErrorToAppError } from '@core/api/api-error-handler';
import {
  validateEmailAddress,
  validatePassword,
  validateThatPasswordsMatch,
  validateThatFieldIsNotEmpty,
} from '@shared/utils/validate-form-fields.util';
import { APP_ROUTES, pushRoute } from '@shared/navigation/app-routes';
import type { UserRole } from '@shared/types/user.types';

// Validates account info (step 0) and navigates to the multi-step onboarding.
// Does NOT call the API — the onboarding hook handles the final registration.
export function useRegisterForm(role: UserRole) {
  const savePendingAccountData = usePendingRegistrationStore(
    (s) => s.savePendingAccountData,
  );

  const [firstNameInput, setFirstNameInput]             = useState('');
  const [lastNameInput, setLastNameInput]               = useState('');
  const [emailInput, setEmailInput]                     = useState('');
  const [passwordInput, setPasswordInput]               = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [isPasswordVisible, setIsPasswordVisible]       = useState(false);
  const [isSubmitting, setIsSubmitting]                 = useState(false);
  const [errorMessage, setErrorMessage]                 = useState<string | null>(null);

  const [firstNameError, setFirstNameError]             = useState<string | null>(null);
  const [lastNameError, setLastNameError]               = useState<string | null>(null);
  const [emailError, setEmailError]                     = useState<string | null>(null);
  const [passwordError, setPasswordError]               = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const validateAllFormFields = useCallback((): boolean => {
    const firstNameValidation       = validateThatFieldIsNotEmpty(firstNameInput, 'Le prénom');
    const lastNameValidation        = validateThatFieldIsNotEmpty(lastNameInput, 'Le nom');
    const emailValidation           = validateEmailAddress(emailInput);
    const passwordValidation        = validatePassword(passwordInput);
    const confirmPasswordValidation = validateThatPasswordsMatch(passwordInput, confirmPasswordInput);

    setFirstNameError(firstNameValidation);
    setLastNameError(lastNameValidation);
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);
    setConfirmPasswordError(confirmPasswordValidation);

    return (
      firstNameValidation === null &&
      lastNameValidation === null &&
      emailValidation === null &&
      passwordValidation === null &&
      confirmPasswordValidation === null
    );
  }, [firstNameInput, lastNameInput, emailInput, passwordInput, confirmPasswordInput]);

  const handleRegisterFormSubmit = useCallback(async () => {
    setErrorMessage(null);
    const formIsValid = validateAllFormFields();
    if (!formIsValid) return;

    setIsSubmitting(true);
    try {
      // Save credentials in-memory so the onboarding screen can use them.
      savePendingAccountData({
        firstName: firstNameInput.trim(),
        lastName:  lastNameInput.trim(),
        email:     emailInput.trim(),
        password:  passwordInput,
        role,
      });

      const onboardingRoute = role === 'coach'
        ? APP_ROUTES.public.registerCoachOnboarding
        : APP_ROUTES.public.registerAthleteOnboarding;

      pushRoute(onboardingRoute);
    } catch (unknownError) {
      const appError = convertAnyErrorToAppError(unknownError);
      setErrorMessage(appError.userFriendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    firstNameInput, lastNameInput, emailInput, passwordInput,
    validateAllFormFields, savePendingAccountData, role,
  ]);

  return {
    firstNameInput, setFirstNameInput,
    lastNameInput,  setLastNameInput,
    emailInput,     setEmailInput,
    passwordInput,  setPasswordInput,
    confirmPasswordInput, setConfirmPasswordInput,
    isPasswordVisible,
    isSubmitting,
    errorMessage,
    firstNameError, lastNameError, emailError, passwordError, confirmPasswordError,
    togglePasswordVisibility: () => setIsPasswordVisible((prev) => !prev),
    handleRegisterFormSubmit,
  };
}
