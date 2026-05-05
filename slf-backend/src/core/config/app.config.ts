import { registerAs } from '@nestjs/config';

// Application-level config (port, environment, prefix).
// Accessed via `configService.get('app.port')`.
export const appConfig = registerAs('app', () => ({
  nodeEnvironment: process.env.NODE_ENV ?? 'development',
  host:            process.env.HOST ?? 'localhost',
  port:            parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix:       process.env.API_PREFIX ?? 'api/v1',
  corsOrigin:      process.env.CORS_ORIGIN ?? '*',
  isProduction:    process.env.NODE_ENV === 'production',
}));
