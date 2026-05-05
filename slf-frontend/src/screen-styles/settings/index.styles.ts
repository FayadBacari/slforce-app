import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

// Styles for the main Settings menu screen.
// Layout matches the legacy slf-frontend "settingsMain.ts" design.
export function buildSettingsIndexStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex:            1,
      backgroundColor: theme.colors.pageBackground,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom:     48,
      gap:               8,
    },
    header: {
      paddingVertical: 24,
      gap:             6,
    },
    headerTitle: {
      fontSize:   28,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: 14,
      color:    theme.colors.textSecondary,
    },
    roleBadge: {
      color:      theme.colors.brandPrimary,
      fontWeight: '600',
    },
    sectionHeader: {
      fontSize:          12,
      color:             theme.colors.textSecondary,
      fontWeight:        '600',
      letterSpacing:     0.8,
      marginTop:         16,
      marginBottom:      6,
      paddingHorizontal: 4,
      textTransform:     'uppercase',
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
    row: {
      flexDirection:     'row',
      alignItems:        'center',
      paddingVertical:   16,
      paddingHorizontal: 16,
      gap:               12,
    },
    rowIcon: {
      fontSize:  20,
      width:     28,
      textAlign: 'center',
    },
    rowLabel: {
      fontSize: 16,
      color:    theme.colors.textPrimary,
      flex:     1,
    },
    dangerLabel: {
      color: theme.colors.danger,
    },
    chevron: {
      fontSize:   22,
      color:      theme.colors.textSecondary,
      lineHeight: 26,
    },
    divider: {
      height:          1,
      backgroundColor: theme.colors.divider,
      marginLeft:      56, // align with text, skip icon column
    },
    logoutButton: {
      marginTop:       16,
      backgroundColor: theme.colors.cardBackground,
      borderRadius:    16,
      paddingVertical: 16,
      alignItems:      'center',
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
    logoutButtonLabel: {
      fontSize:   16,
      color:      theme.colors.danger,
      fontWeight: '600',
    },
  });
}
