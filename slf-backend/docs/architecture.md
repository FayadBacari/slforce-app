# Architecture SLForce Backend

Document technique destiné au mainteneur solo. Si tu reviens sur le projet dans 3 mois et que tu cherches « comment ça marche ? », commence ici.

---

## 1. Vue d'ensemble

NestJS 11, TypeScript strict, MongoDB. L'API est versionnée sous `/api/v1` et expose 6 modules métier (`auth`, `users`, `chat`, `search`, `payments`, `health`).

```
                                                ┌───────────────────────┐
                                                │  Mobile (Expo / RN)   │
                                                └──────────┬────────────┘
                                                           │ HTTPS / JSON
                                                           ▼
                          ┌──────────────────────── slf-backend ───────────────────────┐
                          │                                                              │
                          │   helmet · compression · CORS · ValidationPipe · ThrottlerGuard │
                          │                       │                                      │
   ┌──────────────────────┴──────────┬────────────┼──────────────┬──────────────────────┐│
   ▼                                 ▼            ▼              ▼                      ▼│
 Auth                            Users         Chat          Search                Payments
 │                               │             │             │                      │   │
 ├─ login/register               ├─ profile    ├─ Stream     ├─ /search/coaches     ├─ Connect onboarding
 ├─ refresh (rotation)           ├─ privacy    │   token     ├─ /search/athletes    ├─ PaymentIntent
 ├─ forgot/reset password        ├─ delete     │             │                      ├─ webhook ←─── Stripe
 └─ logout                       └─ photo      │             │                      └─ history + chart
                                  upload                                             │
                                  Cloudinary                                          ▼
                                                                                   MongoDB
```

---

## 2. Modules et frontières

| Module | Domaine | Schemas Mongoose | Dépendances |
|---|---|---|---|
| `auth` | Authentification, sessions, mots de passe | `RefreshToken`, `PasswordResetToken` | UsersModule (forwardRef), EmailModule |
| `users` | Profil, privacy, suppression de compte | `User` | AuthModule (forwardRef), ChatModule, CloudinaryModule |
| `chat` | Token Stream + sync identité | _aucun_ | ConfigModule (global) |
| `search` | Listing coachs/athlètes | _aucun_ (lit `User`) | UsersModule |
| `payments` | Stripe Connect + paiements + webhook | `Payment` | UsersModule, ConfigModule |
| `health` | Liveness probe | _aucun_ | _aucune_ |

### Dépendance circulaire `users` ↔ `auth`

C'est la seule circularité du graphe, gérée par `forwardRef()` :

- `AuthenticationService` lit/crée des `User` → a besoin de `UsersRepository`
- `UsersService.deleteAccount()` révoque toutes les sessions → a besoin de `AuthTokensService`

```
AuthModule.imports          [forwardRef(() => UsersModule), …]
UsersModule.imports         [forwardRef(() => AuthModule), …]
```

C'est le pattern NestJS officiel pour deux modules co-dépendants.

---

## 3. Flow d'authentification

```
1. POST /auth/register
   • Joi valide les credentials
   • bcrypt(12) hash le password
   • UsersRepository.createOne({...})
   • AuthTokensService.issueTokensForUser
   │   ├─ JWT access  (15 min, secret A)
   │   ├─ JWT refresh (30 j , secret B)
   │   └─ RefreshTokensRepository.storeOne (hash sha256 du JWT + expiresAt)
   └─ Réponse : { user, accessToken, refreshToken }

2. Toute requête protégée
   ├─ JwtAuthGuard (passport-jwt + JwtStrategy)
   │   ├─ vérifie signature avec accessSecret
   │   ├─ UsersRepository.findOneById(sub) — refuse si !isActive
   │   └─ injecte req.user = { userId, email, role }
   └─ RolesGuard si @RequireRoles(...) sur la route

3. Access token expiré (401)
   Frontend (api-client.ts) :
   ├─ POST /auth/refresh { refreshToken }
   │   ├─ verify signature avec refreshSecret
   │   ├─ vérifie qu'il existe en DB (non révoqué)
   │   ├─ révoque l'ancien (rotation)
   │   └─ émet une nouvelle paire { access, refresh }
   └─ Retry de la requête originale (transparent pour l'écran)

4. POST /auth/logout
   └─ révoque le refresh token (idempotent, public — fonctionne avec access expiré)
```

---

## 4. Flow Stripe (paiement athlète → coach)

```
1. Coach configure son IBAN
   POST /payments/bank-account/onboarding
   ├─ Stripe Express account créé (FR, individual)
   ├─ Account Link généré (URL one-shot ~5 min)
   └─ Mobile ouvre l'URL dans le navigateur système
       └─ Stripe redirige vers /api/v1/payments/stripe/return
           └─ Page HTML qui ouvre slforce://stripe-connect-return

2. Athlète paie
   POST /payments/intent { coachId, amountInCents }
   ├─ Vérifie coach.stripeAccountId
   ├─ stripe.paymentIntents.create({
   │     transfer_data: { destination: coach.stripeAccountId },
   │     metadata: { athleteId, coachId },
   │   })
   └─ Renvoie { clientSecret, paymentIntentId, publishableKey }

3. Mobile confirme via le SDK Stripe
   POST /payments/confirm { paymentIntentId }
   ├─ retrievePaymentIntent (truth source = Stripe)
   ├─ vérifie status === 'succeeded'
   ├─ vérifie metadata.athleteId === currentUser
   └─ persistSucceededPaymentIfNew → idempotent grâce à l'index unique

4. Filet de sécurité — webhook Stripe
   POST /payments/webhook (public, no throttle)
   ├─ Vérifie HMAC via STRIPE_WEBHOOK_SECRET
   ├─ Si payment_intent.succeeded → persistSucceededPaymentIfNew
   └─ 200 OK (Stripe retentera sinon)
```

