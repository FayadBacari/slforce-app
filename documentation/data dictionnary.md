# Data Dictionnary 

- Ce document d'écrit les données persistées dans MongoDB pour le projet. Ce dictionnaire doit mettre en lumière toutes les variables utilisées dans cette base de données.


## Conventions générales

- Identifiant : `_id: ObjectId` (créé automatiquement par MongoDB).
- Timestamps : `createdAt`, `updatedAt` quand `timestamps: true` (créés automatiquement par Mongoose).
- Relations : `ref: "User"` etc. sont des références logiques (pas de contraintes SQL).

## Inventaire des collections (Mongoose)

| Collection (modèle)                              | Fichier                         | Finalité                                   |
|--------------------------------------------------|---------------------------------|--------------------------------------------|
| `users` (`User`)                                 | `User.model.ts`                 | Compte utilisateur + identité + rôle       |
| `coachprofiles` (`CoachProfile`)                 | `CoachProfile.model.ts`         | Profil coach public/métier (1–1 avec user) |
| `athleteprofiles` (`AthleteProfile`)             | `AthleteProfile.model.ts`       | Profil athlète (1–1 avec user)             |
| `conversations` (`Conversation`)                 | `Conversation.model.ts`         | Participants d’une conversation            |
| `messages` (`Message`)                           | `Message.model.ts`              | Messages persistés (conversation + sender) |
| `payments` (`Payment`)                           | `Payment.model.ts`              | Paiements + état + référence Stripe        |
| `stripeaccounts` (`StripeAccount`)               | `StripeAccount.model.ts`        | Stripe Connect (1–1 avec user)             |
| `processedstripeevents` (`ProcessedStripeEvent`) | `ProcessedStripeEvent.model.ts` | Idempotence Stripe webhook (TTL)           |
| `refreshtokens` (`RefreshToken`)                 | `RefreshToken.model.ts`         | Refresh tokens (TTL)                       |
| `passwordresettokens` (`PasswordResetToken`)     | `PasswordResetToken.model.ts`   | Reset password tokens (TTL)                |

---


## `users` (modèle `User`)

### Champs

| Champ         | Type       | Contraintes                                                  | Rôle / usage                    |
|---------------|------------|--------------------------------------------------------------|---------------------------------|
| `_id`         | `ObjectId` | auto                                                         | Identifiant utilisateur         |
| `email`       | `string`   | **required**, **unique**, `lowercase`, `trim`, `index: true` | Email de login                  |
| `password`    | `string`   | **required**                                                 | Hash du mot de passe            |
| `firstName`   | `string`   | **required**, `trim`                                         | Prénom                          |
| `lastName`    | `string`   | **required**, `trim`                                         | Nom                             |
| `phoneNumber` | `string`   | optionnel, `trim`                                            | Téléphone                       |
| `avatar`      | `string`   | optionnel                                                    | Photo de profil (base64 ou URL) |
| `role`        | `string`   | **required**, enum `{ athlete, coach }`                      | Rôle applicatif                 |
| `isActive`    | `boolean`  | default `true`                                               | Statut du compte                |
| `lastLoginAt` | `Date`     | optionnel                                                    | Dernière connexion              |
| `createdAt`   | `Date`     | auto                                                         | Création                        |
| `updatedAt`   | `Date`     | auto                                                         | Mise à jour                     |

---


## `payments` (modèle `Payment`)

### Champs

| Champ                   | Type       | Contraintes                                              | Rôle / usage               |
|-------------------------|------------|----------------------------------------------------------|----------------------------|
| `_id`                   | `ObjectId` | auto                                                     | Identifiant paiement       |
| `title`                 | `string`   | **required**                                             | Libellé                    |
| `amount`                | `number`   | **required**                                             | Montant (souvent centimes) |
| `currency`              | `string`   | default `"EUR"`                                          | Devise                     |
| `status`                | `string`   | enum `{ PENDING, SUCCEEDED, FAILED }`, default `PENDING` | Statut                     |
| `athlete`               | `ObjectId` | **required**, `ref: "User"`, `index: true`               | Payeur                     |
| `coach`                 | `ObjectId` | **required**, `ref: "User"`, `index: true`               | Bénéficiaire               |
| `conversation`          | `ObjectId` | optionnel, `ref: "Conversation"`, `index: true`          | Conversation liée          |
| `stripePaymentIntentId` | `string`   | optionnel, `index: true`                                 | PaymentIntent Stripe       |
| `createdAt`             | `Date`     | auto                                                     | Création                   |
| `updatedAt`             | `Date`     | auto                                                     | Mise à jour                |

---


## `athleteprofiles` (modèle `AthleteProfile`)

### Champs

| Champ              | Type       | Contraintes                             | Rôle / usage                  |
|--------------------|------------|-----------------------------------------|-------------------------------|
| `_id`              | `ObjectId` | auto                                    | Identifiant profil            |
| `user`             | `ObjectId` | **required**, **unique**, `ref: "User"` | Lien 1–1 vers le user athlète |
| `name`             | `string`   | default `""`                            | Nom affiché                   |
| `avatar`           | `string`   | default `""`                            | Avatar                        |
| `gender`           | `string`   | enum `{ male, female }`                 | Sexe                          |
| `weightCategory`   | `string`   | default `""`                            | Catégorie                     |
| `weight`           | `number`   | default `0`                             | Poids                         |
| `height`           | `number`   | default `0`                             | Taille                        |
| `records.muscleUp` | `number`   | default `0`                             | Record                        |
| `records.traction` | `number`   | default `0`                             | Record                        |
| `records.dips`     | `number`   | default `0`                             | Record                        |
| `records.squat`    | `number`   | default `0`                             | Record                        |
| `createdAt`        | `Date`     | auto                                    | Création                      |
| `updatedAt`        | `Date`     | auto                                    | Mise à jour                   |

