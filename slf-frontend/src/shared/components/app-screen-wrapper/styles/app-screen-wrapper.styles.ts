import { StyleSheet } from 'react-native';
import { SPACING } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildAppScreenWrapperStyles(theme: AppTheme, noHorizontalPadding: boolean) {
  return StyleSheet.create({
    safeArea: {
      flex:            1,
      backgroundColor: theme.colors.pageBackground,
    },
    contentContainer: {
      flex:             1,
      paddingHorizontal: noHorizontalPadding ? 0 : SPACING.screenHorizontalPadding,
    },
  });
}
