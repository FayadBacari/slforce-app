import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CloudinaryModule } from '@core/cloudinary/cloudinary.module';

// CloudinaryModule est importé pour que /health/ready puisse pinger
// Cloudinary. MongooseModule n'a pas besoin d'être importé : la Connection
// est exposée globalement par la connexion racine déjà configurée dans
// DatabaseModule (cf. @InjectConnection).
@Module({
  imports:     [CloudinaryModule],
  controllers: [HealthController],
})
export class HealthModule {}
