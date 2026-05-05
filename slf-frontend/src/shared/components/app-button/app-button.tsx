import React, { memo } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@shared/theme/theme-provider';
import { buildAppButtonStyles } from './styles/app-button.styles';

// The different visual styles a button can have
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'small' | 'medium' | 'large';

interface AppButtonProps {
  label:             string;
  onPress:           () => void;
  variant?:          ButtonVariant;
  size?:             ButtonSize;
  isLoading?:        boolean;
  isDisabled?:       boolean;
  fullWidth?:        boolean;
  leftIcon?:         React.ReactNode;
  style?:            ViewStyle;
  labelStyle?:       TextStyle;
  testID?:           string;
}

// A reusable button component used throughout the entire app.
// All buttons in the app should use this component instead of TouchableOpacity directly.
export const AppButton = memo(function AppButton({
  label,
  onPress,
  variant    = 'primary',
  size       = 'medium',
  isLoading  = false,
  isDisabled = false,
  fullWidth  = false,
  leftIcon,
  style,
  labelStyle,
  testID,
}: AppButtonProps) {
  const { theme } = useTheme();
  const styles = buildAppButtonStyles(theme, variant, size, fullWidth);

  const isNotClickable = isLoading || isDisabled;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={isNotClickable}
      activeOpacity={0.75}
      style={[styles.buttonContainer, isDisabled && styles.disabledButton, style]}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : theme.colors.brandPrimary}
          size="small"
        />
      ) : (
        <View style={styles.buttonContent}>
          {leftIcon && <View style={styles.iconWrapper}>{leftIcon}</View>}
          <Text style={[styles.buttonLabel, labelStyle]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});
