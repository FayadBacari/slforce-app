// ─── generateUuidV4 ──────────────────────────────────────────────────────────
//
// Wrapper minimal sur `crypto.randomUUID()` quand disponible (Hermes / iOS /
// Android moderne via le polyfill react-native-get-random-values + le SDK
// Expo), avec un fallback Math.random() pour les vieux runtimes.
//
// IMPORTANT : ce helper N'EST PAS adapté pour des usages cryptographiques
// (secrets, tokens auth). C'est uniquement pour des IDs traçabilité —
// correlation, idempotency, etc.
//
// Pourquoi ne pas utiliser `uuid` ou `nanoid` ? Pour éviter une dépendance
// supplémentaire de plus dans le bundle. Le fallback Math.random() est OK
// pour notre use-case (collisions négligeables sur 10k req/min).

interface CryptoLike {
  randomUUID?: () => string;
}

export function generateUuidV4(): string {
  // Path rapide : crypto.randomUUID() est dispo depuis Hermes 0.72+
  // (utilisée par Expo SDK 49+). Performant et cryptographiquement sûr.
  const globalCrypto = (globalThis as { crypto?: CryptoLike }).crypto;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }

  // Fallback : génération RFC 4122 v4 via Math.random.
  // Suffisant pour des identifiants traçabilité (non sécuritaires).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value  = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
