import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

// ConfigModule est global (cf. AppModule), pas besoin de l'importer explicitement.
// CloudinaryService est exporté pour que UsersModule (et tout futur consumer
// comme l'upload d'attachments chat) puisse l'injecter.
@Module({
  providers: [CloudinaryService],
  exports:   [CloudinaryService],
})
export class CloudinaryModule {}
