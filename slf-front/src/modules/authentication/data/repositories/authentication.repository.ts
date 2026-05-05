import type { IAuthenticationRepository } from '../../domain/interfaces/authentication-repository.interface';
import type {
  LoginCredentials,
  AthleteRegistrationData,
  CoachRegistrationData,
  AuthenticationResult,
} from '../../domain/entities/user.entity';
import {
  callLoginApiEndpoint,
  callRegisterAthleteApiEndpoint,
  callRegisterCoachApiEndpoint,
  callForgotPasswordApiEndpoint,
  callResetPasswordApiEndpoint,
  callLogoutApiEndpoint,
} from '../data-sources/authentication-api.data-source';
import { readValueFromSecureStorage } from '@core/storage/secure-storage';
import { SECURE_STORAGE_KEYS } from '@core/storage/secure-storage-keys';

// Implements the IAuthenticationRepository interface.
// This is the bridge between the domain (use-cases) and the data source (API calls).
// Use-cases call this repository — they never call the API directly.
export class AuthenticationRepository implements IAuthenticationRepository {
  async loginWithEmailAndPassword(
    credentials: LoginCredentials,
  ): Promise<AuthenticationResult> {
    return callLoginApiEndpoint(credentials);
  }

  async registerNewAthleteAccount(
    data: AthleteRegistrationData,
  ): Promise<AuthenticationResult> {
    return callRegisterAthleteApiEndpoint(data);
  }

  async registerNewCoachAccount(
    data: CoachRegistrationData,
  ): Promise<AuthenticationResult> {
    return callRegisterCoachApiEndpoint(data);
  }

  async sendPasswordResetEmailToUser(email: string): Promise<void> {
    return callForgotPasswordApiEndpoint(email);
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    return callResetPasswordApiEndpoint(token, newPassword);
  }

  async logoutCurrentUser(): Promise<void> {
    // The backend revokes a SPECIFIC refresh token — pass the saved one so it can be invalidated server-side.
    const savedRefreshToken = await readValueFromSecureStorage(SECURE_STORAGE_KEYS.refreshToken);
    return callLogoutApiEndpoint(savedRefreshToken);
  }
}

// Single shared instance — we never need more than one
export const authenticationRepository = new AuthenticationRepository();
