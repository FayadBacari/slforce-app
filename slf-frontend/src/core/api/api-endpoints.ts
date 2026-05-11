// ─── API ENDPOINTS ────────────────────────────────────────────────────────────
//
// Every URL used to communicate with the backend lives here.
// We never type URL strings by hand anywhere else in the app.
// When the backend changes a route, we only update it in this one file.

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
    getMyProfile:         '/users/profile',
    updateMyProfile:      '/users/profile',
    uploadProfilePhoto:   '/users/profile/photo',
    platformStats:        '/users/stats',
    getPrivacySettings:    '/users/privacy',
    updatePrivacySettings: '/users/privacy',
    deleteMyAccount:       '/users/account',
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
    getCoachBankAccountDetails:          '/payments/bank-account',
    saveCoachBankAccountDetails:         '/payments/bank-account',
    // Sub-routes — kept explicit so callers never concatenate strings manually.
    bankAccountOnboarding:               '/payments/bank-account/onboarding',
    bankAccountDashboard:                '/payments/bank-account/dashboard',
  },

  // NOTE: les endpoints push notifications ont été retirés en attendant que
  // le module NestJS backend soit implémenté. Quand le backend sera prêt, les
  // ré-introduire ici plutôt que de les recoder en dur dans les hooks.

  health: '/health',
} as const;
