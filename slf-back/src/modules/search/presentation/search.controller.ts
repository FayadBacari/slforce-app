import { Controller, Get } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { CoachSearchResultDto } from './dto/coach-search-result.dto';
import { AthleteSearchResultDto } from './dto/athlete-search-result.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // GET /api/v1/search/coaches
  // Returns the 10 most recently registered active coaches.
  // Requires a valid JWT — only authenticated athletes/coaches can browse.
  @Get('coaches')
  getRecentCoaches(): Promise<CoachSearchResultDto[]> {
    return this.searchService.getRecentCoaches();
  }

  // GET /api/v1/search/athletes
  // Returns the 10 most recently registered active athletes.
  // Requires a valid JWT — only authenticated coaches can browse.
  @Get('athletes')
  getRecentAthletes(): Promise<AthleteSearchResultDto[]> {
    return this.searchService.getRecentAthletes();
  }
}
