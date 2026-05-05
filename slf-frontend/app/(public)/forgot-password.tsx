import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { AppLogo } from '@shared/components/app-logo/app-logo';
import { AppTextInput } from '@shared/components/app-text-input/app-text-input';
import { AppButton } from '@shared/components/app-button/app-button';
import { useTheme } from '@shared/theme/theme-provider';
import { validateEmailAddress } from '@shared/utils/validate-form-fields.util';
import { callForgotPasswordApiEndpoint } from '@modules/authentication/data/data-sources/authentication-api.data-source';
import { buildForgotPasswordStyles } from '@screen-styles/public/forgot-password.styles';

export default function ForgotPasswordPage() {
  const { theme } = useTheme();
  const router    = useRouter();
  const styles    = buildForgotPasswordStyles(theme);

  const [emailInput,              setEmailInput]              = useState('');
  const [emailError,              setEmailError]              = useState<string | null>(null);
  const [isSubmitting,            setIsSubmitting]            = useState(false);
  const [hasSubmittedSuccessfully, setHasSubmittedSuccessfully] = useState(false);

  async function handleSendResetEmail() {
    const validationError = validateEmailAddress(emailInput);
    setEmailError(validationError);
    if (validationError !== null) return;

    setIsSubmitting(true);
    try {
      await callForgotPasswordApiEndpoint(emailInput.trim().toLowerCase());
    } catch {
      // SECURITY: always show the success screen regardless of the outcome.
      // This prevents an attacker from learning which emails are registered.
    } finally {
      setIsSubmitting(false);
      setHasSubmittedSuccessfully(true);
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
            <Text style={styles.titleText}>Mot de passe oublié</Text>
            <Text style={styles.subtitleText}>On t'envoie un lien de réinitialisation</Text>
          </View>

          {hasSubmittedSuccessfully ? (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerTitle}>📧 E-mail envoyé !</Text>
              <Text style={styles.successBannerMessage}>
                Si un compte existe avec l'adresse {emailInput}, tu recevras un lien dans
                quelques instants. Pense à vérifier tes spams.
              </Text>
            </View>
          ) : (
            <View style={styles.formSection}>
              <AppTextInput
                label="Adresse e-mail"
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="exemple@email.com"
                errorMessage={emailError}
              />
            </View>
          )}

          <View style={styles.actionsSection}>
            {!hasSubmittedSuccessfully && (
              <AppButton
                label="Envoyer le lien"
                onPress={handleSendResetEmail}
                isLoading={isSubmitting}
                fullWidth
              />
            )}

            <View style={styles.backToLoginRow}>
              <Text style={styles.backToLoginText}>Tu te souviens ?</Text>
              <TouchableOpacity onPress={() => router.replace('/(public)/login' as never)}>
                <Text style={styles.backToLoginAccent}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreenWrapper>
  );
}
