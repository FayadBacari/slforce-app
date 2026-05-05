import { Platform } from 'react-native';

// ─── DESIGN SYSTEM — SHADOWS ──────────────────────────────────────────────────
// Cross-platform shadow definitions (iOS uses shadow*, Android uses elevation).

export const SHADOWS = {
  none: {},

  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  }),

  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }),

  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }),

  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 10,
    },
    android: { elevation: 3 },
    default: {},
  }),
} as const;
