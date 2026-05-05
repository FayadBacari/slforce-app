import { StyleSheet } from 'react-native';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildDeleteAccountStyles(theme: AppTheme) {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical:   24,
      gap:               20,
    },
    warningBanner: {
      backgroundColor: theme.isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2',
      borderRadius:    10,
      padding:         16,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.danger,
      flexDirection:   'row',
      gap:             12,
      alignItems:      'flex-start',
    },
    warningIcon: {
      fontSize:   20,
      lineHeight: 24,
    },
    warningText: {
      fontSize:   13,
      color:      theme.colors.danger,
      lineHeight: 20,
      flex:       1,
    },
    consequenceCard: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius:    16,
      padding:         16,
      gap:             12,
    },
    consequenceTitle: {
      fontSize:   16,
      fontWeight: '600',
      color:      theme.colors.textPrimary,
    },
    consequenceList: {
      gap: 8,
    },
    consequenceRow: {
      flexDirection: 'row',
      gap:           8,
      alignItems:    'flex-start',
    },
    consequenceBullet: {
      fontSize:   13,
      color:      theme.colors.textSecondary,
      lineHeight: 20,
    },
    consequenceText: {
      fontSize:   13,
      color:      theme.colors.textSecondary,
      lineHeight: 20,
      flex:       1,
    },
    confirmationSection: {
      gap: 12,
    },
    confirmationInstructions: {
      fontSize: 16,
      color:    theme.colors.textPrimary,
    },
    confirmationKeyword: {
      fontWeight:      '700',
      color:           theme.colors.danger,
      fontFamily:      'monospace',
      backgroundColor: theme.isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2',
    },
  });
}
