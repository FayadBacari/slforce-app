import { StyleSheet } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

// Mirrors the legacy "registerAthlete.ts" / "registerCoach.ts" design.
export function buildRegisterScreenStyles(theme: AppTheme) {
  return StyleSheet.create({
    keyboardAvoider: {
      flex: 1,
    },
    scrollContent: {
      flexGrow:          1,
      paddingHorizontal: 20,
      paddingTop:        100,
      paddingBottom:     80,
    },
    headerSection: {
      alignItems:   'center',
      marginBottom: 40,
    },
    logoContainer: {
      marginBottom: 20,
    },
    titleText: {
      fontSize:   28,
      fontWeight: 'bold',
      color:      theme.colors.textPrimary,
      textAlign:  'center',
    },
    subtitleText: {
      fontSize:  16,
      color:     COLORS.brand.primary,
      marginTop: 6,
      textAlign: 'center',
    },
    formSection: {
      gap: 16,
    },
    nameRow: {
      flexDirection: 'row',
      gap:           12,
    },
    halfWidthInput: {
      flex: 1,
    },
    eyeIcon: {
      fontSize: 18,
    },
    actionsSection: {
      gap:       20,
      marginTop: 28,
    },
    loginLink: {
      alignSelf:       'center',
      paddingVertical: 6,
    },
    loginLinkText: {
      fontSize: 14,
      color:    theme.colors.textSecondary,
    },
    loginLinkAccent: {
      color:      theme.colors.brandPrimary,
      fontWeight: '600',
    },
  });
}
