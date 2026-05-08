import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

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
        // Don't log health-check requests — too noisy
        autoLogging: {
          ignore: (request) => request.url === '/api/v1/health',
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
