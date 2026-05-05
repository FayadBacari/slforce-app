import React from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme/theme-provider';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { AppTextInput } from '@shared/components/app-text-input/app-text-input';
import { AppButton } from '@shared/components/app-button/app-button';
import { AppErrorMessage } from '@shared/components/app-error-message/app-error-message';
import { AppLogo } from '@shared/components/app-logo/app-logo';
import { useLoginForm } from '../hooks/use-login-form.hook';
import { buildLoginScreenStyles } from '../styles/login-screen.styles';

export function LoginScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const styles = buildLoginScreenStyles(theme);

  const {
    emailInputValue, passwordInputValue, isPasswordVisible,
    isSubmitting, errorMessage, emailFieldError, passwordFieldError,
    setEmailInputValue, setPasswordInputValue,
    handleLoginFormSubmit, togglePasswordVisibility,
  } = useLoginForm();

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
          {/* Header — logo + title + blue subtitle (legacy SLForce signature look) */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <AppLogo size="large" />
            </View>
            <Text style={styles.titleText}>{t('auth.loginTitle')}</Text>
            <Text style={styles.subtitleText}>{t('auth.loginSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {errorMessage && (
              <AppErrorMessage message={errorMessage} />
            )}

            <AppTextInput
              label={t('auth.emailPlaceholder')}
              value={emailInputValue}
              onChangeText={setEmailInputValue}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              errorMessage={emailFieldError}
              placeholder="exemple@email.com"
              returnKeyType="next"
            />

            <AppTextInput
              label={t('auth.passwordPlaceholder')}
              value={passwordInputValue}
              onChangeText={setPasswordInputValue}
              secureTextEntry={!isPasswordVisible}
              errorMessage={passwordFieldError}
              placeholder="••••••••"
              returnKeyType="done"
              onSubmitEditing={handleLoginFormSubmit}
              rightIcon={
                <Text style={styles.showPasswordToggle}>
                  {isPasswordVisible ? '🙈' : '👁️'}
                </Text>
              }
              onRightIconPress={togglePasswordVisibility}
            />

            <TouchableOpacity
              onPress={() => router.push('/(public)/forgot-password' as never)}
              style={styles.forgotPasswordLink}
            >
              <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <AppButton
              label={t('auth.loginButton')}
              onPress={handleLoginFormSubmit}
              isLoading={isSubmitting}
              fullWidth
            />

            <View style={styles.registerPromptRow}>
              <Text style={styles.registerPromptText}>{t('auth.noAccount')}</Text>
              <TouchableOpacity
                onPress={() => router.push('/(public)/role-selection' as never)}
              >
                <Text style={styles.registerLinkText}>{t('auth.createAccount')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreenWrapper>
  );
}
