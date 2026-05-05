import { registerAs } from '@nestjs/config';

// Security-related settings.
export const securityConfig = registerAs('security', () => ({
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
}));
