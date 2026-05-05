import React from 'react';
import { View, Text, Switch, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@shared/theme/theme-provider';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { usePrivacySettings } from '@modules/users/presentation/hooks/use-privacy-settings.hook';
import { buildPrivacySettingsStyles } from '@screen-styles/settings/privacy-settings.styles';

// ─── PrivacyToggleRow ─────────────────────────────────────────────────────────
interface PrivacyToggleRowProps {
  label:       string;
  description: string;
  value:       boolean;
  onToggle:    (newValue: boolean) => void;
  disabled:    boolean;
  brandColor:  string;
  borderColor: string;
  styles:      ReturnType<typeof buildPrivacySettingsStyles>;
}

function PrivacyToggleRow({
  label, description, value, onToggle, disabled, brandColor, borderColor, styles,
}: PrivacyToggleRowProps) {
  return (
    <View style={[styles.toggleRow, disabled && { opacity: 0.5 }]}>
      <View style={styles.toggleTextSection}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: borderColor, true: brandColor }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

// ─── PrivacySettingsPage ──────────────────────────────────────────────────────
export default function PrivacySettingsPage() {
  const { theme }  = useTheme();
  const styles     = buildPrivacySettingsStyles(theme);

  const {
    isProfilePublic,
    showOnlineStatus,
    isLoading,
    isSaving,
    error,
    update,
  } = usePrivacySettings();

  return (
    <AppScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ─── Loading skeleton ─────────────────────────────────────────── */}
        {isLoading ? (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <ActivityIndicator color={theme.colors.brandPrimary} />
          </View>
        ) : (
          <View style={styles.card}>

            {/* ── Profil public ─────────────────────────────────────────── */}
            <PrivacyToggleRow
              label="Profil public"
              description={
                isProfilePublic
                  ? 'Ton profil apparaît dans les résultats de recherche.'
                  : 'Ton profil est masqué des résultats de recherche.'
              }
              value={isProfilePublic}
              onToggle={(v) => update({ isProfilePublic: v })}
              disabled={isSaving}
              brandColor={theme.colors.brandPrimary}
              borderColor={theme.colors.border}
              styles={styles}
            />

            <View style={styles.divider} />

            {/* ── Statut en ligne ───────────────────────────────────────── */}
            <PrivacyToggleRow
              label="Statut en ligne"
              description={
                showOnlineStatus
                  ? 'Les autres voient quand tu es en ligne dans le chat.'
                  : 'Ton statut affiche "Désactivé" pour tous tes contacts.'
              }
              value={showOnlineStatus}
              onToggle={(v) => update({ showOnlineStatus: v })}
              disabled={isSaving}
              brandColor={theme.colors.brandPrimary}
              borderColor={theme.colors.border}
              styles={styles}
            />

          </View>
        )}

        {/* ─── Error banner ─────────────────────────────────────────────── */}
        {error ? (
          <Text style={{
            marginTop:  16,
            textAlign:  'center',
            fontSize:   13,
            color:      '#DC2626',
          }}>
            {error}
          </Text>
        ) : null}

      </ScrollView>
    </AppScreenWrapper>
  );
}
