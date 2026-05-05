import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildAppTextInputStyles(
  theme: AppTheme,
  isCurrentlyFocused: boolean,
  hasError: boolean,
) {
  const borderColor = hasError
    ? theme.colors.danger
    : isCurrentlyFocused
      ? theme.colors.brandPrimary
      : theme.colors.border;

  return StyleSheet.create({
    outerContainer: {
      gap: SPACING[1],
    },
    labelText: {
      ...TYPOGRAPHY.presets.inputLabel,
      color: theme.colors.textSecondary,
    },
    inputRow: {
      flexDirection:   'row',
      alignItems:      'center',
      backgroundColor: theme.colors.inputBackground,
      borderRadius:    BORDER_RADIUS.input,
      borderWidth:     1.5,
      borderColor,
      paddingHorizontal: SPACING[4],
      minHeight:       52,
    },
    textInput: {
      flex:     1,
      ...TYPOGRAPHY.presets.bodyMedium,
      color:    theme.colors.textPrimary,
      paddingVertical: SPACING[3],
    },
    rightIconContainer: {
      marginLeft: SPACING[2],
      padding:    SPACING[1],
    },
    errorText: {
      ...TYPOGRAPHY.presets.caption,
      color:      theme.colors.danger,
      marginTop:  SPACING[1],
    },
  });
}
