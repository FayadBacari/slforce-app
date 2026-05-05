import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildRoleSelectionScreenStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flex:              1,
      paddingHorizontal: 20,
      paddingTop:        80,
      paddingBottom:     40,
    },
    headerSection: {
      alignItems:   'center',
      marginBottom: 48,
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
    cardsSection: {
      gap: 16,
    },
    roleCard: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius:    16,
      padding:         24,
      alignItems:      'center',
      gap:             8,
      ...Platform.select({
        ios: {
          shadowColor:   COLORS.brand.primaryDark,
          shadowOpacity: 0.10,
          shadowRadius:  10,
          shadowOffset:  { width: 0, height: 4 },
        },
        android: { elevation: 3 },
      }),
    },
    roleEmoji: {
      fontSize: 48,
    },
    roleTitle: {
      fontSize:   18,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    roleDescription: {
      fontSize:  14,
      color:     theme.colors.textSecondary,
      textAlign: 'center',
    },
    loginLink: {
      alignItems: 'center',
      marginTop:  32,
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
