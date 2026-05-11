// ─── APP CONSTANTS ───────────────────────────────────────────────────────────
//
// Toutes les magic values techniques de l'app sont définies ici.
// Avant : valeurs hardcodées dispersées dans les hooks et services.
// Après : un seul fichier à scanner pour comprendre les seuils, timeouts,
// pages sizes, durées d'animation, etc.
//
// Convention de nommage : SCREAMING_SNAKE_CASE, suffixes `_MS` / `_BYTES` /
// `_COUNT` quand l'unité n'est pas évidente.

// ── Réseau ──────────────────────────────────────────────────────────────────

// Timeout des requêtes HTTP API SLForce. Suffisamment long pour les uploads
// d'images, mais coupe les requêtes "perdues" dans le réseau mobile flaky.
export const API_TIMEOUT_MS = 15_000;

// Timeout du WebSocket Stream Chat — légèrement plus court car la reconnexion
// est gérée par le SDK et ne devrait pas dépasser 6s sur 4G normale.
export const STREAM_CHAT_TIMEOUT_MS = 6_000;

// Délai après lequel on déclenche un cleanup automatique de la connexion
// Stream après un disconnect — laisse une fenêtre courte au cas où l'utilisateur
// reviendrait dans l'app rapidement.
export const STREAM_CHAT_CLEANUP_DEBOUNCE_MS = 5_000;

// ── Pagination & limites ────────────────────────────────────────────────────

// Nombre de messages chargés par batch dans la fenêtre de chat.
export const INITIAL_CHAT_MESSAGE_PAGE_SIZE = 30;

// Taille max d'un fichier uploadé (cohérent avec la limite côté backend).
export const PROFILE_PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024;

// ── Stripe / paiements ──────────────────────────────────────────────────────

// Montant minimum acceptable par Stripe en EUR (la limite descend à 0.30 sur
// d'autres devises — à internationaliser quand on ajoutera USD/GBP).
export const STRIPE_MIN_AMOUNT_IN_EUROS = 0.50;

// Code d'erreur Stripe quand l'utilisateur ferme le payment sheet sans payer.
// Le SDK Stripe ne l'expose pas comme constant — on documente notre dépendance ici.
export const STRIPE_PAYMENT_CANCELED_CODE = 'Canceled';

// ── Animations ──────────────────────────────────────────────────────────────

// Durée d'un fade in/out d'écran d'onboarding (athlete + coach utilisent la même).
export const ONBOARDING_FADE_DURATION_MS = 120;
