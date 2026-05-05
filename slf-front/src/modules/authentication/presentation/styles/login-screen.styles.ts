import { StyleSheet } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

// Visual layout reproduces the legacy "home.ts" auth design from slf-frontend:
// large centered logo + bold title + blue subtitle + form below.
export function buildLoginScreenStyles(theme: AppTheme) {
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
      fontSize:   30,
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
    showPasswordToggle: {
      fontSize: 18,
    },
    forgotPasswordLink: {
      alignSelf: 'flex-end',
      paddingVertical: 4,
    },
    forgotPasswordText: {
      fontSize:   14,
      color:      theme.colors.brandPrimary,
      fontWeight: '500',
    },
    actionsSection: {
      gap:       20,
      marginTop: 24,
    },
    registerPromptRow: {
      flexDirection:  'row',
      justifyContent: 'center',
      alignItems:     'center',
      gap:            6,
    },
    registerPromptText: {
      fontSize: 14,
      color:    theme.colors.textSecondary,
    },
    registerLinkText: {
      fontSize:   14,
      color:      theme.colors.brandPrimary,
      fontWeight: '600',
    },
  });
}
