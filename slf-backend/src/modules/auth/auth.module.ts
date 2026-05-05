import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { User, UserSchema } from './data/schemas/user.schema';
import { RefreshToken, RefreshTokenSchema } from './data/schemas/refresh-token.schema';
import { PasswordResetToken, PasswordResetTokenSchema } from './data/schemas/password-reset-token.schema';

// Repositories
import { UsersRepository } from './data/repositories/users.repository';
import { RefreshTokensRepository } from './data/repositories/refresh-tokens.repository';
import { PasswordResetRepository } from './data/repositories/password-reset.repository';

// Services
import { PasswordHashService } from './services/password-hash.service';
import { AuthTokensService } from './services/auth-tokens.service';
import { AuthenticationService } from './services/authentication.service';
import { JwtStrategy } from './services/jwt.strategy';

// Email
import { EmailModule } from '../../core/email/email.module';

// Presentation
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),    // configured per-call inside AuthTokensService
    MongooseModule.forFeature([
      { name: User.name,               schema: UserSchema               },
      { name: RefreshToken.name,       schema: RefreshTokenSchema       },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
    ]),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    UsersRepository,
    RefreshTokensRepository,
    PasswordResetRepository,
    PasswordHashService,
    AuthTokensService,
    AuthenticationService,
    JwtStrategy,
  ],
  // Exports — other modules (Users, etc.) need access to these
  exports: [UsersRepository, AuthTokensService],
})
export class AuthModule {}
