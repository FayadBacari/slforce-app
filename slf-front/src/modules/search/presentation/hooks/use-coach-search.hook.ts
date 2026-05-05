import { useEffect, useState, useCallback } from 'react';
import { searchRepository } from '../../data/repositories/search.repository';
import type { CoachSearchResultEntity } from '../../domain/entities/coach-search-result.entity';

interface UseCoachSearchResult {
  coaches:    CoachSearchResultEntity[];
  isLoading:  boolean;
  hasError:   boolean;
  reload:     () => void;
}

// Fetches the 10 most recently registered coaches from the backend.
// Returns an empty array (not an error) when no coaches exist yet.
export function useCoachSearch(): UseCoachSearchResult {
  const [coaches,   setCoaches]   = useState<CoachSearchResultEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError,  setHasError]  = useState(false);

  const fetchCoaches = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await searchRepository.getRecentCoaches();
      setCoaches(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCoaches();
  }, [fetchCoaches]);

  return { coaches, isLoading, hasError, reload: fetchCoaches };
}
