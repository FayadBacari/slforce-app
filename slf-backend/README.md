# SLForce Backend

API NestJS pour la marketplace de coaching sportif **SLForce** (coachs ↔ athlètes).

> Stack : NestJS 11 · TypeScript strict · MongoDB Atlas · JWT (access/refresh) · Stripe Connect · Stream Chat · Resend · Cloudinary · Pino

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js 20+** (cf. `.nvmrc`)
- Un cluster **MongoDB Atlas** (free tier suffit)
- Comptes API : **Stripe**, **Stream Chat**, **Resend**, **Cloudinary**

### Installation

```bash
# 1. Bonne version de Node
nvm use

# 2. Dépendances
npm install

# 3. Variables d'environnement
cp .env.example .env
#   → remplir toutes les valeurs marquées [REMPLACER]

# 4. Lancer en dev (hot-reload)
npm run start:dev

# 5. Vérifier
#   → http://localhost:5132/api/v1/health
#   → http://localhost:5132/api/v1/docs   (Swagger UI, dev uniquement)
```

L'application refuse de démarrer si une variable d'env requise manque ou est mal formatée (validation Joi au boot).

---

## 📂 Architecture

```
src/
├── main.ts                       # Bootstrap : pipes, helmet, Swagger, raw body Stripe
├── app.module.ts                 # Module racine : guards globaux, throttler, filtre, intercepteur
├── core/                         # Infrastructure technique transverse
│   ├── config/                   # registerAs() pour chaque scope (app, jwt, email, cloudinary…)
│   ├── database/                 # MongooseModule.forRootAsync
│   ├── email/                    # EmailService + templates HTML externalisés
│   ├── cloudinary/               # CloudinaryService (upload + delete)
│   ├── filters/                  # AllExceptionsFilter (format d'erreur unifié)
│   └── interceptors/             # ResponseEnvelopeInterceptor ({ success, data })
├── modules/                      # Logique métier — un dossier = un domaine
│   ├── auth/                     # login/register/refresh/logout/forgot/reset
│   ├── users/                    # profil, privacy, suppression compte (User schema vit ici)
│   ├── chat/                     # Stream Chat token + sync identité
│   ├── search/                   # search coachs / athlètes
│   ├── payments/                 # Stripe Connect + paiements + webhook
│   └── health/                   # liveness probe
└── shared/                       # Décorateurs / guards / types réutilisables
    ├── decorators/               # @Public, @CurrentUser, @RequireRoles
    ├── guards/                   # JwtAuthGuard, RolesGuard
    ├── types/                    # UserRole enum, AuthenticatedRequest
    └── utils/                    # generate-avatar-url
```

Chaque module métier suit le même découpage en couches :

```
modules/<domain>/
├── <domain>.module.ts
├── presentation/                 # Couche HTTP (controllers + DTOs validés)
│   ├── *.controller.ts
│   └── dto/*.dto.ts
├── services/                     # Logique métier (use cases)
│   └── *.service.ts
└── data/                         # Accès aux données
    ├── repositories/*.repository.ts
    └── schemas/*.schema.ts
```

### Flux d'une requête

```
Request
  └─ Helmet + Compression + CORS                         (main.ts)
      └─ ValidationPipe (whitelist + transform)          (main.ts)
          └─ Global Guards : JwtAuthGuard → RolesGuard → ThrottlerGuard
              └─ Controller (presentation/)
                  └─ Service (services/)
                      └─ Repository (data/repositories/)
                          └─ Mongoose Model
              ↑ ResponseEnvelopeInterceptor wraps in { success, data }
              ↑ AllExceptionsFilter formats errors as { success: false, ... }
```

### Path aliases

Tous les imports entre couches passent par `@core/*`, `@modules/*`, `@shared/*` (cf. `tsconfig.json`).
Les imports relatifs `../` ne sont utilisés qu'**au sein du même sous-module** (ex: un service vers son repository).

---

## 🔐 Sécurité

| Vecteur | Mesure |
|---|---|
| Vol d'access token | Durée 15 min — rotation refresh à chaque renouvellement |
| Vol de refresh token | Stocké hashé SHA-256 + TTL Mongo + révocation au logout |
| Brute-force login | Throttle dédié 5 req/min sur `/auth/*` (en plus du global 60/min) |
| Énumération d'emails | Réponse identique sur login OK/KO et forgot-password OK/KO |
| Reset password | Token 256 bits aléatoires, hashé SHA-256, TTL 30 min, révocation des sessions au reset |
| Webhook Stripe forgé | Vérification HMAC obligatoire via `STRIPE_WEBHOOK_SECRET` |
| Paiement forgé client | PaymentIntent re-récupéré côté serveur + match metadata.athleteId |
| Doubles paiements | Index `unique:true sparse:true` sur `stripePaymentIntentId` |
| Mot de passe en DB | bcrypt 12 rounds |
| Headers HTTP | `helmet()` global |
| Rate-limit global | `@nestjs/throttler` 60 req/min/IP |

---

## 📡 Webhooks Stripe (production)

Pour activer le filet de sécurité asynchrone des paiements :

1. Dans le [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks), créer un endpoint pointant sur `https://<ton-domaine>/api/v1/payments/webhook`
2. Cocher l'événement **`payment_intent.succeeded`** (et au besoin `payment_intent.payment_failed`)
3. Copier le **signing secret** (`whsec_...`) dans `.env` → `STRIPE_WEBHOOK_SECRET`
4. Redémarrer le backend

En dev, utilise [Stripe CLI](https://stripe.com/docs/stripe-cli) :

```bash
stripe listen --forward-to localhost:5132/api/v1/payments/webhook
# copier le whsec_xxx affiché → STRIPE_WEBHOOK_SECRET
```

---

## 📧 Emails (Resend)

En dev, l'adresse expéditeur `onboarding@resend.dev` ne peut envoyer qu'à **l'email du compte Resend**. Pour les autres adresses, le service log automatiquement le `resetUrl` dans le terminal :

```
WARN [EmailService] [DEV] Impossible d'envoyer l'email à test@example.com.
                         Utilise ce lien directement pour tester :

  slforce://reset-password?token=abc123…
```

En prod, configurer un domaine vérifié dans [Resend](https://resend.com/domains) et changer `MAIL_FROM`.

---

## 🖼️ Upload de photos (Cloudinary)

Les photos de profil sont uploadées **directement vers Cloudinary** depuis le buffer mémoire — aucun fichier n'est écrit sur le disque local (qui est éphémère sur Render/Fly).

- Dossier Cloudinary : `slforce/profile-photos/`
- Transformation auto : crop 512×512 face-aware, qualité auto, format auto (webp/avif)
- Limite taille : 5 MB

---

## 📜 Scripts npm

| Commande | Description |
|---|---|
| `npm run start:dev` | Hot reload dev avec Pino prettifié |
| `npm run build` | Compile vers `dist/` |
| `npm run start:prod` | Lance la version compilée |
| `npm run lint` | ESLint --fix sur `src/` |
| `npm run format` | Prettier sur `src/` |
| `npm test` | Jest |

---

## 📚 Documentation complémentaire

- **API interactive** : `http://localhost:5132/api/v1/docs` (Swagger UI, dev uniquement)
- **Architecture détaillée** : [`docs/architecture.md`](./docs/architecture.md)
- **Plan de migration User → AthleteProfile / CoachProfile** : cf. docblock en tête de [`src/modules/users/data/schemas/user.schema.ts`](./src/modules/users/data/schemas/user.schema.ts)
