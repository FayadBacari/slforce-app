// ─── keepDigitsOnly ──────────────────────────────────────────────────────────
//
// Filtre une string pour ne garder que les chiffres 0-9.
// Pattern utilisé dans 4+ écrans pour les inputs numériques (poids, taille,
// records, montants…) qui doivent ignorer les caractères collés ou tapés.
//
// Avant cette factorisation, chaque écran avait son propre :
//   value.replace(/[^0-9]/g, '')
// Difficile à grepper et à modifier en bloc si on veut un jour autoriser le `,` décimal.

export function keepDigitsOnly(rawValue: string): string {
  return rawValue.replace(/[^0-9]/g, '');
}
