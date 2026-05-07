import '../src/shared/i18n/i18n-setup'; // Must be imported first to initialize i18n
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ThemeProvider } from '@shared/theme/theme-provider';
import { LanguageProvider } from '@shared/i18n/i18n-provider';
import { useAuthenticationStore } from '@stores/authentication-store';

// Same key as the backend `.env` STRIPE_PUBLISHABLE_KEY — only the publishable
// (pk_test_ / pk_live_) key is safe to embed in the app bundle.
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

// Keep the splash screen visible while we restore the user's session
SplashScreen.preventAutoHideAsync();

// The root layout wraps the entire application with all global providers.
// Order matters: outer providers are available to inner ones.
export default function RootLayout() {
  const restoreSessionFromStorage = useAuthenticationStore(
    (store) => store.restoreSessionFromDeviceStorage,
  );
  const isHydrated = useAuthenticationStore((store) => store.isHydrated);

  // On app start: restore the user's saved session, then hide the splash screen
  useEffect(() => {
    async function initializeApp() {
      await restoreSessionFromStorage();
      await SplashScreen.hideAsync();
    }
    initializeApp();
  }, [restoreSessionFromStorage]);

  if (!isHydrated) {
    // Keep showing the splash screen while hydrating
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* StripeProvider must wrap the whole app so useStripe() works anywhere.
            merchantIdentifier must match the value in app.json (Apple Pay).
            urlScheme is the app's deep-link scheme (for 3DS redirects). */}
        <StripeProvider
          publishableKey={STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier="merchant.com.slforce.app"
          urlScheme="slforce"
        >
          <ThemeProvider>
            <LanguageProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(public)" />
                <Stack.Screen name="(private)" />
              </Stack>
            </LanguageProvider>
          </ThemeProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
