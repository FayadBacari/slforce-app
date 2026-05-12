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

// Timeout par défaut des requêtes HTTP API SLForce. La majorité des GET et
// POST classiques rentrent largement là-dedans ; les uploads ont leur propre
// constante plus haute. Aligné avec le timeout côté serveur (~10s sur Stripe)
// + une marge de 10s pour absorber la latence réseau mobile.
export const API_DEFAULT_TIMEOUT_MS = 20_000;

// Timeout dédié aux uploads multipart (photo de profil, attachments). Une
// photo de 5 MB sur 3G prend facilement 20-25s — il faut une fenêtre large
// sans bloquer indéfiniment.
export const API_UPLOAD_TIMEOUT_MS = 60_000;

// Timeout court pour les GETs "ping" (stats, liste search, profil) où la
// latence est attendue < 2s. Réduit l'attente perçue quand le backend est down.
export const API_FAST_GET_TIMEOUT_MS = 8_000;

// Alias rétrocompat — ancienne constante consommée par certaines parties du
// code. Pointe désormais sur le timeout par défaut.
export const API_TIMEOUT_MS = API_DEFAULT_TIMEOUT_MS;

// ── Retry policy ─────────────────────────────────────────────────────────────

// Nombre MAXIMAL de tentatives pour les erreurs transitoires (network, 5xx,
// timeout). 3 = première tentative + 2 retries.
export const API_RETRY_MAX_ATTEMPTS = 3;

// Délai initial avant retry (exponentiel × 2 à chaque tentative).
// Séquence : 250ms, 500ms, 1000ms (timing aussi connu sous "binary backoff").
export const API_RETRY_INITIAL_DELAY_MS = 250;

// Status codes HTTP considérés comme transitoires et retryables.
// On EXCLUT explicitement 401 (déjà géré par l'interceptor refresh) et tous
// les 4xx (erreurs client, retry ne changera rien).
export const API_RETRYABLE_STATUS_CODES: readonly number[] = [502, 503, 504];

// ── Stream Chat ──────────────────────────────────────────────────────────────

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

// ── HTTP headers custom SLForce ─────────────────────────────────────────────

// Identifiant unique par requête, propagé bout-en-bout pour faciliter le debug
// (cf. AllExceptionsFilter côté backend qui le renvoie aussi dans la réponse).
export const HTTP_HEADER_REQUEST_ID       = 'X-Request-Id';

// Clé d'idempotence — sur les POST critiques (paiement, register), garantit
// qu'un retry réseau ne crée pas deux fois la même ressource.
export const HTTP_HEADER_IDEMPOTENCY_KEY  = 'X-Idempotency-Key';

// Version applicative mobile (lue depuis app.json). Permet au backend de
// rejeter les vieilles versions buguées avec un message explicite.
export const HTTP_HEADER_APP_VERSION      = 'X-App-Version';

// Plateforme cliente — 'ios' | 'android' | 'web'. Utile pour les metrics
// et pour détecter les bugs spécifiques à une plateforme.
export const HTTP_HEADER_APP_PLATFORM     = 'X-App-Platform';
