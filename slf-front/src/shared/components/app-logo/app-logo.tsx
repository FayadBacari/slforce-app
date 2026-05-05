import React from 'react';
import { View, Image } from 'react-native';
import { APP_IMAGES } from '@shared/assets/app-images';
import { buildAppLogoStyles } from './app-logo.styles';

interface AppLogoProps {
  // Visual size of the framed logo. Default is the large hero size used on auth screens.
  size?: 'small' | 'medium' | 'large';
}

// Reproduces the SLForce signature logo: white logo image inside a blue rounded square
// with a soft blue glow shadow underneath. Used on login, register, and role-selection.
export function AppLogo({ size = 'large' }: AppLogoProps) {
  const styles = buildAppLogoStyles(size);

  return (
    <View style={styles.logoFrame}>
      <Image source={APP_IMAGES.logo} style={styles.logoImage} resizeMode="contain" />
    </View>
  );
}
