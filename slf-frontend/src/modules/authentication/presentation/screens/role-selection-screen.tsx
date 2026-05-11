import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme/theme-provider';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { AppLogo } from '@shared/components/app-logo/app-logo';
import { APP_ROUTES, pushRoute } from '@shared/navigation/app-routes';
import { buildRoleSelectionScreenStyles } from '../styles/role-selection-screen.styles';

export function RoleSelectionScreen(): React.JSX.Element {
  const { t }     = useTranslation();
  const { theme } = useTheme();
  const styles    = useMemo(() => buildRoleSelectionScreenStyles(theme), [theme]);

  function navigateToAthleteRegistration(): void {
    pushRoute(APP_ROUTES.public.registerAthlete);
  }

  function navigateToCoachRegistration(): void {
    pushRoute(APP_ROUTES.public.registerCoach);
  }

  function navigateToLogin(): void {
    pushRoute(APP_ROUTES.public.login);
  }

  return (
    <AppScreenWrapper>
      <View style={styles.container}>
        {/* Header — logo + title + blue subtitle */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <AppLogo size="large" />
          </View>
          <Text style={styles.titleText}>{t('auth.roleSelectionTitle')}</Text>
          <Text style={styles.subtitleText}>{t('auth.roleSelectionSubtitle')}</Text>
        </View>

        <View style={styles.cardsSection}>
          {/* Athlete card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={navigateToAthleteRegistration}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('auth.roleAthlete')}
            accessibilityHint={t('auth.roleAthleteDesc')}
          >
            <Text style={styles.roleEmoji}>🏃</Text>
            <Text style={styles.roleTitle}>{t('auth.roleAthlete')}</Text>
            <Text style={styles.roleDescription}>{t('auth.roleAthleteDesc')}</Text>
          </TouchableOpacity>

          {/* Coach card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={navigateToCoachRegistration}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('auth.roleCoach')}
            accessibilityHint={t('auth.roleCoachDesc')}
          >
            <Text style={styles.roleEmoji}>🏋️</Text>
            <Text style={styles.roleTitle}>{t('auth.roleCoach')}</Text>
            <Text style={styles.roleDescription}>{t('auth.roleCoachDesc')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={navigateToLogin}
          accessibilityRole="link"
          accessibilityLabel={t('auth.login')}
        >
          <Text style={styles.loginLinkText}>
            {t('auth.alreadyHaveAccount')}{' '}
            <Text style={styles.loginLinkAccent}>{t('auth.login')}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </AppScreenWrapper>
  );
}
