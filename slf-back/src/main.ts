import { NestFactory } from '@nestjs/core';
import { Logger as NestLogger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Connection } from 'mongoose';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // bufferLogs lets nestjs-pino capture every startup log (otherwise console.log is used).
  const application = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  // Replace Nest's default logger with Pino (structured + fast)
  application.useLogger(application.get(Logger));

  const configService = application.get(ConfigService);
  const port           = configService.getOrThrow<number>('app.port');
  const apiPrefix      = configService.getOrThrow<string>('app.apiPrefix');
  const corsOrigin     = configService.getOrThrow<string>('app.corsOrigin');

  // ─── Global API prefix ─────────────────────────────────────────────────────
  // All routes are prefixed with /api/v1 (configurable via env).
  application.setGlobalPrefix(apiPrefix);

  // ─── Security headers (HSTS, X-Frame-Options, etc.) ────────────────────────
  application.use(helmet());

  // ─── Gzip compression for responses ────────────────────────────────────────
  application.use(compression());

  // ─── CORS (frontend running on different origin during development) ────────
  application.enableCors({
    origin:      corsOrigin === '*' ? true : corsOrigin.split(',').map((value) => value.trim()),
    credentials: corsOrigin !== '*',
  });

  // ─── Static file serving for uploaded profile photos ──────────────────────
  // Files saved by POST /users/profile/photo are stored in uploads/ and served
  // at http://HOST:PORT/uploads/<filename> — accessible from any device on the LAN.
  application.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // ─── Global request validation ─────────────────────────────────────────────
  application.useGlobalPipes(
    new ValidationPipe({
      whitelist:           true,    // strip unknown fields from incoming requests
      forbidNonWhitelisted: false,  // allow extra fields, just ignore them
      transform:           true,    // auto-convert payloads to DTO classes
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Graceful shutdown — close DB connections / stop accepting new requests on SIGTERM
  application.enableShutdownHooks();

  await application.listen(port);

  // ─── Final startup banner — printed AFTER everything is ready ──────────────
  const bootstrapLogger = new NestLogger('Bootstrap');
  bootstrapLogger.log(`🚀 SLForce backend ready → http://localhost:${port}/${apiPrefix}`);

  // Re-print the MongoDB connection state at the very end, so it appears as the
  // last line of the boot logs (easier to spot than buried in module init logs).
  const mongoLogger = new NestLogger('MongoDB');
  const mongooseConnection = application.get<Connection>(getConnectionToken());
  if (mongooseConnection.readyState === 1) {
    const databaseName = mongooseConnection.name || '(default)';
    const hostInfo     = mongooseConnection.host || 'unknown-host';
    mongoLogger.log(`✅ Connected to MongoDB → "${databaseName}" @ ${hostInfo}`);
  } else {
    mongoLogger.warn(`⚠️  MongoDB readyState = ${mongooseConnection.readyState} (not connected)`);
  }
}

bootstrap().catch((bootstrapError: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start SLForce backend:', bootstrapError);
  process.exit(1);
});
