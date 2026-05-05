import type { PlatformStatsEntity } from '../../domain/entities/platform-stats.entity';
import type { CoachSearchResultEntity } from '../../domain/entities/coach-search-result.entity';
import type { AthleteSearchResultEntity } from '../../domain/entities/athlete-search-result.entity';
import {
  callGetPlatformStatsApiEndpoint,
  callSearchCoachesApiEndpoint,
  callSearchAthletesApiEndpoint,
} from '../data-sources/search-api.data-source';

class SearchRepository {
  async getPlatformStats(): Promise<PlatformStatsEntity> {
    return callGetPlatformStatsApiEndpoint();
  }

  async getRecentCoaches(): Promise<CoachSearchResultEntity[]> {
    return callSearchCoachesApiEndpoint();
  }

  async getRecentAthletes(): Promise<AthleteSearchResultEntity[]> {
    return callSearchAthletesApiEndpoint();
  }
}

// Single shared instance
export const searchRepository = new SearchRepository();
