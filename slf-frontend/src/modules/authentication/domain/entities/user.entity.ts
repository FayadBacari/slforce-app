import type { UserRole } from '@shared/types/user.types';

export interface UserEntity {
  id:              string;
  email:           string;
  firstName:       string;
  lastName:        string;
  // Handle / stage name chosen during onboarding (optional)
  displayName?:    string;
  role:            UserRole;
  profilePhotoUrl: string | undefined;
  // Optional — le backend ne renvoie pas createdAt sur les endpoints /auth
  // (login/register/refresh). À récupérer via GET /users/profile si nécessaire.
  // Avant cette correction, on stockait `new Date()` côté front, ce qui était
  // factuellement faux (date du login, pas de la création de compte).
  createdAt?:      Date;
  disciplines:     string[];
  // Coach-specific profile fields
  speciality?:      string;
  bio?:             string;
  location?:        string;
  monthlyRate?:     number;
  experienceYears?: number;
  // Athlete-specific profile fields
  gender?:          string;
  weightCategory?:  string;
  weightKg?:        number;
  heightCm?:        number;
  recordMuscleUp?:  number;
  recordTraction?:  number;
  recordDips?:      number;
  recordSquat?:     number;
}

export interface LoginCredentials {
  email:    string;
  password: string;
}

// Profile data collected during the multi-step onboarding after account creation.
export interface AthleteProfileData {
  displayName:    string;
  gender:         'male' | 'female' | '';
  weightCategory: string;
  weightKg:       string;
  heightCm:       string;
  records: {
    muscleUp: string;
    traction: string;
    dips:     string;
    squat:    string;
  };
}

export interface CoachProfileData {
  displayName:     string;
  speciality:      string;
  location:        string;
  pricePerMonth:   string;
  experienceYears: string;
  description:     string;
  skills:          string[];
}

// What the RegisterScreen collects (step 0 — account info only).
export interface AccountRegistrationData {
  email:     string;
  password:  string;
  firstName: string;
  lastName:  string;
}

// Full registration payload sent to the backend — account + profile.
export interface AthleteRegistrationData extends AccountRegistrationData {
  athleteProfile: AthleteProfileData;
}

export interface CoachRegistrationData extends AccountRegistrationData {
  coachProfile: CoachProfileData;
}

export interface AuthenticationResult {
  user:         UserEntity;
  accessToken:  string;
  refreshToken: string;
}
