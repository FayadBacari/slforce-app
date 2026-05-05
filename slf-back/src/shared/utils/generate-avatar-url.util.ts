// ─── DEFAULT AVATAR GENERATOR ─────────────────────────────────────────────────
//
// Generates a ui-avatars.com URL that displays a blue circle with the user's
// initials. Stored in MongoDB at registration so every account always has a
// valid profilePhotoUrl — the same value is served to the profile page,
// search results and Stream Chat (no screen-level fallback needed).
//
// Example output:
//   https://ui-avatars.com/api/?name=Jean+Dupont&background=3B82F6&color=fff&bold=true&size=200

const AVATAR_BACKGROUND = '3B82F6'; // SLForce brand blue (#3B82F6)
const AVATAR_TEXT_COLOR = 'fff';
const AVATAR_SIZE       = 200;

export function generateDefaultAvatarUrl(firstName: string, lastName: string): string {
  const fullName  = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Utilisateur';
  const encoded   = encodeURIComponent(fullName);
  return (
    `https://ui-avatars.com/api/` +
    `?name=${encoded}` +
    `&background=${AVATAR_BACKGROUND}` +
    `&color=${AVATAR_TEXT_COLOR}` +
    `&bold=true` +
    `&size=${AVATAR_SIZE}`
  );
}
