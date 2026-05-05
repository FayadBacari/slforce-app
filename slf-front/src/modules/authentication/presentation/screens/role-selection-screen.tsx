import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme/theme-provider';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { AppLogo } from '@shared/components/app-logo/app-logo';
import { buildRoleSelectionScreenStyles } from '../styles/role-selection-screen.styles';

export function RoleSelectionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const styles = buildRoleSelectionScreenStyles(theme);

  function navigateToAthleteRegistration() {
    router.push('/(public)/register-athlete' as never);
  }

  function navigateToCoachRegistration() {
    router.push('/(public)/register-coach' as never);
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
          >
            <Text style={styles.roleEmoji}>🏋️</Text>
            <Text style={styles.roleTitle}>{t('auth.roleCoach')}</Text>
            <Text style={styles.roleDescription}>{t('auth.roleCoachDesc')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.push('/(public)/login' as never)}
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