---


## `messages` (modèle `Message`)

### Champs

| Champ          | Type       | Contraintes                                        | Rôle / usage        |
|----------------|------------|----------------------------------------------------|---------------------|
| `_id`          | `ObjectId` | auto                                               | Identifiant message |
| `conversation` | `ObjectId` | **required**, `ref: "Conversation"`, `index: true` | Conversation        |
| `sender`       | `ObjectId` | **required**, `ref: "User"`                        | Auteur              |
| `content`      | `string`   | **required**                                       | Contenu             |
| `type`         | `string`   | enum `{ TEXT, IMAGE }`, default `TEXT`             | Type                |
| `createdAt`    | `Date`     | auto                                               | Création            |
| `updatedAt`    | `Date`     | auto                                               | Mise à jour         |

---


## `coachprofiles` (modèle `CoachProfile`)

### Champs

| Champ        | Type       | Contraintes                             | Rôle / usage                |
|--------------|------------|-----------------------------------------|-----------------------------|
| `_id`        | `ObjectId` | auto                                    | Identifiant profil          |
| `user`       | `ObjectId` | **required**, **unique**, `ref: "User"` | Lien 1–1 vers le user coach |
| `name`       | `string`   | default `""`                            | Nom affiché                 |
| `avatar`     | `string`   | default `""`                            | Avatar affiché              |
| `speciality` | `string`   | default `""`                            | Spécialité                  |
| `location`   | `string`   | default `""`                            | Ville / zone                |
| `price`      | `number`   | default `0`                             | Prix                        |
| `experience` | `number`   | default `0`                             | Expérience                  |
| `description`| `string`   | default `""`                            | Description                 |
| `skills`     | `string[]` | default `[]`                            | Tags / compétences          |
| `createdAt`  | `Date`     | auto                                    | Création                    |
| `updatedAt`  | `Date`     | auto                                    | Mise à jour                 |

---


## `processedstripeevents` (modèle `ProcessedStripeEvent`)

### Champs

| Champ         | Type       | Contraintes                             | Rôle / usage             |
|---------------|------------|-----------------------------------------|--------------------------|
| `_id`         | `ObjectId` | auto                                    | Identifiant              |
| `eventId`     | `string`   | **required**, **unique**, `index: true` | Idempotence Stripe       |
| `eventType`   | `string`   | **required**                            | Type Stripe              |
| `processedAt` | `Date`     | **required**, default `Date.now`        | Date de traitement (TTL) |
| `createdAt`   | `Date`     | auto                                    | Création                 |
| `updatedAt`   | `Date`     | auto                                    | Mise à jour              |

---


## `stripeaccounts` (modèle `StripeAccount`)

### Champs

| Champ             | Type       | Contraintes                             | Rôle / usage      |
|-------------------|------------|-----------------------------------------|-------------------|
| `_id`             | `ObjectId` | auto                                    | Identifiant       |
| `user`            | `ObjectId` | **required**, **unique**, `ref: "User"` | Lien 1–1          |
| `stripeAccountId` | `string`   | **required**                            | ID Stripe Connect |
| `chargesEnabled`  | `boolean`  | default `false`                         | Paiements activés |
| `payoutsEnabled`  | `boolean`  | default `false`                         | Payouts activés   |
| `createdAt`       | `Date`     | auto                                    | Création          |
| `updatedAt`       | `Date`     | auto                                    | Mise à jour       |

---


## `refreshtokens` (modèle `RefreshToken`)

### Champs

| Champ       | Type       | Contraintes                                | Rôle / usage     |
|-------------|------------|--------------------------------------------|------------------|
| `_id`       | `ObjectId` | auto                                       | Identifiant      |
| `user`      | `ObjectId` | **required**, `ref: "User"`, `index: true` | Owner            |
| `token`     | `string`   | **required**, **unique**, `index: true`    | Refresh token    |
| `expiresAt` | `Date`     | **required**                               | Expiration (TTL) |
| `createdAt` | `Date`     | auto                                       | Création         |
| `updatedAt` | `Date`     | auto                                       | Mise à jour      |

---


## `passwordresettokens` (modèle `PasswordResetToken`)

### Champs

| Champ       | Type       | Contraintes                                | Rôle / usage     |
|-------------|------------|--------------------------------------------|------------------|
| `_id`       | `ObjectId` | auto                                       | Identifiant      |
| `user`      | `ObjectId` | **required**, `ref: "User"`, `index: true` | Owner            |
| `token`     | `string`   | **required**, **unique**, `index: true`    | Reset token      |
| `expiresAt` | `Date`     | **required**                               | Expiration (TTL) |
| `used`      | `boolean`  | default `false`, `index: true`             | Consommé         |
| `createdAt` | `Date`     | auto                                       | Création         |
| `updatedAt` | `Date`     | auto                                       | Mise à jour      |

---


## `conversations` (modèle `Conversation`)

### Champs

| Champ            | Type         | Contraintes   | Rôle / usage             |
|------------------|--------------|---------------|--------------------------|
| `_id`            | `ObjectId`   | auto          | Identifiant conversation |
| `participants[]` | `ObjectId[]` | `ref: "User"` | Participants (liste)     |
| `createdAt`      | `Date`       | auto          | Création                 |
| `updatedAt`      | `Date`       | auto          | Mise à jour              |

---