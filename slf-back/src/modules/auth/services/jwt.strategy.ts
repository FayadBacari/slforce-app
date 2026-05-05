import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  AuthenticatedUserPayload,
} from '../../../shared/types/authenticated-request.interface';
import { JwtTokenPayload } from './auth-tokens.service';
import { UsersRepository } from '../data/repositories/users.repository';

// Extracts the Bearer token from the Authorization header,
// verifies its signature with the access secret, and attaches a clean
// "user" object to req.user for downstream controllers.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest:   ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:      configService.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  // Called by Passport once the signature is verified.
  // We re-check that the user still exists and is active — a token may be
  // technically valid but the account may have been deactivated.
  async validate(jwtPayload: JwtTokenPayload): Promise<AuthenticatedUserPayload> {
    const userInDatabase = await this.usersRepository.findOneById(jwtPayload.sub);
    if (!userInDatabase || !userInDatabase.isActive) {
      throw new UnauthorizedException('Compte introuvable ou désactivé.');
    }

    return {
      userId: jwtPayload.sub,
      email:  jwtPayload.email,
      role:   jwtPayload.role,
    };
  }
}
