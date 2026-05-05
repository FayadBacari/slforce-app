import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { Types } from 'mongoose';
import { UserRole } from '../../../shared/types/user-role.enum';
import { RefreshTokensRepository } from '../data/repositories/refresh-tokens.repository';

// The payload signed inside every access / refresh JWT.
// Kept minimal — anything else is fetched from the DB at request time.
export interface JwtTokenPayload {
  sub:   string;     // userId (subject)
  email: string;
  role:  UserRole;
}

// What we return after a login / register / refresh — both tokens at once.
export interface AccessAndRefreshTokens {
  accessToken:  string;
  refreshToken: string;
}

@Injectable()
export class AuthTokensService {
  private readonly accessSecret:      string;
  private readonly accessExpiration:  string;
  private readonly refreshSecret:     string;
  private readonly refreshExpiration: string;

  constructor(
    private readonly jwtService:          JwtService,
    private readonly configService:       ConfigService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {
    this.accessSecret      = this.configService.getOrThrow<string>('jwt.accessSecret');
    this.accessExpiration  = this.configService.getOrThrow<string>('jwt.accessExpiration');
    this.refreshSecret     = this.configService.getOrThrow<string>('jwt.refreshSecret');
    this.refreshExpiration = this.configService.getOrThrow<string>('jwt.refreshExpiration');
  }

  // Issues a fresh pair of tokens AND persists the refresh-token hash in DB
  // so we can revoke it later.
  async issueTokensForUser(params: {
    userId: Types.ObjectId;
    email:  string;
    role:   UserRole;
  }): Promise<AccessAndRefreshTokens> {
    const tokenPayload: JwtTokenPayload = {
      sub:   params.userId.toString(),
      email: params.email,
      role:  params.role,
    };

    // The `as never` cast bridges a strict typing issue in @nestjs/jwt v11 where
    // `expiresIn` expects a narrow `ms.StringValue` type instead of plain `string`.
    const accessToken = await this.jwtService.signAsync(tokenPayload, {
      secret:    this.accessSecret,
      expiresIn: this.accessExpiration as never,
    });

    const refreshToken = await this.jwtService.signAsync(tokenPayload, {
      secret:    this.refreshSecret,
      expiresIn: this.refreshExpiration as never,
    });

    // Persist the refresh token (hashed) so we can detect re-use / revoke
    await this.refreshTokensRepository.storeOne({
      userId:    params.userId,
      tokenHash: this.computeSha256Hash(refreshToken),
      expiresAt: this.computeRefreshTokenExpirationDate(),
    });

    return { accessToken, refreshToken };
  }

  // Validates a refresh token (signature + DB existence + expiration).
  // Returns the JWT payload on success; throws otherwise.
  async verifyAndDecodeRefreshToken(refreshTokenFromClient: string): Promise<JwtTokenPayload> {
    // Step 1 — Verify signature with the refresh secret
    const decodedPayload = await this.jwtService.verifyAsync<JwtTokenPayload>(
      refreshTokenFromClient,
      { secret: this.refreshSecret },
    );

    // Step 2 — Verify the token is still in the DB (not revoked)
    const tokenHash = this.computeSha256Hash(refreshTokenFromClient);
    const storedToken = await this.refreshTokensRepository.findValidOneByHash(tokenHash);
    if (!storedToken) {
      throw new Error('Refresh token has been revoked');
    }

    return decodedPayload;
  }

  // Revokes a single refresh token (used at logout).
  async revokeRefreshToken(refreshTokenFromClient: string): Promise<void> {
    const tokenHash = this.computeSha256Hash(refreshTokenFromClient);
    await this.refreshTokensRepository.deleteOneByHash(tokenHash);
  }

  // Revokes ALL refresh tokens of a user (password changed, account deleted, compromise).
  async revokeAllRefreshTokensForUser(userId: Types.ObjectId): Promise<void> {
    await this.refreshTokensRepository.deleteAllByUserId(userId);
  }

  // Internal — sha256 of the JWT string. We never store JWTs in clear text.
  private computeSha256Hash(plainTextValue: string): string {
    return createHash('sha256').update(plainTextValue).digest('hex');
  }

  // Internal — converts the configured expiration string ("30d", "168h"...) to a Date.
  // We use a simple conversion table for the most common units.
  private computeRefreshTokenExpirationDate(): Date {
    const expirationString = this.refreshExpiration;
    const numericPart = parseInt(expirationString, 10);
    const unitPart    = expirationString.slice(-1).toLowerCase();

    const millisecondsPerUnit: Record<string, number> = {
      s: 1_000,
      m: 60 * 1_000,
      h: 60 * 60 * 1_000,
      d: 24 * 60 * 60 * 1_000,
    };

    const milliseconds = numericPart * (millisecondsPerUnit[unitPart] ?? millisecondsPerUnit.d);
    return new Date(Date.now() + milliseconds);
  }
}
