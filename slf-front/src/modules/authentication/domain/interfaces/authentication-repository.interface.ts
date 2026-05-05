import type {
  LoginCredentials,
  AthleteRegistrationData,
  CoachRegistrationData,
  AuthenticationResult,
} from '../entities/user.entity';

// The contract that the data layer must fulfill.
// The domain layer only knows this interface — it never talks to the API directly.
// This makes it easy to swap out the data source (e.g. for testing) without
// changing any domain logic.
export interface IAuthenticationRepository {
  loginWithEmailAndPassword(credentials: LoginCredentials): Promise<AuthenticationResult>;
  registerNewAthleteAccount(data: AthleteRegistrationData): Promise<AuthenticationResult>;
  registerNewCoachAccount(data: CoachRegistrationData): Promise<AuthenticationResult>;
  sendPasswordResetEmailToUser(email: string): Promise<void>;
  resetPasswordWithToken(token: string, newPassword: string): Promise<void>;
  logoutCurrentUser(): Promise<void>;
}
