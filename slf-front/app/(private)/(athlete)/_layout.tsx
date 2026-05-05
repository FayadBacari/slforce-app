import { Redirect, Stack } from 'expo-router';
import { useAuthenticationStore } from '@stores/authentication-store';

// Stack for athlete-only screens (profile + search).
// The bottom navigation bar is rendered higher up by `(private)/_layout.tsx`,
// so this layout only declares the per-screen options.
export default function AthleteSectionLayout() {
  const loggedInUser = useAuthenticationStore((store) => store.loggedInUser);

  // Cross-redirect if a coach somehow lands here
  if (loggedInUser?.role === 'coach') {
    return <Redirect href="/(private)/(coach)/profile" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
