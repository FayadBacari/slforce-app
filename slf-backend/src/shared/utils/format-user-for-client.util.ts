import { Types } from 'mongoose';
import { UserDocument } from '../../modules/auth/data/schemas/user.schema';
import { AuthenticatedUserResponse } from '../../modules/auth/presentation/dto/auth-response.dto';
import { generateDefaultAvatarUrl } from './generate-avatar-url.util';

// ─── formatUserForClient ───────────────────────────────────────────────────────
//
// Converts a Mongoose UserDocument into the shape returned to authenticated
// clients. Used by AuthenticationService, UsersService, and any other service
// that needs to build an AuthenticatedUserResponse.
//
// Guarantees:
//   • profilePhotoUrl is always set — fallback to a generated avatar if unset.
//   • disciplines is always an array (never undefined).
//   • The password hash is never included (not part of AuthenticatedUserResponse).
export function formatUserForClient(userDocument: UserDocument): AuthenticatedUserResponse {
  return {
    id:              (userDocument._id as Types.ObjectId).toString(),
    email:           userDocument.email,
    firstName:       userDocument.firstName,
    lastName:        userDocument.lastName,
    displayName:     userDocument.displayName,
    role:            userDocument.role,
    // Always return a valid avatar URL — accounts created before automatic avatar
    // generation get a generated blue-circle-initials URL on the fly.
    profilePhotoUrl:
      userDocument.profilePhotoUrl ||
      generateDefaultAvatarUrl(userDocument.firstName, userDocument.lastName),
    disciplines:     userDocument.disciplines   ?? [],
    // Coach-specific fields — present only when filled by the coach
    speciality:      userDocument.speciality,
    bio:             userDocument.bio,
    location:        userDocument.location,
    monthlyRate:     userDocument.monthlyRate,
    experienceYears: userDocument.experienceYears,
    // Athlete-specific fields — present only when filled by the athlete
    gender:          userDocument.gender,
    weightCategory:  userDocument.weightCategory,
    weightKg:        userDocument.weightKg,
    heightCm:        userDocument.heightCm,
    recordMuscleUp:  userDocument.recordMuscleUp,
    recordTraction:  userDocument.recordTraction,
    recordDips:      userDocument.recordDips,
    recordSquat:     userDocument.recordSquat,
  };
}