`persistSucceededPaymentIfNew` est partagé entre `confirmPayment` (chemin synchrone côté UI) et `handleStripeWebhookEvent` (asynchrone) — l'idempotence repose sur l'index `unique:true, sparse:true` sur `stripePaymentIntentId`.

---

## 5. Réponses API — format unifié

### Succès

```json
{
  "success": true,
  "data": <ce que le controller a retourné>
}
```

Wrapping fait par `ResponseEnvelopeInterceptor` (global).

### Erreur

```json
{
  "success":    false,
  "statusCode": 400,
  "message":    "Description user-friendly en français",
  "errorCode":  "OPTIONNEL_CODE_MACHINE",
  "timestamp":  "2025-...",
  "path":       "/api/v1/auth/login"
}
```

Format produit par `AllExceptionsFilter` (global). Toute exception NestJS est interceptée — le client n'a jamais à parser des shapes différentes.

Le frontend déballe via `unwrapBackendEnvelope()` et `convertAnyErrorToAppError()`.

---

## 6. Configuration & secrets

Tout passe par `ConfigService` avec namespacing `registerAs` :

| Namespace | Module config | Variables `.env` |
|---|---|---|
| `app.*` | `app.config.ts` | `PORT`, `APP_URL`, `API_PREFIX`, `CORS_ORIGIN`, `NODE_ENV` |
| `database.*` | `database.config.ts` | `MONGODB_URI` |
| `jwt.*` | `jwt.config.ts` | `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_*` |
| `security.*` | `security.config.ts` | `BCRYPT_SALT_ROUNDS` |
| `email.*` | `email.config.ts` | `RESEND_API_KEY`, `MAIL_FROM`, `RESET_PASSWORD_URL` |
| `cloudinary.*` | `cloudinary.config.ts` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| _(racine)_ | _(direct env)_ | `STRIPE_*`, `STREAM_*` |

Validation au boot : `environment.validation.ts` (Joi) — l'app **refuse de démarrer** si une variable manque ou ne match pas son pattern (ex: `JWT_ACCESS_SECRET` ≥ 32 chars, `STRIPE_SECRET_KEY` commence par `sk_`).

---

## 7. Conventions de code

- **Naming** : verbeux et descriptif. `findOneByEmail`, `revokeAllRefreshTokensForUser`, `formatUserForClient`, `callXxxApiEndpoint`.
- **Suffixes fichiers** : `.service.ts`, `.controller.ts`, `.repository.ts`, `.schema.ts`, `.dto.ts`, `.module.ts`, `.config.ts`, `.util.ts`.
- **Comments** : en français, expliquent **le pourquoi**, pas le quoi.
- **Section dividers** : `// ─── titre ───` pour séparer des blocs longs.
- **Colons alignés** dans les literals d'objets pour la lisibilité.
- **`private readonly`** pour tous les services injectés.
- **Path aliases** : `@core/*`, `@modules/*`, `@shared/*` partout pour les imports inter-couches. `../` uniquement intra-sous-module.
- **Logger** : `private readonly logger = new Logger(ClassName.name)` avec Pino derrière.

---

## 8. Plan de migration future

### Split User / AthleteProfile / CoachProfile

Aujourd'hui, le document `User` mélange auth + profil coach + profil athlète (~30 champs optionnels). Quand le volume justifiera la séparation :

1. Créer `coach_profiles` et `athlete_profiles` (collections séparées)
2. Pour chaque user, copier les champs role-specific dans la nouvelle collection
3. Supprimer ces champs du document `User`
4. Mettre à jour : `UsersRepository`, `SearchService`, controllers, DTOs

Les types TypeScript `UserAuthFields`, `UserCoachProfileFields`, `UserAthleteProfileFields` (cf. `user.schema.ts`) anticipent déjà cette séparation : chaque consumer peut typer une projection précise.

### Idempotency-key sur les POST critiques

Pour les routes sensibles aux retries (`/payments/confirm`, `/auth/register`), accepter un header `Idempotency-Key` (UUID v4 généré côté front) et persister le résultat 24h dans Redis ou Mongo pour dédoublonner.

### Correlation ID

Middleware Pino qui pickup `X-Request-ID` du client et le retourne dans la réponse, pour pouvoir tracer un bug user → log précis.

### Webhook Stripe — événements supplémentaires

Le handler actuel ne traite que `payment_intent.succeeded`. À ajouter :
- `payment_intent.payment_failed` (statut `failed` en DB)
- `charge.dispute.created` (notification au coach)
- `account.updated` (sync `chargesEnabled` / `payoutsEnabled` dans User)

---

## 9. Diagnostics rapides

| Symptôme | Vérifier |
|---|---|
| App refuse de démarrer | `.env` manque une variable — l'erreur Joi en console pointe la ligne |
| MongoDB `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` | IP publique pas dans la whitelist Atlas — `cloud.mongodb.com` → Network Access |
| Photo upload 500 | Vérifier les 3 vars `CLOUDINARY_*` |
| Reset email échoue | `MAIL_FROM` doit être `onboarding@resend.dev` (dev) ou un domaine vérifié (prod) |
| Webhook Stripe 401 | `STRIPE_WEBHOOK_SECRET` doit matcher le secret affiché dans le Dashboard Stripe |
| 401 sur toutes les routes après refacto | Le frontend stocke peut-être un token issu d'un ancien `JWT_ACCESS_SECRET` — login à refaire |
