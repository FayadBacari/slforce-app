// ─── buildHandleFromName ─────────────────────────────────────────────────────
//
// Construit un handle "@nom_prenom" à partir d'un displayName ou d'un
// firstName/lastName.
//
// Pattern dupliqué dans `(coach)/profile.tsx` et `use-athlete-profile-screen`
// avant cette factorisation.
//
// Règles :
//   • Si displayName est présent → on l'utilise tel quel (en lowercase, espaces → _)
//   • Sinon → "firstName_lastName" lowercase, espaces remplacés par _
//   • Préfixe "@" toujours ajouté
//
//   buildHandleFromName({ displayName: 'Coach Alex' })            → '@coach_alex'
//   buildHandleFromName({ firstName: 'Marie', lastName: 'Dupont' }) → '@marie_dupont'
//   buildHandleFromName({})                                         → '@user'

export function buildHandleFromName(params: {
  displayName?: string;
  firstName?:   string;
  lastName?:    string;
}): string {
  const { displayName, firstName, lastName } = params;

  const rawHandle =
    displayName?.trim() ||
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    'user';

  const normalized = rawHandle.toLowerCase().replace(/\s+/g, '_');
  return `@${normalized}`;
}
