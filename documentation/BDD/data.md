# MongoDB - data dictionary (SLForce)

This document is a functional reference: it lists persisted data field by field.

- Source of truth: Mongoose schemas in `slf-backend/src/models/*.model.ts`
- DB connection: `slf-backend/src/config/db.ts` (via `MONGODB_URI`)

## MongoDB environment variables (connection)

MongoDB connection is driven by one environment variable: `MONGODB_URI`.

- `MONGODB_URI` (required)
  - Role: connection URI used as-is by `mongoose.connect(mongoDbUri)`.
  - Where it is read:
    - `slf-backend/src/config/runtimeConfig.ts` exposes `runtimeConfig.mongodbUri` from `process.env.MONGODB_URI`
    - `slf-backend/src/config/db.ts` reads `runtimeConfig.mongodbUri` then calls `mongoose.connect(mongoDbUri)`
  - Startup validation:
    - `slf-backend/src/config/runtimeConfig.ts` runs `validateRuntimeConfig()`
    - if `MONGODB_URI` is missing (or empty), app startup fails (`FatalStartupError`)
  - Important consequence:
    - since `connectDB()` does not pass extra options to `mongoose.connect()` (besides the URI), all required parameters must be encoded in the URI itself (DB name, TLS/SSL, replica set, `authSource`, `retryWrites`, etc. through query params).

### URI examples

Local (MongoDB installed locally):

- text:
mongodb://localhost:27017/slforce

- text:
MongoDB Atlas (typical example):

- text:
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/slforce?retryWrites=true&w=majority


## Common Mongo / Mongoose conventions

- Document identifier: `_id: ObjectId` (automatic)
- Timestamps: `createdAt`, `updatedAt` when `timestamps: true` (automatic)
- Indexes: declared via `index: true` or `schema.index(...)`
- Refs: `ref: "User"` etc. (logical relations, no SQL-style FK)

## Collection inventory

| Collection (model)                               | File                            | Business role                                           |
|--------------------------------------------------|---------------------------------|---------------------------------------------------------|
| `users` (`User`)                                 | `User.model.ts`                 | User account + identity + role                          |
| `coachprofiles` (`CoachProfile`)                 | `CoachProfile.model.ts`         | Coach profile (public / business) linked to a user      |
| `athleteprofiles` (`AthleteProfile`)             | `AthleteProfile.model.ts`       | Athlete profile (public / performance) linked to a user |
| `conversations` (`Conversation`)                 | `Conversation.model.ts`         | Persisted conversation (participants)                   |
| `messages` (`Message`)                           | `Message.model.ts`              | Persisted message (conversation + sender + content)     |
| `payments` (`Payment`)                           | `Payment.model.ts`              | Payment (athlete->coach) + status + Stripe reference    |
| `stripeaccounts` (`StripeAccount`)               | `StripeAccount.model.ts`        | Stripe Connect account linked to a user                 |
| `processedstripeevents` (`ProcessedStripeEvent`) | `ProcessedStripeEvent.model.ts` | Stripe webhook idempotency (TTL)                        |
| `refreshtokens` (`RefreshToken`)                 | `RefreshToken.model.ts`         | Refresh tokens (TTL)                                    |
| `passwordresettokens` (`PasswordResetToken`)     | `PasswordResetToken.model.ts`   | Password reset tokens (TTL)                             |

---

## Collection `users` (model `User`)

### Fields

| Field         | Type       | Constraints                                                  | Role / usage                             |
|---------------|------------|--------------------------------------------------------------|------------------------------------------|
| `_id`.        | `ObjectId` | auto                                                         | User identifier                          |
| `email`       | `string`   | **required**, **unique**, `lowercase`, `trim`, `index: true` | Login identifier                         |
| `password`    | `string`   | **required**                                                 | Password hash (never returned to client) |
| `firstName`   | `string`   | **required**, `trim`                                         | First name                               |
| `lastName`    | `string`   | **required**, `trim`                                         | Last name                                |
| `phoneNumber` | `string`   | optional, `trim`                                             | Phone number (if provided)               |
| `avatar`.     | `string`   | optional                                                     | Profile picture (base64 or URL)          |
| `role`        | `string`   | **required**, enum `{ athlete, coach }`                      | App role                                 |
| `isActive`    | `boolean`  | default `true`                                               | Soft-disable / account status            |
| `lastLoginAt` | `Date`     | optional                                                     | Last login                               |
| `createdAt`   | `Date`     | auto                                                         | Creation timestamp                       |
| `updatedAt`   | `Date`     | auto                                                         | Update timestamp                         |

---

