import { registerAs } from '@nestjs/config';

// Configuration Cloudinary — exposée sous le namespace `cloudinary.*`.
// Accédée via `configService.getOrThrow<string>('cloudinary.cloudName')`.
//
// Cloudinary stocke les photos de profil et les attachments du chat.
// Les credentials sont validés au boot par environment.validation.ts.
export const cloudinaryConfig = registerAs('cloudinary', () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  apiKey:    process.env.CLOUDINARY_API_KEY    ?? '',
  apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
}));
