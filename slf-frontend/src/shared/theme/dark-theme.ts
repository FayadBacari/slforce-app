import { COLORS } from '@shared/design-system';
import type { AppTheme } from './theme.types';

// The complete dark mode theme.
export const darkTheme: AppTheme = {
  isDark: true,
  colors: {
    pageBackground:     COLORS.dark.background,
    cardBackground:     COLORS.dark.surface,
    inputBackground:    COLORS.dark.surfaceElevated,
    modalBackground:    COLORS.dark.surface,
    divider:            COLORS.dark.border,
    border:             COLORS.dark.border,

    textPrimary:        COLORS.neutral.white,
    textSecondary:      COLORS.neutral.gray400,
    textDisabled:       COLORS.neutral.gray600,
    textOnPrimary:      COLORS.neutral.white,

    brandPrimary:       COLORS.brand.primaryLight,
    brandPrimaryDark:   COLORS.brand.primary,

    success:            COLORS.semantic.success,
    danger:             COLORS.semantic.danger,
    warning:            COLORS.semantic.warning,

    myMessageBubble:    COLORS.brand.primary,
    theirMessageBubble: COLORS.dark.surfaceElevated,
    myMessageText:      COLORS.neutral.white,
    theirMessageText:   COLORS.neutral.white,

    tabBarBackground:   COLORS.dark.surface,
    tabBarActive:       COLORS.brand.primaryLight,
    tabBarInactive:     COLORS.neutral.gray600,
  },
};
