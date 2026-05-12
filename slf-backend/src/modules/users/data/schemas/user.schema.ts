import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '@shared/types/user-role.enum';

// ─── User schema ───────────────────────────────────────────────────────────────
//
// La collection "users" stocke les credentials + le profil dans UN SEUL document.
// Aujourd'hui les champs spécifiques coach (speciality, bio, monthlyRate…) et
// athlète (gender, weightCategory, records…) cohabitent ici directement.
//
// ─── 🚧 Plan de migration future (Phase 2) ─────────────────────────────────────
//
// Quand le volume justifiera la séparation, on extraira deux collections :
//
//   users            → identité + auth (email, password, role, isActive…)
//   coach_profiles   → champs coach   (speciality, bio, monthlyRate, disciplines…)
//   athlete_profiles → champs athlete (gender, weightCategory, records…)
//
// Migration (à orchestrer avec un script one-shot dans `scripts/migrations/`) :
//   1. Créer les collections coach_profiles et athlete_profiles
//   2. Pour chaque user, copier les champs role-specific dans la nouvelle collection
//   3. Supprimer les champs role-specific du document User
//   4. Mettre à jour : UsersRepository + SearchService + UsersController + DTOs
//
// Le découpage TypeScript ci-dessous (UserAuthFields / UserCoachProfileFields /
// UserAthleteProfileFields) anticipe cette séparation : chaque consumer peut
// déjà ne typer que la projection qui l'intéresse.

// ─── Sous-types — anticipent les futures collections ──────────────────────────

// Champs strictement liés à l'authentification et l'identité de base.
// Resteront dans la collection `users` après le split.
export interface UserAuthFields {
  email:                 string;
  password:              string;
  firstName:             string;
  lastName:              string;
  displayName?:          string;
  phoneNumber?:          string;
  profilePhotoUrl?:      string;
  // Cloudinary publicId de la photo de profil active — persisté pour pouvoir
  // supprimer l'ancienne version quand l'utilisateur upload une nouvelle photo
  // (cf. UsersController.uploadProfilePhoto). Indispensable pour ne pas
  // accumuler des photos orphelines dans Cloudinary à chaque changement.
  profilePhotoPublicId?: string;
  role:                  UserRole;
  isActive:              boolean;
  isProfilePublic:       boolean;
  showOnlineStatus:      boolean;
  stripeAccountId?:      string;
  lastLoginAt?:          Date;
  deletedAt?:            Date;
}

// Champs spécifiques au profil coach. Migreront vers `coach_profiles`.
export interface UserCoachProfileFields {
  speciality?:      string;
  bio?:             string;
  location?:        string;
  monthlyRate?:     number;
  experienceYears?: number;
  disciplines:      string[];
}

// Champs spécifiques au profil athlète. Migreront vers `athlete_profiles`.
export interface UserAthleteProfileFields {
  gender?:         string;
  weightCategory?: string;
  weightKg?:       number;
  heightCm?:       number;
  recordMuscleUp?: number;
  recordTraction?: number;
  recordDips?:     number;
  recordSquat?:    number;
}

// Type Mongoose document — exposé partout dans le code.
export type UserDocument = User & Document<Types.ObjectId>;

@Schema({
  collection: 'users',
  timestamps: true,   // ajoute createdAt / updatedAt automatiquement
  versionKey: false,  // pas de champ __v
})
export class User
  implements UserAuthFields, UserCoachProfileFields, UserAthleteProfileFields
{
  // ── 🔐 Auth & identité ───────────────────────────────────────────────────────

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email!: string;

  // Hash bcrypt. JAMAIS sérialisé vers le client (les controllers projettent away).
  @Prop({ required: true })
  password!: string;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  // Pseudo / handle choisi à l'onboarding — utilisé comme @handle dans l'app.
  // Distinct de firstName+lastName : permet aux coachs/athlètes d'avoir un nom de scène.
  @Prop({ trim: true })
  displayName?: string;

  @Prop({ trim: true })
  phoneNumber?: string;

  @Prop()
  profilePhotoUrl?: string;

  // Cloudinary publicId — voir UserAuthFields pour le rationale.
  @Prop()
  profilePhotoPublicId?: string;

  @Prop({ required: true, enum: Object.values(UserRole) })
  role!: UserRole;

  @Prop({ default: true })
  isActive!: boolean;

  // ── 🔒 Privacy ───────────────────────────────────────────────────────────────
  // isProfilePublic  : false → masqué des résultats de search.
  // showOnlineStatus : false → "Désactivé" affiché dans le chat (synchronisé Stream).

  @Prop({ default: true })
  isProfilePublic!: boolean;

  @Prop({ default: true })
  showOnlineStatus!: boolean;

  // ── 💳 Stripe Connect (coach uniquement) ─────────────────────────────────────
  // acct_xxx — l'ID du compte Stripe Express lié à ce coach.
  // null/undefined = pas encore commencé l'onboarding Stripe.

  @Prop({ trim: true, index: true })
  stripeAccountId?: string;

  // ── 🏋️ Profil coach ──────────────────────────────────────────────────────────
  // À EXTRAIRE vers `coach_profiles` lors du split. Cf. docblock en tête.

  @Prop({ trim: true })
  speciality?: string;        // ex: "Street-Lifting, Endurance"

  @Prop({ trim: true })
  bio?: string;               // description courte (search card)

  @Prop({ trim: true })
  location?: string;          // ville / région

  @Prop({ min: 0 })
  monthlyRate?: number;       // prix mensuel en euros

  @Prop({ min: 0 })
  experienceYears?: number;

  // Disciplines multi-select (badges) — ex: ['Street-Lifting', 'Freestyle']
  @Prop({ type: [String], default: [] })
  disciplines!: string[];

  // ── 🥇 Profil athlète ────────────────────────────────────────────────────────
  // À EXTRAIRE vers `athlete_profiles` lors du split. Cf. docblock en tête.

  @Prop({ trim: true })
  gender?: string;            // 'male' | 'female'

  @Prop({ trim: true })
  weightCategory?: string;    // ex: '-73'

  @Prop({ min: 0 })
  weightKg?: number;

  @Prop({ min: 0 })
  heightCm?: number;

  // Records personnels (kg) — un champ par mouvement.
  @Prop({ min: 0 })
  recordMuscleUp?: number;

  @Prop({ min: 0 })
  recordTraction?: number;

  @Prop({ min: 0 })
  recordDips?: number;

  @Prop({ min: 0 })
  recordSquat?: number;

  // ── 🕒 Timestamps ────────────────────────────────────────────────────────────
  // Gérés automatiquement par Mongoose `timestamps: true`.
  createdAt!: Date;
  updatedAt!: Date;

  @Prop()
  lastLoginAt?: Date;

  // Set quand l'utilisateur déclenche la suppression (soft-delete).
  // Le document reste en MongoDB pour audit/Stripe ; les PII sont anonymisées.
  @Prop()
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// ─── Compound indexes ──────────────────────────────────────────────────────────
// Sans ces indexes, chaque chargement de la search-screen est un full scan.

// 1. Search : trouver les coachs/athlètes récents filtrés par role + isActive,
//    triés par createdAt. Le champ de tri DOIT être en dernier dans l'index.
UserSchema.index({ role: 1, isActive: 1, createdAt: -1 });

// 2. Stats plateforme : countDocuments({ role, isActive }) — pas de tri,
//    donc un index plus léger sans createdAt suffit à le couvrir.
UserSchema.index({ role: 1, isActive: 1 });
