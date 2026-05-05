import React, { useState } from 'react';
import {
  View, Text,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { AppLogo } from '@shared/components/app-logo/app-logo';
import { AppTextInput } from '@shared/components/app-text-input/app-text-input';
import { AppButton } from '@shared/components/app-button/app-button';
import { AppErrorMessage } from '@shared/components/app-error-message/app-error-message';
import { useTheme } from '@shared/theme/theme-provider';
import {
  validatePassword,
  validateThatPasswordsMatch,
} from '@shared/utils/validate-form-fields.util';
import { callResetPasswordApiEndpoint } from '@modules/authentication/data/data-sources/authentication-api.data-source';
import { buildResetPasswordStyles } from '@screen-styles/public/reset-password.styles';

export default function ResetPasswordPage() {
  const { theme } = useTheme();
  const router    = useRouter();
  const styles    = buildResetPasswordStyles(theme);

  // The token arrives as a URL param when the user taps the deep link in the email:
  // slforce://reset-password?token=<hex>
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [newPasswordInput,     setNewPasswordInput]     = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [isPasswordVisible,    setIsPasswordVisible]    = useState(false);
  const [newPasswordError,     setNewPasswordError]     = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [errorMessage,         setErrorMessage]         = useState<string | null>(null);
  const [isSubmitting,         setIsSubmitting]         = useState(false);

  async function handleResetPassword() {
    // Guard: token must be present (user arrived via a valid deep link)
    if (!token) {
      setErrorMessage('Lien invalide. Redemande un nouveau lien depuis l\'app.');
      return;
    }

    const newPasswordValidation     = validatePassword(newPasswordInput);
    const confirmPasswordValidation = validateThatPasswordsMatch(newPasswordInput, confirmPasswordInput);

    setNewPasswordError(newPasswordValidation);
    setConfirmPasswordError(confirmPasswordValidation);
    if (newPasswordValidation !== null || confirmPasswordValidation !== null) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await callResetPasswordApiEndpoint(token, newPasswordInput);
      // Success → back to login. replace() so the user can't navigate back here.
      router.replace('/(public)/login' as never);
    } catch {
      setErrorMessage('Le lien a expiré ou est invalide. Demande un nouveau lien de réinitialisation.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreenWrapper>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <AppLogo size="large" />
            </View>
            <Text style={styles.titleText}>Nouveau mot de passe</Text>
            <Text style={styles.subtitleText}>Choisis un mot de passe sécurisé</Text>
          </View>

          <View style={styles.formSection}>
            {errorMessage && <AppErrorMessage message={errorMessage} />}

            <AppTextInput
              label="Nouveau mot de passe"
              value={newPasswordInput}
              onChangeText={setNewPasswordInput}
              secureTextEntry={!isPasswordVisible}
              errorMessage={newPasswordError}
              placeholder="••••••••"
              rightIcon={<Text style={styles.eyeIcon}>{isPasswordVisible ? '🙈' : '👁️'}</Text>}
              onRightIconPress={() => setIsPasswordVisible((prev) => !prev)}
            />

            <AppTextInput
              label="Confirmer le mot de passe"
              value={confirmPasswordInput}
              onChangeText={setConfirmPasswordInput}
              secureTextEntry={!isPasswordVisible}
              errorMessage={confirmPasswordError}
              placeholder="••••••••"
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
            />
          </View>

          <View style={styles.actionsSection}>
            <AppButton
              label="Mettre à jour le mot de passe"
              onPress={handleResetPassword}
              isLoading={isSubmitting}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreenWrapper>
  );
}
