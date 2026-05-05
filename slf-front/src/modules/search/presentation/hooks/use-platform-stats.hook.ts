import { useEffect, useState } from 'react';
import { searchRepository } from '../../data/repositories/search.repository';
import type { PlatformStatsEntity } from '../../domain/entities/platform-stats.entity';

interface UsePlatformStatsResult {
  stats:     PlatformStatsEntity | null;
  isLoading: boolean;
}

// Fetches platform stats (coach count, athlete count) from the backend once on mount.
// Falls back to null while loading — callers should show a placeholder (e.g. '—').
export function usePlatformStats(): UsePlatformStatsResult {
  const [stats, setStats]       = useState<PlatformStatsEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await searchRepository.getPlatformStats();
        if (!cancelled) setStats(data);
      } catch {
        // Network error or backend not yet ready — keep null, UI shows '—'
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { stats, isLoading };
}
