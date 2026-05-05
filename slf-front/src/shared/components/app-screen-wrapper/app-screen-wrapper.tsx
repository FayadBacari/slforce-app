import React, { memo } from 'react';
import { View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, type StatusBarProps } from 'expo-status-bar';
import { useTheme } from '@shared/theme/theme-provider';
import { buildAppScreenWrapperStyles } from './styles/app-screen-wrapper.styles';

interface AppScreenWrapperProps {
  children:             React.ReactNode;
  style?:               ViewStyle;
  noHorizontalPadding?: boolean;
}

// A wrapper that every screen uses as its outermost container.
// It handles:
// - Safe area insets (notch, home indicator)
// - Status bar color matching the current theme
// - Consistent horizontal padding
// - Theme-appropriate background color
export const AppScreenWrapper = memo(function AppScreenWrapper({
  children,
  style,
  noHorizontalPadding = false,
}: AppScreenWrapperProps) {
  const { theme } = useTheme();
  const styles = buildAppScreenWrapperStyles(theme, noHorizontalPadding);

  const statusBarStyle: StatusBarProps['style'] = theme.isDark ? 'light' : 'dark';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.contentContainer, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
});
