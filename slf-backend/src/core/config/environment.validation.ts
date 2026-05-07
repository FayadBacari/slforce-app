import * as Joi from 'joi';

// ─── ENVIRONMENT VARIABLES VALIDATION ────────────────────────────────────────
// Validates the .env file at startup. The app refuses to boot if anything is
// missing or malformed — this prevents silent runtime crashes in production.
//
// NestJS's ConfigModule sets `allowUnknown: true` by default so extra variables
// not listed here are silently accepted (useful for local tooling / CI secrets).
export const environmentValidationSchema = Joi.object({
  // ─── Application ──────────────────────────────────────────────────────────
  NODE_ENV:    Joi.string().valid('development', 'production', 'test').default('development'),
  PORT:        Joi.number().integer().positive().default(5132),
  API_PREFIX:  Joi.string().default('api/v1'),
  // Full public URL of this backend — used for photo URLs and Stripe redirect URLs.
  // In production set this to your real HTTPS domain, e.g. https://api.slforce.app
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
  // sk_test_... in dev / sk_live_... in prod
  STRIPE_SECRET_KEY:      Joi.string().pattern(/^sk_/).required(),
  // pk_test_... in dev / pk_live_... in prod — echoed back to the mobile SDK
  STRIPE_PUBLISHABLE_KEY: Joi.string().pattern(/^pk_/).required(),
  // Required in production to verify webhook signatures and reject forged events.
  // Can be omitted locally when not testing webhooks (dev only).
  STRIPE_WEBHOOK_SECRET:  Joi.string().pattern(/^whsec_/).when('NODE_ENV', {
    is:        'production',
    then:      Joi.required(),
    otherwise: Joi.optional(),
  }),

  // ─── Email (Resend) ───────────────────────────────────────────────────────
  RESEND_API_KEY:      Joi.string().required(),
  MAIL_FROM:           Joi.string().email().default('no-reply@slforce.app'),
  RESET_PASSWORD_URL:  Joi.string().default('slforce://reset-password'),
});
