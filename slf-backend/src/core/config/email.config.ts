import { registerAs } from '@nestjs/config';

// Email / transactional-mail configuration.
// All three values are read at boot time via ConfigService.
export const emailConfig = registerAs('email', () => ({
  resendApiKey:     process.env.RESEND_API_KEY   ?? '',
  mailFrom:         process.env.MAIL_FROM         ?? 'no-reply@slforce.app',
  // Deep link URL base — the token is appended as ?token=xxx.
  // Production:  slforce://reset-password
  // Dev (Expo):  exp://192.168.x.x:8081/--/(public)/reset-password
  resetPasswordUrl: process.env.RESET_PASSWORD_URL ?? 'slforce://reset-password',
}));
