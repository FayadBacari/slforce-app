import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../../../shared/types/user-role.enum';

// Mongoose document type returned from the database.
// `userDocument.id` is the auto-stringified ObjectId for convenient use.
export type UserDocument = User & Document<Types.ObjectId>;

// The "User" collection holds all account and profile data in a single document.
// Coach-specific fields (speciality, bio, monthlyRate…) and athlete-specific
// fields (gender, weightCategory, records…) are stored directly here alongside
// credentials — no separate AthleteProfile / CoachProfile collections.
@Schema({
  collection:   'users',
  timestamps:   true,   // adds createdAt / updatedAt automatically
  versionKey:   false,  // no __v field
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email!: string;

  // The bcrypt hash. NEVER serialised to the client (controllers project away).
  @Prop({ required: true })
  password!: string;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  // Nickname / handle chosen during onboarding — used as the @handle in the app.
  // Distinct from firstName+lastName so coaches/athletes can have a stage name.
  @Prop({ trim: true })
  displayName?: string;

  @Prop({ trim: true })
  phoneNumber?: string;

  // URL or base64 of the user's avatar
  @Prop()
  profilePhotoUrl?: string;

  // ── Coach-specific profile fields ──────────────────────────────────────────
  // Stored directly on User for simplicity until CoachProfile collection lands.

  @Prop({ trim: true })
  speciality?: string;        // e.g. "Street-Lifting, Endurance"

  @Prop({ trim: true })
  bio?: string;               // short description shown on the search card

  @Prop({ trim: true })
  location?: string;          // city / region

  @Prop({ min: 0 })
  monthlyRate?: number;       // price per month in euros

  @Prop({ min: 0 })
  experienceYears?: number;   // years of coaching experience

  @Prop({ required: true, enum: Object.values(UserRole) })
  role!: UserRole;

  @Prop({ default: true })
  isActive!: boolean;

  // ── Athlete-specific profile fields ───────────────────────────────────────
  @Prop({ trim: true })
  gender?: string;           // 'male' | 'female'

  @Prop({ trim: true })
  weightCategory?: string;   // e.g. '-73'

  @Prop({ min: 0 })
  weightKg?: number;

  @Prop({ min: 0 })
  heightCm?: number;

  // Personal records (kg) — stored as individual fields for simplicity
  @Prop({ min: 0 })
  recordMuscleUp?: number;

  @Prop({ min: 0 })
  recordTraction?: number;

  @Prop({ min: 0 })
  recordDips?: number;

  @Prop({ min: 0 })
  recordSquat?: number;

  // ── Coach disciplines (multi-select badges chosen at registration/profile edit)
  // e.g. ['Street-Lifting', 'Freestyle']
  @Prop({ type: [String], default: [] })
  disciplines!: string[];

  // ── Privacy settings ───────────────────────────────────────────────────────
  // isProfilePublic: when false the account is hidden from search results.
  // showOnlineStatus: when false, other users see "Désactivé" instead of the
  //   real presence indicator in the chat screen. This field is also synced to
  //   the Stream user object so the mobile client can read it from channel members.
  @Prop({ default: true })
  isProfilePublic!: boolean;

  @Prop({ default: true })
  showOnlineStatus!: boolean;

  // ── Stripe Connect (coach only) ────────────────────────────────────────────
  // acct_xxx — the Stripe Express account ID linked to this coach.
  // null / undefined means the coach has not started the Stripe onboarding yet.
  @Prop({ trim: true, index: true })
  stripeAccountId?: string;

  // Timestamps managed by Mongoose `timestamps: true`
  createdAt!: Date;
  updatedAt!: Date;

  @Prop()
  lastLoginAt?: Date;

  // Set when the user triggers account deletion (soft-delete).
  // The document stays in MongoDB for audit/Stripe traceability but
  // all personal data is anonymised and isActive is set to false.
  @Prop()
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// ─── Compound indexes ──────────────────────────────────────────────────────────
// Without these, every search-screen load is a full collection scan.
//
// 1. Search queries: find recent coaches/athletes filtered by role + isActive,
//    sorted by createdAt. The sort field must be last in the compound index.
UserSchema.index({ role: 1, isActive: 1, createdAt: -1 });

// 2. Platform-stats query: countDocuments({ role, isActive }) — omits the sort
//    so a lighter index without createdAt covers it efficiently.
UserSchema.index({ role: 1, isActive: 1 });
