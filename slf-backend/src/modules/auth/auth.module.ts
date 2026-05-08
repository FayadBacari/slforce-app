import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas — auth-specific (refresh tokens & reset tokens).
// User.schema lives in UsersModule, owner of the user domain.
import { RefreshToken, RefreshTokenSchema } from './data/schemas/refresh-token.schema';
import { PasswordResetToken, PasswordResetTokenSchema } from './data/schemas/password-reset-token.schema';

// Repositories — only auth-token-related, NOT UsersRepository (now in UsersModule).
import { RefreshTokensRepository } from './data/repositories/refresh-tokens.repository';
import { PasswordResetRepository } from './data/repositories/password-reset.repository';

// Services
import { PasswordHashService } from './services/password-hash.service';
import { AuthTokensService } from './services/auth-tokens.service';
import { AuthenticationService } from './services/authentication.service';
import { JwtStrategy } from './services/jwt.strategy';

// Cross-module imports
import { EmailModule } from '@core/email/email.module';
import { UsersModule } from '../users/users.module';

// Presentation
import { AuthController } from './presentation/auth.controller';

// ─── AuthModule ────────────────────────────────────────────────────────────────
//
// Concerns : flow d'authentification (login/register/logout/refresh/forgot/reset),
// gestion des sessions (refresh tokens, reset tokens), JWT signing/verification.
//
// Dépend de UsersModule (forwardRef) pour accéder à UsersRepository — l'authent
// a besoin de lire/créer des users mais le domaine User appartient à UsersModule.
// La dépendance inverse UsersModule → AuthModule (pour AuthTokensService lors
// de la suppression de compte) crée une circularité résolue par forwardRef.
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),    // configuré au cas par cas dans AuthTokensService
    MongooseModule.forFeature([
      { name: RefreshToken.name,       schema: RefreshTokenSchema       },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
    ]),
    EmailModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [
    RefreshTokensRepository,
    PasswordResetRepository,
    PasswordHashService,
    AuthTokensService,
    AuthenticationService,
    JwtStrategy,
  ],
  // AuthTokensService est consommé par UsersModule (deleteAccount) pour révoquer
  // toutes les sessions d'un compte avant son anonymisation.
  exports: [AuthTokensService],
})
export class AuthModule {}
