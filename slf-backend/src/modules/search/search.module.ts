import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SearchController } from './presentation/search.controller';
import { SearchService } from './services/search.service';

// SearchService consomme UsersRepository (exporté par UsersModule)
// pour requêter les coachs et athlètes les plus récemment inscrits.
@Module({
  imports:     [UsersModule],
  controllers: [SearchController],
  providers:   [SearchService],
})
export class SearchModule {}
