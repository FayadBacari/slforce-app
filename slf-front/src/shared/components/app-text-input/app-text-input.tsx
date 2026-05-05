import React, { memo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@shared/theme/theme-provider';
import { buildAppTextInputStyles } from './styles/app-text-input.styles';

interface AppTextInputProps extends TextInputProps {
  label?:          string;
  errorMessage?:   string | null;
  rightIcon?:      React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

// A reusable text input used throughout the entire app.
// Handles label, error message display, and right icon in one component.
export const AppTextInput = memo(function AppTextInput({
  label,
  errorMessage,
  rightIcon,
  onRightIconPress,
  containerStyle,
  ...textInputProps
}: AppTextInputProps) {
  const { theme } = useTheme();
  const [isCurrentlyFocused, setIsCurrentlyFocused] = useState(false);

  const styles = buildAppTextInputStyles(theme, isCurrentlyFocused, !!errorMessage);

  return (
    <View style={[styles.outerContainer, containerStyle]}>
      {label && <Text style={styles.labelText}>{label}</Text>}

      <View style={styles.inputRow}>
        <TextInput
          {...textInputProps}
          style={styles.textInput}
          placeholderTextColor={theme.colors.textDisabled}
          onFocus={() => setIsCurrentlyFocused(true)}
          onBlur={() => setIsCurrentlyFocused(false)}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
});
