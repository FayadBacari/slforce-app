import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme/theme-provider';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { AppTextInput } from '@shared/components/app-text-input/app-text-input';
import { AppButton } from '@shared/components/app-button/app-button';
import { AppErrorMessage } from '@shared/components/app-error-message/app-error-message';
import { AppLogo } from '@shared/components/app-logo/app-logo';
import { APP_ROUTES, pushRoute } from '@shared/navigation/app-routes';
import { useRegisterForm } from '../hooks/use-register-form.hook';
import { buildRegisterScreenStyles } from '../styles/register-screen.styles';
import type { UserRole } from '@shared/types/user.types';

interface RegisterScreenProps {
  role: UserRole;
}

// One screen handles both athlete and coach registration.
// The only difference is the "role" prop passed in from the navigation.
export function RegisterScreen({ role }: RegisterScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => buildRegisterScreenStyles(theme), [theme]);

  const {
    firstNameInput, setFirstNameInput,
    lastNameInput,  setLastNameInput,
    emailInput,     setEmailInput,
    passwordInput,  setPasswordInput,
    confirmPasswordInput, setConfirmPasswordInput,
    isPasswordVisible,
    isSubmitting, errorMessage,
    firstNameError, lastNameError, emailError, passwordError, confirmPasswordError,
    togglePasswordVisibility,
    handleRegisterFormSubmit,
  } = useRegisterForm(role);

  const screenTitle = role === 'coach' ? t('auth.roleCoach') : t('auth.roleAthlete');

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
          {/* Header — logo + title + role subtitle (legacy SLForce signature look) */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <AppLogo size="large" />
            </View>
            <Text style={styles.titleText}>{t('auth.registerTitle')}</Text>
            <Text style={styles.subtitleText}>{screenTitle}</Text>
          </View>

          <View style={styles.formSection}>
            {errorMessage && <AppErrorMessage message={errorMessage} />}

            <View style={styles.nameRow}>
              <AppTextInput
                label={t('auth.firstNamePlaceholder')}
                value={firstNameInput}
                onChangeText={setFirstNameInput}
                autoCapitalize="words"
                errorMessage={firstNameError}
                containerStyle={styles.halfWidthInput}
              />
              <AppTextInput
                label={t('auth.lastNamePlaceholder')}
                value={lastNameInput}
                onChangeText={setLastNameInput}
                autoCapitalize="words"
                errorMessage={lastNameError}
                containerStyle={styles.halfWidthInput}
              />
            </View>

            <AppTextInput
              label={t('auth.emailPlaceholder')}
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              errorMessage={emailError}
              placeholder="exemple@email.com"
            />

            <AppTextInput
              label={t('auth.passwordPlaceholder')}
              value={passwordInput}
              onChangeText={setPasswordInput}
              secureTextEntry={!isPasswordVisible}
              errorMessage={passwordError}
              placeholder="••••••••"
              rightIcon={<Text style={styles.eyeIcon}>{isPasswordVisible ? '🙈' : '👁️'}</Text>}
              onRightIconPress={togglePasswordVisibility}
            />

            <AppTextInput
              label={t('auth.confirmPasswordPlaceholder')}
              value={confirmPasswordInput}
              onChangeText={setConfirmPasswordInput}
              secureTextEntry={!isPasswordVisible}
              errorMessage={confirmPasswordError}
              placeholder="••••••••"
              returnKeyType="done"
              onSubmitEditing={handleRegisterFormSubmit}
            />
          </View>

          <View style={styles.actionsSection}>
            <AppButton
              label={t('auth.registerButton')}
              onPress={handleRegisterFormSubmit}
              isLoading={isSubmitting}
              fullWidth
            />

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => pushRoute(APP_ROUTES.public.login)}
              accessibilityRole="link"
              accessibilityLabel={t('auth.login')}
            >
              <Text style={styles.loginLinkText}>
                {t('auth.alreadyHaveAccount')}{' '}
                <Text style={styles.loginLinkAccent}>{t('auth.login')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreenWrapper>
  );
}
