import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeInPixels: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 80,
};

const fontSizeForInitials: Record<AvatarSize, number> = {
  xs: 11,
  sm: 14,
  md: 17,
  lg: 22,
  xl: 32,
};

export function buildAppAvatarStyles(theme: AppTheme, size: AvatarSize) {
  const dimension = sizeInPixels[size];

  return StyleSheet.create({
    container: {
      position: 'relative',
      width:    dimension,
      height:   dimension,
    },
    photo: {
      width:        dimension,
      height:       dimension,
      borderRadius: BORDER_RADIUS.avatar,
    },
    initialsContainer: {
      width:           dimension,
      height:          dimension,
      borderRadius:    BORDER_RADIUS.avatar,
      backgroundColor: theme.colors.brandPrimary,
      alignItems:      'center',
      justifyContent:  'center',
    },
    initialsText: {
      fontSize:   fontSizeForInitials[size],
      fontWeight: '700',
      color:      COLORS.neutral.white,
    },
    onlineBadge: {
      position:        'absolute',
      bottom:          1,
      right:           1,
      width:           dimension * 0.28,
      height:          dimension * 0.28,
      borderRadius:    BORDER_RADIUS.avatar,
      backgroundColor: COLORS.semantic.success,
      borderWidth:     2,
      borderColor:     theme.colors.cardBackground,
    },
  });
}
