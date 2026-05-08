import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '@modules/users/data/repositories/users.repository';
import { PasswordHashService } from './password-hash.service';
import { AuthTokensService } from './auth-tokens.service';
import { PasswordResetRepository } from '../data/repositories/password-reset.repository';
import { EmailService } from '@core/email/email.service';
import { RegisterRequestDto } from '../presentation/dto/register.dto';
import { LoginRequestDto } from '../presentation/dto/login.dto';
import { AuthenticationSuccessResponse } from '../presentation/dto/auth-response.dto';
import { formatUserForClient } from '@modules/users/utils/format-user-for-client.util';
import { generateDefaultAvatarUrl } from '@shared/utils/generate-avatar-url.util';

// The auth flow's "use case" layer.
// Coordinates the repositories and the technical services to fulfil the
// public auth API. Controllers simply delegate to this service.
@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);
  private readonly resetPasswordBaseUrl: string;

  constructor(
    private readonly usersRepository:        UsersRepository,
    private readonly passwordHashService:     PasswordHashService,
    private readonly authTokensService:       AuthTokensService,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly emailService:            EmailService,
    private readonly configService:           ConfigService,
  ) {
    this.resetPasswordBaseUrl = this.configService.getOrThrow<string>('email.resetPasswordUrl');
  }

  // ─── REGISTER ────────────────────────────────────────────────────────────
  async registerNewUser(registrationData: RegisterRequestDto): Promise<AuthenticationSuccessResponse> {
    const isEmailAlreadyTaken = await this.usersRepository.doesEmailAlreadyExist(registrationData.email);
    if (isEmailAlreadyTaken) {
      throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
    }

    const hashedPassword = await this.passwordHashService.hashPlaintextPassword(
      registrationData.password,
    );

    // Generate a default avatar (blue circle + initials) and persist it in
    // MongoDB immediately — every new account has a valid profilePhotoUrl
    // from day one, shared identically across profile, search and chat.
    const defaultAvatarUrl = generateDefaultAvatarUrl(
      registrationData.firstName,
      registrationData.lastName,
    );

    // Extract role-specific profile data sent by the onboarding screens.
    const coach   = registrationData.coachProfile;
    const athlete = registrationData.athleteProfile;

    const newlyCreatedUser = await this.usersRepository.createOne({
      email:           registrationData.email,
      hashedPassword,
      firstName:       registrationData.firstName,
      lastName:        registrationData.lastName,
      role:            registrationData.role,
      profilePhotoUrl: defaultAvatarUrl,
      // Shared
      displayName:     coach?.displayName    ?? athlete?.displayName,
      // Coach-specific
      speciality:      coach?.speciality,
      bio:             coach?.description,
      location:        coach?.location,
      monthlyRate:     coach?.pricePerMonth,
      experienceYears: coach?.experienceYears,
      disciplines:     coach?.skills         ?? [],
      // Athlete-specific
      gender:          athlete?.gender,
      weightCategory:  athlete?.weightCategory,
      weightKg:        athlete?.weightKg,
      heightCm:        athlete?.heightCm,
      recordMuscleUp:  athlete?.records?.muscleUp,
      recordTraction:  athlete?.records?.traction,
      recordDips:      athlete?.records?.dips,
      recordSquat:     athlete?.records?.squat,
    });

    const issuedTokens = await this.authTokensService.issueTokensForUser({
      userId: newlyCreatedUser._id,
      email:  newlyCreatedUser.email,
      role:   newlyCreatedUser.role,
    });

    return {
      user:         formatUserForClient(newlyCreatedUser),
      accessToken:  issuedTokens.accessToken,
      refreshToken: issuedTokens.refreshToken,
    };
  }

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  async authenticateExistingUser(loginCredentials: LoginRequestDto): Promise<AuthenticationSuccessResponse> {
    const userInDatabase = await this.usersRepository.findOneByEmail(loginCredentials.email);

    // We use the SAME error for "user not found" and "wrong password" on purpose:
    // it prevents attackers from learning which emails are registered.
    const credentialsAreInvalid = new UnauthorizedException('E-mail ou mot de passe incorrect.');

    if (!userInDatabase) {
      throw credentialsAreInvalid;
    }
    if (!userInDatabase.isActive) {
      throw new UnauthorizedException('Ce compte est désactivé.');
    }

    const passwordIsCorrect = await this.passwordHashService.doesPlaintextMatchHash(
      loginCredentials.password,
      userInDatabase.password,
    );
    if (!passwordIsCorrect) {
      throw credentialsAreInvalid;
    }

    // Best-effort: track last login. Failure here doesn't block login.
    await this.usersRepository.updateLastLoginTimestamp(userInDatabase._id);

    const issuedTokens = await this.authTokensService.issueTokensForUser({
      userId: userInDatabase._id,
      email:  userInDatabase.email,
      role:   userInDatabase.role,
    });

    return {
      user:         formatUserForClient(userInDatabase),
      accessToken:  issuedTokens.accessToken,
      refreshToken: issuedTokens.refreshToken,
    };
  }

  // ─── REFRESH ─────────────────────────────────────────────────────────────
  async issueNewTokensFromRefreshToken(
    refreshTokenFromClient: string,
  ): Promise<AuthenticationSuccessResponse> {
    let decodedPayload;
    try {
      decodedPayload = await this.authTokensService.verifyAndDecodeRefreshToken(refreshTokenFromClient);
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré.');
    }

    const userInDatabase = await this.usersRepository.findOneById(decodedPayload.sub);
    if (!userInDatabase || !userInDatabase.isActive) {
      throw new UnauthorizedException('Compte introuvable ou désactivé.');
    }

    // Token rotation — invalidate the old refresh token immediately so it can't be reused
    await this.authTokensService.revokeRefreshToken(refreshTokenFromClient);

    const issuedTokens = await this.authTokensService.issueTokensForUser({
      userId: userInDatabase._id,
      email:  userInDatabase.email,
      role:   userInDatabase.role,
    });

    return {
      user:         formatUserForClient(userInDatabase),
      accessToken:  issuedTokens.accessToken,
      refreshToken: issuedTokens.refreshToken,
    };
  }

  // ─── LOGOUT ──────────────────────────────────────────────────────────────
  async logoutByRevokingRefreshToken(refreshTokenFromClient: string): Promise<void> {
    // We don't throw if the token isn't found — logout is idempotent
    await this.authTokensService.revokeRefreshToken(refreshTokenFromClient);
  }

  // ─── FORGOT PASSWORD ─────────────────────────────────────────────────────
  //
  // Sends a reset email if the address matches an account.
  // SECURITY: always returns the same response whether the email exists or not —
  // this prevents enumeration attacks (an attacker learning which emails are registered).
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersRepository.findOneByEmail(email);
    if (!user) return; // silent — same response as when found

    // Cryptographically-secure random token (64 hex chars = 256 bits of entropy)
    const plainToken = randomBytes(32).toString('hex');
    const tokenHash  = createHash('sha256').update(plainToken).digest('hex');

    await this.passwordResetRepository.create({
      userId:    user._id as Types.ObjectId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1_000), // 30 minutes
    });

    const resetUrl = `${this.resetPasswordBaseUrl}?token=${plainToken}`;

    // Best-effort send — we log failures but NEVER let an email error surface
    // as a 500 to the client. Two reasons:
    //   1. Returning 500 only when the email exists leaks which addresses are
    //      registered (enumeration attack — breaks our constant-response guarantee).
    //   2. The reset token is already persisted; the user can simply request again.
    try {
      await this.emailService.sendPasswordResetEmail({
        to:        user.email,
        firstName: user.firstName,
        resetUrl,
      });
    } catch (emailError) {
      this.logger.error('Password reset email delivery failed', emailError);
    }
  }

  // ─── RESET PASSWORD ───────────────────────────────────────────────────────
  //
  // Validates the token, updates the password, then invalidates the token
  // and all active sessions so the account is fully secured immediately.
  async resetPassword(plainToken: string, newPassword: string): Promise<void> {
    const tokenHash  = createHash('sha256').update(plainToken).digest('hex');
    const storedToken = await this.passwordResetRepository.findValidOneByHash(tokenHash);

    if (!storedToken) {
      throw new BadRequestException('Ce lien est invalide ou a expiré. Demande un nouveau lien.');
    }

    const newHashedPassword = await this.passwordHashService.hashPlaintextPassword(newPassword);

    // All three writes in parallel — they don't depend on each other.
    await Promise.all([
      this.usersRepository.updatePassword(storedToken.userId, newHashedPassword),
      this.passwordResetRepository.deleteOneByHash(tokenHash),
      this.authTokensService.revokeAllRefreshTokensForUser(storedToken.userId),
    ]);
  }

}
