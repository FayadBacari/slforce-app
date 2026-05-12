import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

// ─── Correlation ID propagation ──────────────────────────────────────────────
//
// Chaque requête HTTP entrante reçoit un identifiant unique stocké dans
// `req.id` et propagé :
//   • dans tous les logs Pino du cycle de la requête (auto-injection par
//     pino-http dès qu'on définit `genReqId`)
//   • dans le header de réponse `X-Request-Id`, pour que le mobile/web puisse
//     le mettre dans ses crash reports → trace bout-en-bout user ↔ serveur
//
// On honore aussi `X-Request-Id` envoyé par le client (utile pour les retries :
// le mobile peut rejouer le même ID, ce qui simplifie le debug).
//
// Nom du header standardisé en lowercase (Node normalise les headers entrants).
const REQUEST_ID_HEADER = 'x-request-id';

function generateOrPropagateRequestId(
  request:  IncomingMessage,
  response: ServerResponse,
): string {
  const incomingId = request.headers[REQUEST_ID_HEADER];
  const requestId  = typeof incomingId === 'string' && incomingId.length > 0
    ? incomingId
    : randomUUID();
  response.setHeader('X-Request-Id', requestId);
  return requestId;
}

// Config
import { appConfig } from './core/config/app.config';
import { databaseConfig } from './core/config/database.config';
import { jwtConfig } from './core/config/jwt.config';
import { securityConfig } from './core/config/security.config';
import { emailConfig } from './core/config/email.config';
import { cloudinaryConfig } from './core/config/cloudinary.config';
import { environmentValidationSchema } from './core/config/environment.validation';

// Core
import { DatabaseModule } from './core/database/database.module';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './core/interceptors/response-envelope.interceptor';

// Shared
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { ChatModule } from './modules/chat/chat.module';
import { SearchModule } from './modules/search/search.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    // ─── Global config (loaded once, available everywhere) ──────────────────
    ConfigModule.forRoot({
      isGlobal:           true,
      envFilePath:        '.env',
      load:               [appConfig, databaseConfig, jwtConfig, securityConfig, emailConfig, cloudinaryConfig],
      validationSchema:   environmentValidationSchema,
      validationOptions:  { abortEarly: true },
    }),

    // ─── Pino logger (fast, structured JSON in prod / pretty in dev) ────────
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV === 'production'
          ? undefined
          : { target: 'pino-pretty', options: { colorize: true, singleLine: true } },
        level:  process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        // Génère/propage un correlation ID par requête. Tous les logs émis
        // pendant la requête seront automatiquement enrichis avec `req.id`,
        // ce qui permet de tracer une requête bout-en-bout dans Datadog / Loki.
        genReqId: generateOrPropagateRequestId,
        customProps: () => ({ service: 'slf-backend' }),
        // Don't log health-check requests — too noisy
        autoLogging: {
          ignore: (request) =>
            request.url === '/api/v1/health' ||
            request.url === '/api/v1/health/ready' ||
            request.url === '/api/v1/health/live',
        },
      },
    }),

    // ─── Rate limiting (global default — overridable per route) ─────────────
    // 60 requests per minute per IP across the whole API.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),

    // ─── Database ───────────────────────────────────────────────────────────
    DatabaseModule,

    // ─── Feature modules ────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    HealthModule,
    ChatModule,
    SearchModule,
    PaymentsModule,
  ],
  providers: [
    // Global JWT guard — every route requires auth UNLESS @Public() is used
    { provide: APP_GUARD,        useClass: JwtAuthGuard            },
    // Global roles guard — runs after JwtAuthGuard, only checks if @RequireRoles() is set
    { provide: APP_GUARD,        useClass: RolesGuard              },
    // Global rate limiter
    { provide: APP_GUARD,        useClass: ThrottlerGuard          },
    // Global response wrapper { success: true, data: ... }
    { provide: APP_INTERCEPTOR,  useClass: ResponseEnvelopeInterceptor },
    // Global error formatter { success: false, message, ... }
    { provide: APP_FILTER,       useClass: AllExceptionsFilter     },
  ],
})
export class AppModule {}