## Collection `coachprofiles` (model `CoachProfile`)

### Fields

| Field         | Type       | Constraints                             | Role / usage                         |
|---------------|------------|-----------------------------------------|--------------------------------------|
| `_id`         | `ObjectId` | auto                                    | Coach profile identifier             |
| `user`        | `ObjectId` | **required**, **unique**, `ref: "User"` | 1-1 link to coach user               |
| `name`        | `string`   | default `""`                            | Display name                         |
| `avatar`      | `string`   | default `""`                            | Coach avatar                         |
| `speciality`  | `string`   | default `""`, index (simple + text)     | Speciality                           |
| `location`    | `string`   | default `""`                            | Location                             |
| `price`       | `number`   | default `0`                             | Price (business unit depends on app) |
| `experience`  | `number`   | default `0`                             | Experience (years or other)          |
| `description` | `string`   | default `""`                            | Long description                     |
| `skills`      | `string[]` | default `[]`, index (simple + text)     | Tags / skills                        |
| `createdAt`   | `Date`     | auto                                    | Creation timestamp                   |
| `updatedAt`   | `Date`     | auto                                    | Update timestamp                     |

### Indexes

- `skills: 1`
- `speciality: 1`
- `name: 1`
- text index: `{ name: "text", speciality: "text", skills: "text" }`

---

## Collection `athleteprofiles` (model `AthleteProfile`)

### Fields

| Field               | Type       | Constraints                             | Role / usage               |
|---------------------|------------|-----------------------------------------|----------------------------|
| `_id`               | `ObjectId` | auto                                    | Athlete profile identifier |
| `user`              | `ObjectId` | **required**, **unique**, `ref: "User"` | 1-1 link to athlete user   |
| `name`              | `string`   | default `""`                            | Display name               |
| `avatar`            | `string`   | default `""`                            | Avatar                     |
| `gender`            | `string`   | enum `{ male, female }`                 | Gender (if provided)       |
| `weightCategory`    | `string`   | default `""`                            | Weight category            |
| `weight`            | `number`   | default `0`                             | Weight                     |
| `height`            | `number`   | default `0`                             | Height                     |
| `records.muscleUp`  | `number`   | default `0`                             | Muscle-up record           |
| `records.traction`  | `number`   | default `0`                             | Pull-up record             |
| `records.dips`      | `number`   | default `0`                             | Dips record                |
| `records.squat`     | `number`   | default `0`                             | Squat record               |
| `createdAt`         | `Date`     | auto                                    | Creation timestamp         |
| `updatedAt`         | `Date`     | auto                                    | Update timestamp           |

### Indexes

- `name: 1`
- text index: `{ name: "text" }`

---

## Collection `conversations` (model `Conversation`)

### Fields

| Field            | Type         | Constraints   | Role / usage            |
|------------------|--------------|---------------|-------------------------|
| `_id`            | `ObjectId`   | auto          | Conversation identifier |
| `participants[]` | `ObjectId[]` | `ref: "User"` | Participants (list)     |
| `createdAt`      | `Date`       | auto          | Creation timestamp      |
| `updatedAt`      | `Date`       | auto          | Update timestamp        |

### Indexes

- compound index: `{ participants: 1, updatedAt: -1 }`

---

## Collection `messages` (model `Message`)

### Fields

| Field          | Type       | Constraints                                        | Role / usage                      |
|----------------|------------|----------------------------------------------------|-----------------------------------|
| `_id`          | `ObjectId` | auto                                               | Message identifier                |
| `conversation` | `ObjectId` | **required**, `ref: "Conversation"`, `index: true` | Message conversation              |
| `sender`       | `ObjectId` | **required**, `ref: "User"`                        | Author                            |
| `content`      | `string`   | **required**                                       | Text content (or payload by type) |
| `type`         | `string`   | enum `{ TEXT, IMAGE }`, default `TEXT`             | Message type                      |
| `createdAt`    | `Date`     | auto                                               | Creation timestamp                |
| `updatedAt`    | `Date`     | auto                                               | Update timestamp                  |

### Indexes

- compound index: `{ conversation: 1, createdAt: -1 }`

---

## Collection `payments` (model `Payment`)

### Fields

