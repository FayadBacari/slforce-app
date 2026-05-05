import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../../../shared/types/user-role.enum';

// Mongoose document type returned from the database.
// `userDocument.id` is the auto-stringified ObjectId for convenient use.
export type UserDocument = User & Document<Types.ObjectId>;

// The "User" collection holds account-level data (credentials, identity).
// Role-specific data (athlete physical records / coach speciality) lives in
// separate collections (AthleteProfile / CoachProfile) — this keeps the User
// document small and queries fast.
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
}

export const UserSchema = SchemaFactory.createForClass(User);
