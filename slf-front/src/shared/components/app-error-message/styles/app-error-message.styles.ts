import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildAppErrorMessageStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.isDark
        ? 'rgba(239,68,68,0.15)'
        : '#FEE2E2',
      borderRadius:    BORDER_RADIUS.md,
      padding:         SPACING[4],
      gap:             SPACING[3],
      alignItems:      'center',
    },
    errorText: {
      ...TYPOGRAPHY.presets.bodySmall,
      color:     theme.colors.danger,
      textAlign: 'center',
    },
    retryButton: {
      paddingVertical:   SPACING[2],
      paddingHorizontal: SPACING[4],
    },
    retryButtonLabel: {
      ...TYPOGRAPHY.presets.bodySmall,
      fontWeight: '600',
      color:      theme.colors.danger,
    },
  });
}
