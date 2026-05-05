import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthenticationService } from '../services/authentication.service';
import { Public } from '../../../shared/decorators/public-route.decorator';
import { RegisterRequestDto } from './dto/register.dto';
import { LoginRequestDto } from './dto/login.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token.dto';
import { AuthenticationSuccessResponse } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// Auth endpoints. All public — no JWT required.
// The global JwtAuthGuard skips them thanks to the @Public() decorator.
@Controller('auth')
export class AuthController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  // POST /api/v1/auth/register
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  registerNewUser(
    @Body() registrationData: RegisterRequestDto,
  ): Promise<AuthenticationSuccessResponse> {
    return this.authenticationService.registerNewUser(registrationData);
  }

  // POST /api/v1/auth/login
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  authenticateUser(
    @Body() loginCredentials: LoginRequestDto,
  ): Promise<AuthenticationSuccessResponse> {
    return this.authenticationService.authenticateExistingUser(loginCredentials);
  }

  // POST /api/v1/auth/refresh
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
  // Public so callers can logout even with an expired access token.
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutUser(@Body() body: RefreshTokenRequestDto): Promise<void> {
    await this.authenticationService.logoutByRevokingRefreshToken(body.refreshToken);
  }

  // POST /api/v1/auth/forgot-password
  // Sends a reset email. Always returns 200 — never reveals if the email exists.
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authenticationService.forgotPassword(body.email);
    return { message: 'Si un compte existe avec cette adresse, un lien a été envoyé.' };
  }

  // POST /api/v1/auth/reset-password
  // Validates the token and updates the password.
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto): Promise<{ message: string }> {
    await this.authenticationService.resetPassword(body.token, body.newPassword);
    return { message: 'Mot de passe mis à jour. Tu peux maintenant te connecter.' };
  }
}
