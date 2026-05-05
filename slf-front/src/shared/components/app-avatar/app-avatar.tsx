import React, { memo, useState } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@shared/theme/theme-provider';
import { buildAppAvatarStyles } from './styles/app-avatar.styles';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AppAvatarProps {
  photoUrl:   string | undefined | null;
  fullName:   string;
  size?:      AvatarSize;
  isOnline?:  boolean;
}

// Returns true only for URLs that could actually be loaded remotely.
// Filters out local file URIs (file://, ph://, content://) that are
// device-specific and would fail on any other device.
function isRemoteUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

// Displays a user's profile photo.
// Falls back to initials when:
//   • no photo URL is provided
//   • the URL is a local file URI (file://, ph://, content://)
//   • the remote URL fails to load (network error, expired link, etc.)
export const AppAvatar = memo(function AppAvatar({
  photoUrl,
  fullName,
  size     = 'md',
  isOnline = false,
}: AppAvatarProps) {
  const { theme } = useTheme();
  const styles = buildAppAvatarStyles(theme, size);

  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const userInitials  = getInitialsFromFullName(fullName);
  const showImage     = isRemoteUrl(photoUrl) && !imageLoadFailed;

  return (
    <View style={styles.container}>
      {showImage ? (
        <Image
          source={{ uri: photoUrl as string }}
          style={styles.photo}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          onError={() => setImageLoadFailed(true)}
        />
      ) : (
        <View style={styles.initialsContainer}>
          <Text style={styles.initialsText}>{userInitials}</Text>
        </View>
      )}
      {isOnline && <View style={styles.onlineBadge} />}
    </View>
  );
});

// Extracts initials from a full name.
// "Jean Dupont" → "JD"
function getInitialsFromFullName(fullName: string): string {
  const words = fullName.trim().split(' ');
  if (words.length === 0) return '?';
  if (words.length === 1) return (words[0]?.[0] ?? '?').toUpperCase();
  return `${words[0]?.[0] ?? ''}${words[words.length - 1]?.[0] ?? ''}`.toUpperCase();
}
