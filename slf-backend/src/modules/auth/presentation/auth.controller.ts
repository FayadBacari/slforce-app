import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticationService } from '../services/authentication.service';
import { Public } from '@shared/decorators/public-route.decorator';
import { RegisterRequestDto } from './dto/register.dto';
import { LoginRequestDto } from './dto/login.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token.dto';
import { AuthenticationSuccessResponse } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// ─── Rate-limit dédié aux routes sensibles à la force brute ────────────────────
//
// Le ThrottlerModule global laisse 60 req/min pour le reste de l'API.
// Sur l'auth, on durcit volontairement à 5 tentatives par minute par IP :
//   • bloque les bots qui essaient des combinaisons login/password
//   • limite l'abus du forgot-password (envoi en chaîne d'emails)
//   • le rate-limit s'applique par IP — chaque @Throttle ci-dessous se cumule
//     correctement avec le throttler global grâce au `default` namespace.
const STRICT_AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } } as const;

// Auth endpoints. Tous publics — pas de JWT requis.
// Le JwtAuthGuard global les ignore grâce au décorateur @Public().
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  // POST /api/v1/auth/register
  @Public()
  @Throttle(STRICT_AUTH_THROTTLE)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  registerNewUser(
    @Body() registrationData: RegisterRequestDto,
  ): Promise<AuthenticationSuccessResponse> {
    return this.authenticationService.registerNewUser(registrationData);
  }

  // POST /api/v1/auth/login
  @Public()
  @Throttle(STRICT_AUTH_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  authenticateUser(
    @Body() loginCredentials: LoginRequestDto,
  ): Promise<AuthenticationSuccessResponse> {
    return this.authenticationService.authenticateExistingUser(loginCredentials);
  }

  // POST /api/v1/auth/refresh
  // Pas de throttle strict ici — un user mobile peut légitimement enchaîner
  // plusieurs refresh quand l'access token vient d'expirer. Le throttler
  // global (60/min) reste actif et suffit à bloquer les abus.
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshAccessToken(
    @Body() refreshTokenRequest: RefreshTokenRequestDto,
  ): Promise<AuthenticationSuccessResponse> {
    return this.authenticationService.issueNewTokensFromRefreshToken(
      refreshTokenRequest.refreshToken,
    );
  }

  // POST /api/v1/auth/logout
  // Public pour permettre le logout même avec un access token expiré, MAIS
  // throttle agressif identique aux autres routes auth : empêche un attaquant
  // qui aurait scrappé un lot de refresh tokens (logs, cache compromis...)
  // de spammer `/logout` pour DoS toutes les sessions actives.
  //
  // La vérification de signature côté service garantit que seul un refresh
  // token réellement signé par notre backend peut révoquer son hash en DB.
  @Public()
  @Throttle(STRICT_AUTH_THROTTLE)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutUser(@Body() body: RefreshTokenRequestDto): Promise<void> {
    await this.authenticationService.logoutByRevokingRefreshToken(body.refreshToken);
  }

  // POST /api/v1/auth/forgot-password
  // Renvoie toujours 200 — ne révèle jamais si l'email existe.
  @Public()
  @Throttle(STRICT_AUTH_THROTTLE)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authenticationService.forgotPassword(body.email);
    return { message: 'Si un compte existe avec cette adresse, un lien a été envoyé.' };
  }

  // POST /api/v1/auth/reset-password
  // Valide le token et met à jour le mot de passe.
  @Public()
  @Throttle(STRICT_AUTH_THROTTLE)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto): Promise<{ message: string }> {
    await this.authenticationService.resetPassword(body.token, body.newPassword);
    return { message: 'Mot de passe mis à jour. Tu peux maintenant te connecter.' };
  }
}
