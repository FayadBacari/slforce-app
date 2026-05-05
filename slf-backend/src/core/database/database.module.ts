import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

// Connects to MongoDB once at app startup.
// Other modules then use `MongooseModule.forFeature([...])` to register their schemas.
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('database.mongoUri'),
        // Performance & resilience tuning:
        // - autoIndex disabled in production (indexes managed via migrations)
        // - serverSelectionTimeoutMS 5s so the app fails fast if Mongo is unreachable
        autoIndex:                 configService.get<string>('app.nodeEnvironment') !== 'production',
        serverSelectionTimeoutMS:  5_000,
        // Connection pool sized for typical small-to-medium traffic
        maxPoolSize:               20,
        minPoolSize:               2,

        // ─── Connection lifecycle logging ────────────────────────────────────
        // The initial "✅ connected" message is printed by main.ts AFTER the
        // server is fully ready, so it appears at the very end of the boot logs.
        // Here we only register listeners for RUNTIME events (disconnect / reconnect
        // / errors that happen after startup).
        connectionFactory: (mongooseConnection: Connection) => {
          const databaseLogger = new Logger('MongoDB');

          mongooseConnection.on('error',        (err: Error) => databaseLogger.error(`❌ MongoDB error: ${err.message}`));
          mongooseConnection.on('disconnected', () => databaseLogger.warn('⚠️  MongoDB disconnected'));
          mongooseConnection.on('reconnected',  () => databaseLogger.log('🔄 MongoDB reconnected'));

          return mongooseConnection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
