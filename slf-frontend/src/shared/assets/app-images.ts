// ─── CENTRALISED IMAGE REGISTRY ──────────────────────────────────────────────
// Every image used in the app is registered here, loaded once.
// React Native bundles these at build time — using `require` ensures static
// resolution which is faster than dynamic imports.

export const APP_IMAGES = {
  // Brand
  logo:    require('../../../assets/logo.png'),

  // Tab bar icons
  athlete: require('../../../assets/athlete.jpg'),  // muscular bust — used for the "Profile" tab
  search:  require('../../../assets/loupe.png'),
  message: require('../../../assets/message.png'),
  setting: require('../../../assets/reglage.png'),
} as const;

export type AppImageKey = keyof typeof APP_IMAGES;
