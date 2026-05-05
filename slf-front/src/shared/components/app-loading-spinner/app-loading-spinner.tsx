import React, { memo } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '@shared/theme/theme-provider';
import { buildAppLoadingSpinnerStyles } from './styles/app-loading-spinner.styles';

interface AppLoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export const AppLoadingSpinner = memo(function AppLoadingSpinner({
  message,
  fullScreen = false,
}: AppLoadingSpinnerProps) {
  const { theme } = useTheme();
  const styles = buildAppLoadingSpinnerStyles(theme, fullScreen);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.brandPrimary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
});