| Field                   | Type       | Constraints                                              | Role / usage                                 |
|-------------------------|------------|----------------------------------------------------------|----------------------------------------------|
| `_id`                   | `ObjectId` | auto                                                     | Payment identifier                           |
| `title`                 | `string`   | **required**                                             | Label (e.g. "session")                       |
| `amount`                | `number`   | **required**                                             | Amount (often in cents)                      |
| `currency`              | `string`   | default `"EUR"`                                          | Currency                                     |
| `status`                | `string`   | enum `{ PENDING, SUCCEEDED, FAILED }`, default `PENDING` | Status                                       |
| `athlete`               | `ObjectId` | **required**, `ref: "User"`, `index: true`               | Payer                                        |
| `coach`                 | `ObjectId` | **required**, `ref: "User"`, `index: true`               | Recipient                                    |
| `conversation`          | `ObjectId` | optional, `ref: "Conversation"`, `index: true`           | Linked conversation (if initiated from chat) |
| `stripePaymentIntentId` | `string`   | optional, `index: true`                                  | Stripe PaymentIntent reference               |
| `createdAt`             | `Date`     | auto                                                     | Creation timestamp                           |
| `updatedAt`             | `Date`     | auto                                                     | Update timestamp                             |

### Indexes

- compound: `{ athlete: 1, createdAt: -1 }`, `{ coach: 1, createdAt: -1 }`, `{ status: 1, createdAt: -1 }`

---

## Collection `stripeaccounts` (model `StripeAccount`)

### Fields

| Field             | Type       | Constraints                             | Role / usage              |
|-------------------|------------|-----------------------------------------|---------------------------|
| `_id`             | `ObjectId` | auto                                    | Identifier                |
| `user`            | `ObjectId` | **required**, **unique**, `ref: "User"` | 1-1 link to user          |
| `stripeAccountId` | `string`   | **required**                            | Stripe Connect account ID |
| `chargesEnabled`  | `boolean`  | default `false`                         | Can charge                |
| `payoutsEnabled`  | `boolean`  | default `false`                         | Can payout                |
| `createdAt`       | `Date`     | auto                                    | Creation timestamp        |
| `updatedAt`       | `Date`     | auto                                    | Update timestamp          |

---

## Collection `processedstripeevents` (model `ProcessedStripeEvent`)

### Fields

| Field         | Type       | Constraints                             | Role / usage                  |
|---------------|------------|-----------------------------------------|-------------------------------|
| `_id`         | `ObjectId` | auto                                    | Identifier                    |
| `eventId`     | `string`   | **required**, **unique**, `index: true` | Stripe event ID (idempotency) |
| `eventType`   | `string`   | **required**                            | Stripe event type             |
| `processedAt` | `Date`     | default `Date.now`, **required**        | Processing date (used by TTL) |
| `createdAt`   | `Date`     | auto                                    | Creation timestamp            |
| `updatedAt`   | `Date`     | auto                                    | Update timestamp              |

### TTL

- TTL index: `{ processedAt: 1 }` with expiration after **90 days**

---

## Collection `refreshtokens` (model `RefreshToken`)

### Fields

| Field       | Type       | Constraints                                | Role / usage        |
|-------------|------------|--------------------------------------------|---------------------|
| `_id`       | `ObjectId` | auto                                       | Identifier.         |
| `user`      | `ObjectId` | **required**, `ref: "User"`, `index: true` | Token owner         |
| `token`     | `string`   | **required**, **unique**, `index: true`    | Refresh token value |
| `expiresAt` | `Date`     | **required**                               | Expiration (TTL)    |
| `createdAt` | `Date`     | auto                                       | Creation timestamp  |
| `updatedAt` | `Date`     | auto                                       | Update timestamp    |

### TTL

- TTL index: `{ expiresAt: 1 }` with `expireAfterSeconds: 0`

---

## Collection `passwordresettokens` (model `PasswordResetToken`)

### Fields

| Field       | Type       | Constraints                                | Role / usage.      |
|-------------|------------|--------------------------------------------|--------------------|
| `_id`.      | `ObjectId` | auto                                       | Identifier         |
| `user`      | `ObjectId` | **required**, `ref: "User"`, `index: true` | Target user        |
| `token`     | `string`   | **required**, **unique**, `index: true`    | Reset token value  |
| `expiresAt` | `Date`     | **required**                               | Expiration (TTL)   |
| `used`      | `boolean`  | default `false`, `index: true`             | Token consumed     |
| `createdAt` | `Date`     | auto                                       | Creation timestamp |
| `updatedAt` | `Date`     | auto                                       | Update timestamp   |

### TTL

- TTL index: `{ expiresAt: 1 }` with `expireAfterSeconds: 0`

---

## Schema evolution strategy (reminder)

There are **no** versioned migrations like Flyway.

1. Update Mongoose schema(backward-compatible additions: defaults/optional fields).
2. If needed, run an idempotent one-shot script in `slf-backend/src/scripts/`.
3. Add required indexes in schemas and plan index creation in production (Atlas).
