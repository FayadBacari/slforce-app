import * as Joi from 'joi';

// ─── ENVIRONMENT VARIABLES VALIDATION ────────────────────────────────────────
// Validates the .env file at startup. The app refuses to boot if anything is
// missing or malformed — this prevents silent runtime crashes in production.
//
// NestJS's ConfigModule sets `allowUnknown: true` by default, so additional
// variables (Stripe, Stream, Cloudinary, etc.) declared in .env without being
// listed here are accepted silently. They will be validated as Phase 2 modules
// (chat, payments, upload) are introduced.
export const environmentValidationSchema = Joi.object({
  // ─── Application ──────────────────────────────────────────────────────────
  NODE_ENV:    Joi.string().valid('development', 'production', 'test').default('development'),
  PORT:        Joi.number().integer().positive().default(5132),
  API_PREFIX:  Joi.string().default('api/v1'),
  // Full URL of this backend — used for Stripe redirect URLs.
  // In production set this to your real domain, e.g. https://api.slforce.app
  APP_URL:     Joi.string().uri().default('http://localhost:5132'),

  // ─── Database ─────────────────────────────────────────────────────────────
  MONGODB_URI: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),

  // ─── JWT ──────────────────────────────────────────────────────────────────
  JWT_ACCESS_SECRET:      Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRATION:  Joi.string().default('7d'),
  JWT_REFRESH_SECRET:     Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('30d'),

  // ─── CORS ─────────────────────────────────────────────────────────────────
  CORS_ORIGIN: Joi.string().default('*'),

  // ─── Security ─────────────────────────────────────────────────────────────
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),

  // ─── Stream Chat ──────────────────────────────────────────────────────────
  STREAM_API_KEY:    Joi.string().required(),
  STREAM_API_SECRET: Joi.string().required(),

  // ─── Stripe ───────────────────────────────────────────────────────────────
  // sk_test_... in dev, sk_live_... in prod
  STRIPE_SECRET_KEY:        Joi.string().pattern(/^sk_/).required(),
  STRIPE_WEBHOOK_SECRET:    Joi.string().pattern(/^whsec_/).optional(),

  // ─── Phase 2 — Validated when modules are added ───────────────────────────
  // CLOUDINARY_CLOUD_NAME:    Joi.string().required(),
  // CLOUDINARY_API_KEY:       Joi.string().required(),
  // CLOUDINARY_API_SECRET:    Joi.string().required(),
});
