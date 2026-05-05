import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildPrivacySettingsStyles(theme: AppTheme) {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical:   24,
      gap:               16,
    },
    card: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius:    16,
      overflow:        'hidden',
      ...Platform.select({
        ios: {
          shadowColor:   COLORS.brand.primaryDark,
          shadowOpacity: 0.06,
          shadowRadius:  8,
          shadowOffset:  { width: 0, height: 2 },
        },
        android: { elevation: 1 },
      }),
    },
    toggleRow: {
      flexDirection:     'row',
      alignItems:        'center',
      paddingVertical:   16,
      paddingHorizontal: 16,
      gap:               12,
    },
    toggleTextSection: {
      flex: 1,
      gap:  4,
    },
    toggleLabel: {
      fontSize:   16,
      fontWeight: '500',
      color:      theme.colors.textPrimary,
    },
    toggleDescription: {
      fontSize: 13,
      color:    theme.colors.textSecondary,
    },
    divider: {
      height:          1,
      backgroundColor: theme.colors.divider,
      marginLeft:      16,
    },
  });
}
