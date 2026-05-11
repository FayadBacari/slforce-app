// ─── Routes typées de l'app ──────────────────────────────────────────────────
//
// Source unique de vérité pour TOUS les chemins de navigation.
// Élimine les ~22 `as never` qui jonchaient les `router.push('...' as never)`
// dans le code (workaround d'Expo Router v6 qui type strictement les paths).
//
// Avantages :
//   • Auto-complétion des routes dans n'importe quel composant
//   • Tout déplacement de fichier dans `app/` casse le compile au lieu de
//     casser silencieusement à l'exécution
//   • Un seul point à mettre à jour quand on renomme un screen
//
// Usage :
//   import { pushRoute, replaceRoute, APP_ROUTES } from '@shared/navigation/app-routes';
//   pushRoute(APP_ROUTES.public.login);
//   pushRoute({ pathname: APP_ROUTES.private.chatConversation, params: { 'conversation-id': '…' }});

import { router, type Href } from 'expo-router';

// ─── Catalogue exhaustif des chemins ──────────────────────────────────────────
//
// Garde la même hiérarchie que `app/` pour pouvoir scanner visuellement.
// Tout nouveau screen DOIT être ajouté ici avant d'être consommé ailleurs.

export const APP_ROUTES = {
  public: {
    login:                     '/(public)/login',
    register:                  '/(public)/register-athlete',
    registerAthlete:           '/(public)/register-athlete',
    registerCoach:             '/(public)/register-coach',
    registerAthleteOnboarding: '/(public)/register-athlete-onboarding',
    registerCoachOnboarding:   '/(public)/register-coach-onboarding',
    roleSelection:             '/(public)/role-selection',
    forgotPassword:            '/(public)/forgot-password',
    resetPassword:             '/(public)/reset-password',
  },
  private: {
    coachProfile:    '/(private)/(coach)/profile',
    coachSearch:     '/(private)/(coach)/search',
    athleteProfile:  '/(private)/(athlete)/profile',
    athleteSearch:   '/(private)/(athlete)/search',

    chat:                '/(private)/chat',
    chatConversation:    '/(private)/chat/[conversation-id]',
    chatMakePayment:     '/(private)/chat/make-payment',

    settings:               '/(private)/settings',
    settingsProfile:        '/(private)/settings/profile-settings',
    settingsPrivacy:        '/(private)/settings/privacy-settings',
    settingsBankAccount:    '/(private)/settings/bank-account',
    settingsPaymentChart:   '/(private)/settings/payment-chart',
    settingsPaymentHistory: '/(private)/settings/payment-history',
    settingsLanguage:       '/(private)/settings/language',
    settingsSupport:        '/(private)/settings/support',
    settingsDeleteAccount:  '/(private)/settings/delete-account',
  },
} as const;

// Union de tous les chemins valides — extraite par récursion sur APP_ROUTES.
type AppRoutePath =
  | typeof APP_ROUTES.public[keyof typeof APP_ROUTES.public]
  | typeof APP_ROUTES.private[keyof typeof APP_ROUTES.private];

// Une route soit nue, soit avec params (cas des routes dynamiques `[id]`).
// On force le `Href` d'Expo Router pour garder la compatibilité totale avec son API.
export type AppRouteTarget =
  | AppRoutePath
  | { pathname: AppRoutePath; params: Record<string, string | number | undefined> };

// ─── Helpers — wrap router.push / router.replace en typé ─────────────────────
//
// Garde un `as Href` interne unique : c'est l'unique cast du projet pour
// Expo Router. Tous les call-sites bénéficient ensuite de l'auto-complétion.

export function pushRoute(target: AppRouteTarget): void {
  router.push(target as Href);
}

export function replaceRoute(target: AppRouteTarget): void {
  router.replace(target as Href);
}

// Construit le chemin d'un screen settings à partir de son segment.
// Utile pour la liste settings/index.tsx qui utilise des onPress dynamiques.
export function buildSettingsRoute(
  subPage:
    | 'profile-settings'
    | 'privacy-settings'
    | 'bank-account'
    | 'payment-chart'
    | 'payment-history'
    | 'language'
    | 'support'
    | 'delete-account',
): AppRoutePath {
  return `/(private)/settings/${subPage}` as AppRoutePath;
}
