// ─── Catégories de poids Street Lifting ──────────────────────────────────────
//
// Source unique de vérité pour les catégories proposées dans l'onboarding et
// le profil athlète. Avant cette factorisation, ces tableaux étaient exportés
// depuis un hook d'auth — frontière de domaine cassée (les catégories sont
// une donnée de profil athlète, pas d'authentification).

export const MALE_WEIGHT_CATEGORIES = [
  '-66',
  '-73',
  '-80',
  '-87',
  '-94',
  '-104',
  '+104',
] as const;

export const FEMALE_WEIGHT_CATEGORIES = [
  '-52',
  '-63',
  '-70',
  '+70',
] as const;

export type MaleWeightCategory   = typeof MALE_WEIGHT_CATEGORIES[number];
export type FemaleWeightCategory = typeof FEMALE_WEIGHT_CATEGORIES[number];
