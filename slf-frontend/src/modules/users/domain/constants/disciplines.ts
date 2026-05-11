// ─── Disciplines proposées aux coachs ────────────────────────────────────────
//
// Source unique de vérité pour les disciplines sélectionnables à l'onboarding
// et dans l'édition de profil coach. Avant cette factorisation, la liste était
// exportée depuis le hook d'auth — frontière de domaine cassée (les disciplines
// sont une donnée de profil coach, pas d'authentification).
//
// Limite : un coach peut sélectionner au maximum 2 disciplines (cf. UX
// onboarding step 7).

export const COACH_DISCIPLINE_OPTIONS = [
  'Street-Lifting',
  'Endurance',
  'Freestyle',
  'Crossfit',
  'Powerlifting',
  'Calisthenics',
  'Body-Building',
  'Athlétisme',
] as const;

export type CoachDiscipline = typeof COACH_DISCIPLINE_OPTIONS[number];

export const MAX_COACH_DISCIPLINES = 2;
