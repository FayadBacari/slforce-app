import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UserRole } from '../../../../shared/types/user-role.enum';

// Encapsulates ALL Mongoose queries on the User collection.
// Service layer NEVER touches Mongoose directly — this keeps things testable
// and lets us swap MongoDB for another store later without rewriting business logic.
@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  // Returns the user document if found, else null.
  // Used by the auth flow to verify credentials.
  async findOneByEmail(emailToFind: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: emailToFind.toLowerCase() }).exec();
  }

  async findOneById(userId: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    return this.userModel.findById(userId).exec();
  }

  // Returns true if an account already uses this email.
  async doesEmailAlreadyExist(emailToCheck: string): Promise<boolean> {
    const matchingUser = await this.userModel.exists({ email: emailToCheck.toLowerCase() });
    return matchingUser !== null;
  }

  // All profile fields are optional — only filled fields are persisted.
  // Saving everything in one create() call avoids a second round-trip to MongoDB
  // and guarantees the registration response always returns the full profile.
  async createOne(params: {
    email:            string;
    hashedPassword:   string;
    firstName:        string;
    lastName:         string;
    role:             UserRole;
    profilePhotoUrl?: string;
    // ── Shared profile fields ────────────────────────────────────────────────
    displayName?:     string;
    // ── Coach profile fields ─────────────────────────────────────────────────
    speciality?:      string;
    bio?:             string;
    location?:        string;
    monthlyRate?:     number;
    experienceYears?: number;
    disciplines?:     string[];
    // ── Athlete profile fields ───────────────────────────────────────────────
    gender?:          string;
    weightCategory?:  string;
    weightKg?:        number;
    heightCm?:        number;
    recordMuscleUp?:  number;
    recordTraction?:  number;
    recordDips?:      number;
    recordSquat?:     number;
  }): Promise<UserDocument> {
    return this.userModel.create({
      email:           params.email,
      password:        params.hashedPassword,
      firstName:       params.firstName,
      lastName:        params.lastName,
      role:            params.role,
      profilePhotoUrl: params.profilePhotoUrl,
      displayName:     params.displayName,
      speciality:      params.speciality,
      bio:             params.bio,
      location:        params.location,
      monthlyRate:     params.monthlyRate,
      experienceYears: params.experienceYears,
      disciplines:     params.disciplines ?? [],
      gender:          params.gender,
      weightCategory:  params.weightCategory,
      weightKg:        params.weightKg,
      heightCm:        params.heightCm,
      recordMuscleUp:  params.recordMuscleUp,
      recordTraction:  params.recordTraction,
      recordDips:      params.recordDips,
      recordSquat:     params.recordSquat,
    });
  }

  async updateLastLoginTimestamp(userId: Types.ObjectId): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { lastLoginAt: new Date() } },
    ).exec();
  }

  async updateProfileFields(
    userId: string,
    fieldsToUpdate: Partial<Pick<User,
      'displayName' | 'firstName' | 'lastName' | 'phoneNumber' | 'profilePhotoUrl' |
      'speciality' | 'bio' | 'location' | 'monthlyRate' | 'experienceYears' | 'disciplines' |
      'gender' | 'weightCategory' | 'weightKg' | 'heightCm' |
      'recordMuscleUp' | 'recordTraction' | 'recordDips' | 'recordSquat'
    >>,
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    return this.userModel
      .findByIdAndUpdate(userId, { $set: fieldsToUpdate }, { new: true })
      .exec();
  }

  async updatePassword(userId: Types.ObjectId, newHashedPassword: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { password: newHashedPassword } },
    ).exec();
  }

  // Returns the number of active users with the given role.
  // Used by the platform-stats endpoint (/users/stats).
  async countByRole(role: UserRole): Promise<number> {
    return this.userModel.countDocuments({ role, isActive: true }).exec();
  }

  // Saves (or clears) the Stripe Express account ID for a coach.
  // Pass null to disconnect (remove the reference from DB).
  async updateStripeAccountId(userId: string, stripeAccountId: string | null): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) return;
    const update = stripeAccountId
      ? { $set:   { stripeAccountId } }
      : { $unset: { stripeAccountId: '' } };
    await this.userModel.updateOne({ _id: userId }, update).exec();
  }

  // Returns the N most recently registered active coaches whose profile is public.
  // isProfilePublic: false hides the account from search results entirely.
  async findRecentCoaches(limit: number): Promise<UserDocument[]> {
    return this.userModel
      .find({ role: UserRole.Coach, isActive: true, isProfilePublic: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-password')   // never send the hash to any consumer
      .exec();
  }

  // Returns the N most recently registered active athletes whose profile is public.
  async findRecentAthletes(limit: number): Promise<UserDocument[]> {
    return this.userModel
      .find({ role: UserRole.Athlete, isActive: true, isProfilePublic: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-password')
      .exec();
  }

  // Soft-deletes an account: marks it inactive, anonymises all personal data
  // so the original email / name / photo are freed immediately, and clears every
  // profile field. The document stays in MongoDB so Stripe payment history and
  // audit trails remain intact.
  async softDeleteAccount(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) return;
    const timestamp = Date.now();
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          isActive:    false,
          deletedAt:   new Date(),
          // Replace PII with neutral placeholders — original email freed for re-use
          email:       `deleted_${timestamp}@deleted.invalid`,
          firstName:   'Compte',
          lastName:    'Supprimé',
          // Unusable password hash — account can never be logged into again
          password:    'DELETED_ACCOUNT_NO_ACCESS',
          disciplines: [],
        },
        $unset: {
          profilePhotoUrl:  '',
          displayName:      '',
          phoneNumber:      '',
          speciality:       '',
          bio:              '',
          location:         '',
          monthlyRate:      '',
          experienceYears:  '',
          gender:           '',
          weightCategory:   '',
          weightKg:         '',
          heightCm:         '',
          recordMuscleUp:   '',
          recordTraction:   '',
          recordDips:       '',
          recordSquat:      '',
          stripeAccountId:  '',
          lastLoginAt:      '',
        },
      },
    ).exec();
  }

  // Saves one or both privacy flags for a user.
  // Only the provided fields are updated — undefined values are ignored.
  async updatePrivacySettings(
    userId: string,
    settings: { isProfilePublic?: boolean; showOnlineStatus?: boolean },
  ): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) return;
    const fieldsToSet: Record<string, boolean> = {};
    if (settings.isProfilePublic  !== undefined) fieldsToSet.isProfilePublic  = settings.isProfilePublic;
    if (settings.showOnlineStatus !== undefined) fieldsToSet.showOnlineStatus = settings.showOnlineStatus;
    if (Object.keys(fieldsToSet).length === 0) return;
    await this.userModel.updateOne({ _id: userId }, { $set: fieldsToSet }).exec();
  }
}
