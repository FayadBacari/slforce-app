import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuthenticationStore } from '@stores/authentication-store';
import { useCoachProfileStore } from '@stores/coach-profile-store';

// Stack for coach-only screens (profile + search).
// The bottom navigation bar is rendered higher up by `(private)/_layout.tsx`.
export default function CoachSectionLayout() {
  const loggedInUser = useAuthenticationStore((store) => store.loggedInUser);

  const { isHydrated, fetchProfileFromServer } = useCoachProfileStore();

  // Load coach profile from the backend as soon as the coach section mounts
  // (i.e. right after login). MongoDB is the single source of truth.
  useEffect(() => {
    if (!isHydrated) {
      void fetchProfileFromServer();
    }
  }, [isHydrated, fetchProfileFromServer]);

  // Cross-redirect if an athlete somehow lands here
  if (loggedInUser?.role === 'athlete') {
    return <Redirect href="/(private)/(athlete)/profile" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
