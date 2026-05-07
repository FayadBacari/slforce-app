import { useState, useEffect, useCallback } from 'react';
import { userProfileRepository } from '../../data/repositories/user-profile.repository';
import type { PrivacySettingsEntity } from '../../domain/entities/privacy-settings.entity';

// ─── usePrivacySettings ───────────────────────────────────────────────────────
//
// Loads the user's privacy flags from the backend on mount, then provides
// `update()` to save individual changes immediately (optimistic update pattern:
// the UI reflects the change instantly; a backend error rolls it back to the
// pre-update state).
export function usePrivacySettings() {
  const [settings, setSettings]   = useState<PrivacySettingsEntity>({
    isProfilePublic:  true,
    showOnlineStatus: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving,  setIsSaving]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ── Load on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await userProfileRepository.getPrivacySettings();
        if (!cancelled) setSettings(data);
      } catch {
        // Non-blocking — keep defaults if the request fails.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  // ── Update one flag ──────────────────────────────────────────────────────
  const update = useCallback(async (patch: Partial<PrivacySettingsEntity>) => {
    // Capture the current state for rollback BEFORE the optimistic update.
    let previousSettings: PrivacySettingsEntity = { isProfilePublic: true, showOnlineStatus: true };

    setSettings((prev) => {
      previousSettings = prev;
      return { ...prev, ...patch };
    });

    setIsSaving(true);
    setError(null);

    try {
      const confirmed = await userProfileRepository.updatePrivacySettings(patch);
      // Replace the optimistic value with what the server confirmed.
      setSettings(confirmed);
    } catch {
      // Roll back to the state before the optimistic update.
      setSettings(previousSettings);
      setError('Impossible de sauvegarder les préférences. Réessayez.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    isProfilePublic:  settings.isProfilePublic,
    showOnlineStatus: settings.showOnlineStatus,
    isLoading,
    isSaving,
    error,
    update,
  };
}
