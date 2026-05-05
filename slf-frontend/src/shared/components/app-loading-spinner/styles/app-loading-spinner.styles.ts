import { StyleSheet } from 'react-native';
import { SPACING, TYPOGRAPHY } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildAppLoadingSpinnerStyles(theme: AppTheme, fullScreen: boolean) {
  return StyleSheet.create({
    container: {
      flex:           fullScreen ? 1 : undefined,
      alignItems:     'center',
      justifyContent: 'center',
      padding:        SPACING[8],
      backgroundColor: fullScreen ? theme.colors.pageBackground : 'transparent',
    },
    message: {
      ...TYPOGRAPHY.presets.bodyMedium,
      color:     theme.colors.textSecondary,
      marginTop: SPACING[3],
      textAlign: 'center',
    },
  });
}
