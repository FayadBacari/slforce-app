// ─── withAlpha ────────────────────────────────────────────────────────────────
//
// Concatène une opacité à une couleur hex 6-digits.
// Remplace les patterns fragiles `${theme.colors.brandPrimary}18` semés dans
// les styles — fragile car ça suppose que la couleur est toujours en `#RRGGBB`,
// jamais en `rgb()` ni `hsl()`.
//
// Cette fonction valide le format et fait l'extension proprement.
//
//   withAlpha('#3B82F6', 0.10)  → '#3B82F61A'
//   withAlpha('#3B82F6', 1)     → '#3B82F6FF'
//
// Pour les couleurs déjà en `rgba(...)`, retourne la valeur inchangée — l'alpha
// y est déjà encodé. Pas de prise en charge de `hsl()` (pas utilisé dans le DS).

const HEX_6_DIGITS_PATTERN = /^#([0-9a-fA-F]{6})$/;

export function withAlpha(hexColor: string, opacity: number): string {
  // Garde-fou : opacité doit être dans [0, 1].
  const clampedOpacity = Math.max(0, Math.min(1, opacity));

  // Si la couleur est déjà en rgba(), on la retourne telle quelle —
  // remplacer son alpha demanderait un parser plus lourd, pas justifié ici.
  if (hexColor.startsWith('rgba(') || hexColor.startsWith('rgb(')) {
    return hexColor;
  }

  // Vérifie le format hex 6-digits.
  if (!HEX_6_DIGITS_PATTERN.test(hexColor)) {
    // Format inattendu — on retourne la couleur sans toucher pour ne pas
    // produire un style invalide. En dev, le caller verra le résultat
    // visuel et corrigera. Pas de throw : un crash UI vaut moins qu'une
    // couleur opaque non voulue.
    return hexColor;
  }

  // Convertit l'opacité [0, 1] en suffixe hex 2-digits (00..FF).
  const alphaByte    = Math.round(clampedOpacity * 255);
  const alphaHex2    = alphaByte.toString(16).padStart(2, '0').toUpperCase();
  return `${hexColor}${alphaHex2}`;
}
