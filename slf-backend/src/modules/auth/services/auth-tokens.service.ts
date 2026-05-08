import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { Types } from 'mongoose';
import { UserRole } from '@shared/types/user-role.enum';
import { RefreshTokensRepository } from '../data/repositories/refresh-tokens.repository';

// Le payload signé dans tous les access / refresh JWT.
// On garde le minimum — tout le reste est rechargé depuis la DB à chaque requête.
export interface JwtTokenPayload {
  sub:   string;     // userId (subject)
  email: string;
  role:  UserRole;
}

// La paire de tokens retournée après login / register / refresh.
export interface AccessAndRefreshTokens {
  accessToken:  string;
  refreshToken: string;
}

// Shape du JWT décodé brut — `exp` est ajouté par jsonwebtoken après signature.
// Exprimé en secondes Unix (norme RFC 7519).
interface JwtPayloadWithExpiration extends JwtTokenPayload {
  exp: number;
}

@Injectable()
export class AuthTokensService {
  private readonly logger = new Logger(AuthTokensService.name);

  private readonly accessSecret:      string;
  private readonly accessExpiration:  string;
  private readonly refreshSecret:     string;
  private readonly refreshExpiration: string;

  constructor(
    private readonly jwtService:              JwtService,
    private readonly configService:           ConfigService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {
    this.accessSecret      = this.configService.getOrThrow<string>('jwt.accessSecret');
    this.accessExpiration  = this.configService.getOrThrow<string>('jwt.accessExpiration');
    this.refreshSecret     = this.configService.getOrThrow<string>('jwt.refreshSecret');
    this.refreshExpiration = this.configService.getOrThrow<string>('jwt.refreshExpiration');
  }

  // ─── Issue a fresh pair of tokens ────────────────────────────────────────────
  //
  // Persiste aussi le hash du refresh token en DB pour pouvoir le révoquer.
  // L'expiration en DB est lue depuis le JWT lui-même (pas recalculée à la main),
  // ce qui garantit qu'elle correspond EXACTEMENT à l'`exp` signé dans le token.
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

    const accessToken  = await this.signTokenWithExpiration(tokenPayload, this.accessSecret,  this.accessExpiration);
    const refreshToken = await this.signTokenWithExpiration(tokenPayload, this.refreshSecret, this.refreshExpiration);

    // Persiste le refresh token (hashé) — l'expiration vient directement du JWT
    // décodé, source de vérité unique pour la durée de validité.
    const refreshTokenExpiresAt = this.extractExpirationDateFromSignedToken(refreshToken);

    await this.refreshTokensRepository.storeOne({
      userId:    params.userId,
      tokenHash: this.computeSha256Hash(refreshToken),
      expiresAt: refreshTokenExpiresAt,
    });

    return { accessToken, refreshToken };
  }

  // ─── Verify + decode a refresh token ─────────────────────────────────────────
  // Vérifie la signature, puis vérifie que le token est toujours en DB (non révoqué).
  async verifyAndDecodeRefreshToken(refreshTokenFromClient: string): Promise<JwtTokenPayload> {
    // Étape 1 — Vérifier la signature avec le refresh secret
    const decodedPayload = await this.jwtService.verifyAsync<JwtTokenPayload>(
      refreshTokenFromClient,
      { secret: this.refreshSecret },
    );

    // Étape 2 — Vérifier que le token est toujours en DB (non révoqué)
    const tokenHash = this.computeSha256Hash(refreshTokenFromClient);
    const storedToken = await this.refreshTokensRepository.findValidOneByHash(tokenHash);
    if (!storedToken) {
      throw new Error('Refresh token has been revoked');
    }

    return decodedPayload;
  }

  // Révoque un seul refresh token (logout).
  async revokeRefreshToken(refreshTokenFromClient: string): Promise<void> {
    const tokenHash = this.computeSha256Hash(refreshTokenFromClient);
    await this.refreshTokensRepository.deleteOneByHash(tokenHash);
  }

  // Révoque TOUS les refresh tokens d'un user (changement de mot de passe,
  // suppression du compte, suspicion de compromission).
  async revokeAllRefreshTokensForUser(userId: Types.ObjectId): Promise<void> {
    await this.refreshTokensRepository.deleteAllByUserId(userId);
  }

  // ─── Internal helpers ────────────────────────────────────────────────────────

  // Signe un JWT avec une expiration depuis la config.
  //
  // Détail typage : @nestjs/jwt v11 type `expiresIn` comme `ms.StringValue`,
  // un template-literal pattern type que TS ne peut pas valider statiquement
  // depuis un `string` runtime. On cast donc vers `JwtSignOptions['expiresIn']`
  // (le type officiel exposé par @nestjs/jwt) plutôt que vers `as never` —
  // c'est l'expression de l'intention "on sait que cette valeur est une durée
  // valide, validée au boot par Joi (regex `15m` / `30d` / etc.)".
  private async signTokenWithExpiration(
    payload:    JwtTokenPayload,
    secret:     string,
    expiration: string,
  ): Promise<string> {
    const signOptions: JwtSignOptions = {
      secret,
      expiresIn: expiration as JwtSignOptions['expiresIn'],
    };
    return this.jwtService.signAsync(payload, signOptions);
  }

  // Extrait la date d'expiration EXACTE du JWT signé.
  // jsonwebtoken stocke `exp` en SECONDES Unix → on multiplie par 1000.
  // Si la lecture échoue (cas pathologique), on retombe sur une fenêtre prudente
  // de 30 jours pour ne pas bloquer le flow d'auth.
  private extractExpirationDateFromSignedToken(signedToken: string): Date {
    try {
      const decoded = this.jwtService.decode<JwtPayloadWithExpiration>(signedToken);
      if (decoded && typeof decoded.exp === 'number') {
        return new Date(decoded.exp * 1_000);
      }
    } catch (decodeError) {
      this.logger.warn('Impossible de décoder l\'expiration du refresh token', decodeError);
    }
    // Fallback prudent — 30 jours par défaut
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000);
  }

  // sha256 du JWT — on ne stocke jamais le token en clair.
  private computeSha256Hash(plainTextValue: string): string {
    return createHash('sha256').update(plainTextValue).digest('hex');
  }
}
