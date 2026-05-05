import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@shared/theme/theme-provider';
import { buildAppErrorMessageStyles } from './styles/app-error-message.styles';

interface AppErrorMessageProps {
  message:    string;
  onRetry?:   () => void;
  retryLabel?: string;
}

export const AppErrorMessage = memo(function AppErrorMessage({
  message,
  onRetry,
  retryLabel = 'Réessayer',
}: AppErrorMessageProps) {
  const { theme } = useTheme();
  const styles = buildAppErrorMessageStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonLabel}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});
