// Platform-level stats returned by GET /users/stats.
// Shown in the search screen header (coach count, athlete count).
export interface PlatformStatsEntity {
  coachCount:   number;
  athleteCount: number;
}
