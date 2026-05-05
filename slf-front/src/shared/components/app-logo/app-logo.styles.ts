import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';

// Layout sizes for the framed logo.
// Mirrors the visual sizing used on the legacy slf-frontend auth screens.
const LOGO_FRAME_SIZE_BY_VARIANT = {
  small:  { framePadding: 12, imageSize: 48,  borderRadius: 14 },
  medium: { framePadding: 18, imageSize: 72,  borderRadius: 16 },
  large:  { framePadding: 24, imageSize: 100, borderRadius: 20 },
} as const;

export function buildAppLogoStyles(size: 'small' | 'medium' | 'large') {
  const sizing = LOGO_FRAME_SIZE_BY_VARIANT[size];

  return StyleSheet.create({
    logoFrame: {
      backgroundColor: COLORS.brand.primaryDark,   // #2563EB — exact legacy match
      borderRadius:    sizing.borderRadius,
      padding:         sizing.framePadding,
      // The blue glow shadow is the signature "SLForce" feel
      ...Platform.select({
        ios: {
          shadowColor:   COLORS.brand.primaryDark,
          shadowOpacity: 0.35,
          shadowRadius:  10,
          shadowOffset:  { width: 0, height: 6 },
        },
        android: {
          elevation: 6,
        },
      }),
    },
    logoImage: {
      width:  sizing.imageSize,
      height: sizing.imageSize,
    },
  });
}
