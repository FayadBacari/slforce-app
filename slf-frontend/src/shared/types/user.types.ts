// Every type related to users and their roles lives here.

// The two possible roles in the app
export type UserRole = 'coach' | 'athlete';

// The minimal user info stored in the global auth store
export interface LoggedInUser {
  id:              string;
  email:           string;
  firstName:       string;
  lastName:        string;
  // Handle / stage name chosen during onboarding (optional)
  displayName?:    string;
  role:            UserRole;
  profilePhotoUrl: string | undefined;
  // Coach discipline badges — empty array for athletes
  disciplines:     string[];
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

// The full athlete profile fetched from the API
export interface AthleteProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhotoUrl: string | undefined;
  sport: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  weightInKg: number | undefined;
  heightInCm: number | undefined;
  goals: string;
  bio: string;
}

// The full coach profile fetched from the API
export interface CoachProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhotoUrl: string | undefined;
  specialty: string;
  yearsOfExperience: number;
  hourlyRateInEuros: number;
  bio: string;
  rating: number;
  numberOfReviews: number;
  isAvailable: boolean;
}
