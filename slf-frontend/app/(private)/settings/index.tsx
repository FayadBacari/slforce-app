import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@shared/theme/theme-provider';
import { useAuthenticationStore } from '@stores/authentication-store';
import { authenticationRepository } from '@modules/authentication/data/repositories/authentication.repository';
import { disconnectCurrentUserFromStreamChat } from '@core/stream-chat/stream-chat-client';
import {
  APP_ROUTES,
  buildSettingsRoute,
  pushRoute,
  replaceRoute,
} from '@shared/navigation/app-routes';
import { createLogger } from '@shared/logger/logger';
import { buildSettingsIndexStyles } from '@screen-styles/settings/index.styles';

// Type alias permettant à TypeScript de garantir que `navigateTo()` ne reçoit
// que des sub-pages connues — supprime un magic-string runtime.
type SettingsSubPage = Parameters<typeof buildSettingsRoute>[0];

const logger = createLogger('SettingsIndex');

export default function SettingsIndexPage(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme, toggleDarkMode } = useTheme();
  const loggedInUser         = useAuthenticationStore((store) => store.loggedInUser);
  const clearAllDataOnLogout = useAuthenticationStore((store) => store.clearAllDataOnLogout);

  const isCoach = loggedInUser?.role === 'coach';
  const styles  = useMemo(() => buildSettingsIndexStyles(theme), [theme]);

  // Shows a confirmation dialog before logging out
  const askUserToConfirmLogout = useCallback((): void => {
    Alert.alert(
      t('settings.logoutConfirmTitle'),
      t('settings.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text:    t('settings.logout'),
          style:   'destructive',
          onPress: handleLogoutConfirmed,
        },
      ],
    );
  }, [t]);

  async function handleLogoutConfirmed(): Promise<void> {
    try {
      await authenticationRepository.logoutCurrentUser();
    } catch (logoutError) {
      // Best-effort : on continue même si l'appel serveur échoue (token expiré
      // par exemple) — la session locale est nettoyée juste après.
      logger.warn('Server logout call failed, continuing local cleanup', logoutError);
    }
    await disconnectCurrentUserFromStreamChat();
    await clearAllDataOnLogout();
    replaceRoute(APP_ROUTES.public.login);
  }

  const navigateTo = useCallback(
    (subPage: SettingsSubPage): void => {
      pushRoute(buildSettingsRoute(subPage));
    },
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('settings.title')}</Text>
          {loggedInUser && (
            <Text style={styles.headerSubtitle}>
              {loggedInUser.firstName} {loggedInUser.lastName} ·{' '}
              <Text style={styles.roleBadge}>
                {isCoach ? t('auth.roleCoach') : t('auth.roleAthlete')}
              </Text>
            </Text>
          )}
        </View>

        {/* Account section */}
        <Text style={styles.sectionHeader}>{t('settings.account')}</Text>
        <View style={styles.card}>
          <SettingsRow icon="👤" label={t('settings.profileSettings')} onPress={() => navigateTo('profile-settings')} styles={styles} />
          <View style={styles.divider} />
          <SettingsRow icon="🔒" label={t('settings.privacySettings')} onPress={() => navigateTo('privacy-settings')} styles={styles} />
          {isCoach && (
            <>
              <View style={styles.divider} />
              <SettingsRow icon="🏦" label={t('settings.bankAccount')}  onPress={() => navigateTo('bank-account')}    styles={styles} />
              <View style={styles.divider} />
              <SettingsRow icon="📊" label={t('settings.paymentChart')} onPress={() => navigateTo('payment-chart')}   styles={styles} />
            </>
          )}
          {!isCoach && (
            <>
              <View style={styles.divider} />
              <SettingsRow icon="💳" label={t('settings.paymentHistory')} onPress={() => navigateTo('payment-history')} styles={styles} />
            </>
          )}
        </View>

        {/* Preferences section */}
        <Text style={styles.sectionHeader}>Préférences</Text>
        <View style={styles.card}>
          <SettingsRow icon="🌙" label={t('settings.darkMode')} onPress={toggleDarkMode} showChevron={false} styles={styles} />
          <View style={styles.divider} />
          <SettingsRow icon="🌐" label={t('settings.language')} onPress={() => navigateTo('language')} styles={styles} />
        </View>

        {/* Help section */}
        <Text style={styles.sectionHeader}>Aide</Text>
        <View style={styles.card}>
          <SettingsRow icon="💬" label={t('settings.support')} onPress={() => navigateTo('support')} styles={styles} />
        </View>

        {/* Danger zone */}
        <Text style={styles.sectionHeader}>Zone de danger</Text>
        <View style={styles.card}>
          <SettingsRow icon="🗑️" label={t('settings.deleteAccount')} onPress={() => navigateTo('delete-account')} isDanger styles={styles} />
        </View>

        {/* Logout button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={askUserToConfirmLogout}
          accessibilityRole="button"
          accessibilityLabel={t('settings.logout')}
        >
          <Text style={styles.logoutButtonLabel}>{t('settings.logout')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon:        string;
  label:       string;
  onPress:     () => void;
  isDanger?:   boolean;
  showChevron?: boolean;
  styles:      ReturnType<typeof buildSettingsIndexStyles>;
}

// React.memo : la liste de settings ré-render à chaque toggle dark mode.
// Sans memo, les 7 rows recréent leur arbre alors que rien ne change.
const SettingsRow = memo(function SettingsRow({
  icon,
  label,
  onPress,
  isDanger = false,
  showChevron = true,
  styles,
}: SettingsRowProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, isDanger && styles.dangerLabel]}>{label}</Text>
      {showChevron && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
});
