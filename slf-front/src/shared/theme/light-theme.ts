import { COLORS } from '@shared/design-system';
import type { AppTheme } from './theme.types';

// The complete light mode theme.
// The blue-tinted background (#EFF6FF) is the SLForce signature look,
// kept identical to the legacy slf-frontend project.
export const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    pageBackground:     COLORS.brand.primarySubtle,   // #EFF6FF — blue-tinted page bg
    cardBackground:     COLORS.neutral.white,
    inputBackground:    COLORS.neutral.white,
    modalBackground:    COLORS.neutral.white,
    divider:            COLORS.neutral.gray200,
    border:             COLORS.neutral.gray200,

    textPrimary:        COLORS.neutral.gray900,
    textSecondary:      COLORS.neutral.gray500,
    textDisabled:       COLORS.neutral.gray400,
    textOnPrimary:      COLORS.neutral.white,

    brandPrimary:       COLORS.brand.primary,
    brandPrimaryDark:   COLORS.brand.primaryDark,

    success:            COLORS.semantic.success,
    danger:             COLORS.semantic.danger,
    warning:            COLORS.semantic.warning,

    myMessageBubble:    COLORS.brand.primary,
    theirMessageBubble: COLORS.neutral.white,
    myMessageText:      COLORS.neutral.white,
    theirMessageText:   COLORS.neutral.gray800,

    tabBarBackground:   COLORS.neutral.white,
    tabBarActive:       COLORS.brand.primary,
    tabBarInactive:     COLORS.neutral.gray400,
  },
};
