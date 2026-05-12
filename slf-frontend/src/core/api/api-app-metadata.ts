import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── Métadonnées client envoyées dans CHAQUE requête API ─────────────────────
//
// Permet au backend de :
//   • Identifier la version applicative (rejeter un vieux build bugué)
//   • Stats / metrics par plateforme (iOS vs Android vs web)
//   • Debug : croiser correlation-ID + version + plateforme → reproduire un bug
//
// Lit la version depuis Expo Constants (déclarée dans `app.json`) plutôt que
// de la hardcoder ici — single source of truth.

// `manifest2` est la nouvelle API Expo (SDK 49+) ; `manifest` est la legacy.
// On lit les deux et on prend la première valeur non-nulle.
function readAppVersionFromExpoManifest(): string {
  const fromManifest2 = Constants.expoConfig?.version;
  if (typeof fromManifest2 === 'string' && fromManifest2.length > 0) {
    return fromManifest2;
  }
  return 'unknown';
}

export const APP_VERSION: string = readAppVersionFromExpoManifest();

// `Platform.OS` est typé `'ios' | 'android' | 'web' | 'windows' | 'macos'`
// — on le caste en string pour éviter une union qui fuit dans les headers HTTP.
export const APP_PLATFORM: string = Platform.OS;
