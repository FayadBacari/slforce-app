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
    // Le data-source renvoie le message backend (utile en dev pour
    // logger/afficher le retour). L'interface IAuthenticationRepository
    // contractualise `Promise<void>` — on ignore donc le message ici pour
    // ne pas casser le contrat. Si un caller veut afficher le message,
    // il devra passer par le data-source directement (intentionnel — c'est
    // un détail HTTP qui ne devrait pas remonter dans le use-case).
    await callForgotPasswordApiEndpoint(email);
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    await callResetPasswordApiEndpoint(token, newPassword);
  }

  async logoutCurrentUser(): Promise<void> {
    // The backend revokes a SPECIFIC refresh token — pass the saved one so it can
    // be invalidated server-side.  We fire-and-forget the server call: if the
    // device is offline or the token is already expired, the API call will fail
    // but local cleanup (stores + SecureStorage) must still succeed, so we swallow
    // the error here and let the caller handle store/nav cleanup unconditionally.
    const savedRefreshToken = await readValueFromSecureStorage(SECURE_STORAGE_KEYS.refreshToken);
    try {
      await callLogoutApiEndpoint(savedRefreshToken);
    } catch {
      // Best-effort: server-side revocation failed (offline, token already expired, etc.).
      // Local cleanup will still proceed in the calling use-case.
    }
  }
}

// Single shared instance — we never need more than one
export const authenticationRepository = new AuthenticationRepository();
