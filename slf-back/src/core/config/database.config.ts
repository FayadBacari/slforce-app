import { registerAs } from '@nestjs/config';

// MongoDB connection settings.
// Accessed via `configService.get('database.mongoUri')`.
export const databaseConfig = registerAs('database', () => ({
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/slforce',
}));
