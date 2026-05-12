// ─── API ENDPOINTS ────────────────────────────────────────────────────────────
//
// Every URL used to communicate with the backend lives here.
// We never type URL strings by hand anywhere else in the app.
// When the backend changes a route, we only update it in this one file.
//
// Convention de naming :
//   • Une URL = une CLÉ neutre (sans verbe HTTP — le verbe est dans le
//     data-source qui consomme cette URL). Ex: `bankAccount` est partagé
//     entre GET (status), POST (onboarding via sous-route), DELETE.
//   • Le namespace de la clé reflète le DOMAINE backend, pas la séparation
//     côté front. `platform.stats` (route /users/stats) → namespace `platform`
//     car c'est une stat globale, pas un détail de profil utilisateur.

// Default points at the local NestJS backend during development.
// Override with EXPO_PUBLIC_API_BASE_URL in .env or the deployed URL in production.
const backendApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5132/api/v1';

export const API_BASE_URL = backendApiBaseUrl;

export const API_ENDPOINTS = {
  authentication: {
    login:          '/auth/login',
    // Single register endpoint — the backend infers athlete/coach from the `role` field
    register:       '/auth/register',
    refreshToken:   '/auth/refresh',
    logout:         '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword:  '/auth/reset-password',
  },

  userProfile: {
    getMyProfile:          '/users/profile',
    updateMyProfile:       '/users/profile',
    uploadProfilePhoto:    '/users/profile/photo',
    getPrivacySettings:    '/users/privacy',
    updatePrivacySettings: '/users/privacy',
    deleteMyAccount:       '/users/account',
  },

  // Stats globales plateforme — pas spécifiques à un user. Anciennement sous
  // `userProfile.platformStats` ce qui était trompeur (la route est /users/stats
  // mais ses CONSOMMATEURS sont les écrans de search, pas le profil).
  platform: {
    stats: '/users/stats',
  },

  chat: {
    getStreamChatToken: '/chat/token',
  },

  search: {
    searchForCoaches:  '/search/coaches',
    searchForAthletes: '/search/athletes',
  },

  payments: {
    createPaymentIntent:                 '/payments/intent',
    confirmPayment:                      '/payments/confirm',
    getAllPaymentsSentByCurrentUser:     '/payments/sent',
    getAllPaymentsReceivedByCurrentUser: '/payments/received',
    getMonthlyPaymentSummary:            '/payments/summary/monthly',

    // Clé neutre (sans verbe HTTP) — partagée par GET (status), DELETE
    // (disconnect). Le verbe vit dans le data-source qui consomme cette URL.
    bankAccount:                         '/payments/bank-account',
    bankAccountOnboarding:               '/payments/bank-account/onboarding',
    bankAccountDashboard:                '/payments/bank-account/dashboard',
  },

  // Health endpoints — séparés en sous-clés cohérentes avec les autres
  // namespaces du catalog (anciennement `health: string` qui sortait du moule).
  health: {
    live:  '/health/live',
    ready: '/health/ready',
  },
} as const;
