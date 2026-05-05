import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@core/api/api-client';
import { API_ENDPOINTS } from '@core/api/api-endpoints';
import { unwrapBackendEnvelope, type BackendSuccessEnvelope } from '@core/api/api-response-envelope';

// ─── Shapes ───────────────────────────────────────────────────────────────────
interface PrivacySettings {
  isProfilePublic:  boolean;
  showOnlineStatus: boolean;
}

// ─── usePrivacySettings ───────────────────────────────────────────────────────
//
// Loads the user's privacy flags from the backend on mount, then provides
// `update()` to save individual changes immediately (optimistic update pattern:
// the UI reflects the change instantly; a backend error rolls it back to the
// pre-update state).
export function usePrivacySettings() {
  const [settings, setSettings]     = useState<PrivacySettings>({
    isProfilePublic:  true,
    showOnlineStatus: true,
  });
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving,  setIsSaving]    = useState(false);
  const [error,     setError]       = useState<string | null>(null);

  // ── Load on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await apiClient.get<BackendSuccessEnvelope<PrivacySettings>>(
          API_ENDPOINTS.userProfile.getPrivacySettings,
        );
        if (!cancelled) {
          setSettings(unwrapBackendEnvelope(response));
        }
      } catch {
        // Non-blocking — keep defaults if the request fails
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  // ── Update one flag ──────────────────────────────────────────────────────
  const update = useCallback(async (patch: Partial<PrivacySettings>) => {
    // Capture the current state for rollback BEFORE applying the optimistic update.
    // We use the functional setState form so `previousSettings` is populated
    // synchronously from the latest committed state — safe even with concurrent mode.
    let previousSettings: PrivacySettings = { isProfilePublic: true, showOnlineStatus: true };

    setSettings((prev) => {
      previousSettings = prev;       // snapshot the real value before the optimistic write
      return { ...prev, ...patch };  // optimistic: reflect the change immediately
    });

    setIsSaving(true);
    setError(null);

    try {
      const response = await apiClient.patch<BackendSuccessEnvelope<PrivacySettings>>(
        API_ENDPOINTS.userProfile.updatePrivacySettings,
        patch,
      );
      // Replace the optimistic value with what the server confirmed
      setSettings(unwrapBackendEnvelope(response));
    } catch {
      // Roll back to the state before the optimistic update
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
