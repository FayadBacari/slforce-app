import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect, Slot, usePathname } from 'expo-router';
import { useAuthenticationStore } from '@stores/authentication-store';
import { useTheme } from '@shared/theme/theme-provider';
import { MainBottomNav } from '@shared/components/main-bottom-nav/main-bottom-nav';

// Auth guard for all private screens.
// Renders the active screen via <Slot /> and a persistent bottom nav, exactly
// the way the legacy MainLayout did. The bottom nav stays visible across
// profile / search / chat / settings — but is hidden inside chat conversations
// (where the chat header takes its place).
export default function PrivateScreensLayout() {
  const loggedInUser     = useAuthenticationStore((store) => store.loggedInUser);
  const { theme }        = useTheme();
  const currentPathname  = usePathname();

  if (!loggedInUser) {
    return <Redirect href="/(public)/login" />;
  }

  // The conversation screen and individual settings sub-pages should hide the
  // tab bar to maximise screen real estate (as the legacy app did).
  const shouldHideBottomNav =
    currentPathname.includes('/chat/') && !currentPathname.endsWith('/chat')
    || /\/settings\/[^/]+$/.test(currentPathname);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.pageBackground }]}>
      <View style={styles.screenSlot}>
        <Slot />
      </View>
      {!shouldHideBottomNav && <MainBottomNav />}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  screenSlot: { flex: 1 },
});
