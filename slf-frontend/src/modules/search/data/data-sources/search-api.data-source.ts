import { apiClient } from '@core/api/api-client';
import { API_ENDPOINTS } from '@core/api/api-endpoints';
import { unwrapBackendEnvelope, type BackendSuccessEnvelope } from '@core/api/api-response-envelope';
import type { PlatformStatsEntity } from '../../domain/entities/platform-stats.entity';
import type { CoachSearchResultEntity } from '../../domain/entities/coach-search-result.entity';
import type { AthleteSearchResultEntity } from '../../domain/entities/athlete-search-result.entity';

// ─── GET /users/stats ─────────────────────────────────────────────────────────

export async function callGetPlatformStatsApiEndpoint(): Promise<PlatformStatsEntity> {
  const response = await apiClient.get<BackendSuccessEnvelope<PlatformStatsEntity>>(
    API_ENDPOINTS.platform.stats,
  );
  return unwrapBackendEnvelope(response);
}

// ─── GET /search/coaches ──────────────────────────────────────────────────────
// Returns the 10 most recently registered active coaches from MongoDB.
// Returns an empty array if no coaches exist yet.

export async function callSearchCoachesApiEndpoint(): Promise<CoachSearchResultEntity[]> {
  const response = await apiClient.get<BackendSuccessEnvelope<CoachSearchResultEntity[]>>(
    API_ENDPOINTS.search.searchForCoaches,
  );
  return unwrapBackendEnvelope(response);
}

// ─── GET /search/athletes ─────────────────────────────────────────────────────
// Returns the 10 most recently registered active athletes from MongoDB.
// Returns an empty array if no athletes exist yet.

export async function callSearchAthletesApiEndpoint(): Promise<AthleteSearchResultEntity[]> {
  const response = await apiClient.get<BackendSuccessEnvelope<AthleteSearchResultEntity[]>>(
    API_ENDPOINTS.search.searchForAthletes,
  );
  return unwrapBackendEnvelope(response);
}
