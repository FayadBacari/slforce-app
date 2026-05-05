import { Redirect } from 'expo-router';
import { useAuthenticationStore } from '@stores/authentication-store';

// The app entry point.
// Redirects the user to the right place based on whether they are logged in.
export default function AppEntryPoint() {
  const loggedInUser = useAuthenticationStore((store) => store.loggedInUser);

  if (!loggedInUser) {
    // Not logged in → go to the welcome/login screen
    return <Redirect href="/(public)/login" />;
  }

  // Logged in → go to the user's profile (the home tab, like the legacy app)
  if (loggedInUser.role === 'coach') {
    return <Redirect href="/(private)/(coach)/profile" />;
  }

  return <Redirect href="/(private)/(athlete)/profile" />;
}
