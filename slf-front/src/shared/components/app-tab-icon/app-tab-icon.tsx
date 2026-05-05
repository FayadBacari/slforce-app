import React from 'react';
import { Image } from 'react-native';
import { APP_IMAGES, type AppImageKey } from '@shared/assets/app-images';
import { buildAppTabIconStyles } from './app-tab-icon.styles';

interface AppTabIconProps {
  // Which image to render — must match a key in APP_IMAGES
  imageName: Extract<AppImageKey, 'search' | 'message' | 'setting'>;
  // Color the icon should be tinted with — comes from the tab bar's active/inactive color
  tintColor: string;
}

// Renders a tab bar icon using one of the project's PNG assets.
// Uses tintColor so the same image works for both active and inactive states.
export function AppTabIcon({ imageName, tintColor }: AppTabIconProps) {
  const styles = buildAppTabIconStyles(tintColor);
  return (
    <Image
      source={APP_IMAGES[imageName]}
      style={styles.icon}
      resizeMode="contain"
    />
  );
}
