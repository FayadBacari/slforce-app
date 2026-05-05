import { useEffect, useState, useCallback } from 'react';
import { searchRepository } from '../../data/repositories/search.repository';
import type { AthleteSearchResultEntity } from '../../domain/entities/athlete-search-result.entity';

interface UseAthleteSearchResult {
  athletes:  AthleteSearchResultEntity[];
  isLoading: boolean;
  hasError:  boolean;
  reload:    () => void;
}

// Fetches the 10 most recently registered athletes from the backend.
// Returns an empty array (not an error) when no athletes exist yet.
export function useAthleteSearch(): UseAthleteSearchResult {
  const [athletes,  setAthletes]  = useState<AthleteSearchResultEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError,  setHasError]  = useState(false);

  const fetchAthletes = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await searchRepository.getRecentAthletes();
      setAthletes(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAthletes();
  }, [fetchAthletes]);

  return { athletes, isLoading, hasError, reload: fetchAthletes };
}
