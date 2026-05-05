import { registerAs } from '@nestjs/config';

// JWT secrets and expiration policies.
// We use TWO separate secrets — one for short-lived access tokens (7d),
// another for long-lived refresh tokens (30d). This way, if the access
// secret leaks, refresh tokens remain valid until refresh secret is rotated.
export const jwtConfig = registerAs('jwt', () => ({
  accessSecret:      process.env.JWT_ACCESS_SECRET!,
  accessExpiration:  process.env.JWT_ACCESS_EXPIRATION ?? '7d',
  refreshSecret:     process.env.JWT_REFRESH_SECRET!,
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '30d',
}));
