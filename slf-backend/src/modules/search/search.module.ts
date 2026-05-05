import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SearchController } from './presentation/search.controller';
import { SearchService } from './services/search.service';

// AuthModule exports UsersRepository which SearchService needs to query coaches.
@Module({
  imports:     [AuthModule],
  controllers: [SearchController],
  providers:   [SearchService],
})
export class SearchModule {}
