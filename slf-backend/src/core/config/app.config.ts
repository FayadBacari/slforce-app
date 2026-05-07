import { registerAs } from '@nestjs/config';

// Application-level config (port, environment, prefix).
// Accessed via `configService.get('app.port')`.
export const appConfig = registerAs('app', () => ({
  nodeEnvironment: process.env.NODE_ENV ?? 'development',
  host:            process.env.HOST ?? 'localhost',
  port:            parseInt(process.env.PORT ?? '3000', 10),
  // Full public URL of this server — used for photo URLs and Stripe redirect URLs.
  // Must be set to the real HTTPS domain in production (e.g. https://api.slforce.app).
  appUrl:          process.env.APP_URL ?? 'http://localhost:5132',
  apiPrefix:       process.env.API_PREFIX ?? 'api/v1',
  corsOrigin:      process.env.CORS_ORIGIN ?? '*',
  isProduction:    process.env.NODE_ENV === 'production',
}));
