import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'small' | 'medium' | 'large';

// Builds the styles for the AppButton based on the current theme, variant, and size.
// Called inside the component so styles always reflect the current theme.
export function buildAppButtonStyles(
  theme: AppTheme,
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
) {
  const backgroundColorByVariant: Record<ButtonVariant, string> = {
    primary:   theme.colors.brandPrimary,
    secondary: 'transparent',
    ghost:     'transparent',
    danger:    theme.colors.danger,
  };

  const textColorByVariant: Record<ButtonVariant, string> = {
    primary:   theme.colors.textOnPrimary,
    secondary: theme.colors.brandPrimary,
    ghost:     theme.colors.textSecondary,
    danger:    '#FFFFFF',
  };

  const borderColorByVariant: Record<ButtonVariant, string | undefined> = {
    primary:   undefined,
    secondary: theme.colors.brandPrimary,
    ghost:     undefined,
    danger:    undefined,
  };

  const heightBySize: Record<ButtonSize, number> = {
    small:  40,
    medium: 52,
    large:  60,
  };

  const fontSizeBySize: Record<ButtonSize, number> = {
    small:  14,
    medium: 16,
    large:  18,
  };

  const paddingBySize: Record<ButtonSize, number> = {
    small:  SPACING[4],
    medium: SPACING[5],
    large:  SPACING[6],
  };

  return StyleSheet.create({
    buttonContainer: {
      height:             heightBySize[size],
      backgroundColor:    backgroundColorByVariant[variant],
      borderRadius:       BORDER_RADIUS.button,
      paddingHorizontal:  paddingBySize[size],
      alignItems:         'center',
      justifyContent:     'center',
      alignSelf:          fullWidth ? 'stretch' : 'auto',
      borderWidth:        borderColorByVariant[variant] ? 1.5 : 0,
      borderColor:        borderColorByVariant[variant],
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems:    'center',
    },
    iconWrapper: {
      marginRight: SPACING[2],
    },
    buttonLabel: {
      ...TYPOGRAPHY.presets.buttonLabel,
      fontSize:   fontSizeBySize[size],
      color:      textColorByVariant[variant],
    },
    disabledButton: {
      opacity: 0.5,
    },
  });
}
