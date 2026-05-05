import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildLanguageStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingVertical:   24,
    },
    languageList: {
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
    languageRow: {
      flexDirection:     'row',
      alignItems:        'center',
      paddingVertical:   16,
      paddingHorizontal: 16,
      gap:               12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    selectedLanguageRow: {
      backgroundColor: theme.isDark
        ? 'rgba(59,130,246,0.12)'
        : COLORS.brand.primarySubtle,
    },
    flagEmoji: {
      fontSize: 24,
    },
    languageTextSection: {
      flex: 1,
      gap:  2,
    },
    nativeLabel: {
      fontSize:   16,
      fontWeight: '600',
      color:      theme.colors.textPrimary,
    },
    translatedLabel: {
      fontSize: 12,
      color:    theme.colors.textSecondary,
    },
    checkmark: {
      fontSize:   18,
      color:      theme.colors.brandPrimary,
      fontWeight: '700',
    },
  });
}
