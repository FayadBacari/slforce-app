import { StyleSheet } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildForgotPasswordStyles(theme: AppTheme) {
  return StyleSheet.create({
    keyboardAvoider: {
      flex: 1,
    },
    scrollContent: {
      flexGrow:          1,
      paddingHorizontal: 20,
      paddingTop:        100,
      paddingBottom:     60,
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
      fontSize:   16,
      color:      COLORS.brand.primary,
      marginTop:  6,
      textAlign:  'center',
    },
    formSection: {
      gap: 16,
    },
    actionsSection: {
      gap:       20,
      marginTop: 28,
    },
    backToLoginRow: {
      flexDirection:  'row',
      justifyContent: 'center',
      alignItems:     'center',
      gap:            6,
    },
    backToLoginText: {
      fontSize: 14,
      color:    theme.colors.textSecondary,
    },
    backToLoginAccent: {
      fontSize:   14,
      color:      theme.colors.brandPrimary,
      fontWeight: '600',
    },
    successBanner: {
      backgroundColor: COLORS.brand.primarySubtle,
      borderRadius:    12,
      padding:         16,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.brandPrimary,
      gap:             4,
    },
    successBannerTitle: {
      fontSize:   15,
      fontWeight: '600',
      color:      theme.colors.brandPrimary,
    },
    successBannerMessage: {
      fontSize:   13,
      color:      theme.colors.textSecondary,
      lineHeight: 20,
    },
  });
}
