import { UserRole } from '../../../../shared/types/user-role.enum';

// The user info we send back to the client after a successful auth.
// MUST match exactly the shape `LoggedInUser` expected by the frontend
// (slf-front/src/shared/types/user.types.ts).
export interface AuthenticatedUserResponse {
  id:               string;
  email:            string;
  firstName:        string;
  lastName:         string;
  role:             UserRole;
  profilePhotoUrl?: string;
  // Coach disciplines shown as badges in search and profile
  disciplines:      string[];
  // Coach-specific profile fields (undefined for athletes)
  speciality?:      string;
  bio?:             string;
  location?:        string;
  monthlyRate?:     number;
  experienceYears?: number;
  // Athlete-specific profile fields (undefined for coaches)
  gender?:          string;
  weightCategory?:  string;
  weightKg?:        number;
  heightCm?:        number;
  recordMuscleUp?:  number;
  recordTraction?:  number;
  recordDips?:      number;
  recordSquat?:     number;
}

// What POST /auth/login, /auth/register and /auth/refresh return.
export interface AuthenticationSuccessResponse {
  user:         AuthenticatedUserResponse;
  accessToken:  string;
  refreshToken: string;
}
