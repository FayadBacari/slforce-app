import { Stack } from 'expo-router';
import { useTheme } from '@shared/theme/theme-provider';

// Stack navigator for all settings screens.
// Each sub-page slides in from the right like a native settings menu.
export default function SettingsStackLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown:       true,
        headerBackTitle:   'Retour',
        headerStyle:       { backgroundColor: theme.colors.cardBackground },
        headerTitleStyle:  { color: theme.colors.textPrimary },
        headerTintColor:   theme.colors.brandPrimary,
        contentStyle:      { backgroundColor: theme.colors.pageBackground },
      }}
    >
      <Stack.Screen name="index"           options={{ headerTitle: 'Paramètres', headerShown: false }} />
      <Stack.Screen name="profile-settings"options={{ headerTitle: 'Mon profil' }} />
      <Stack.Screen name="privacy-settings"options={{ headerTitle: 'Confidentialité' }} />
      <Stack.Screen name="bank-account"    options={{ headerTitle: 'Compte bancaire' }} />
      <Stack.Screen name="payment-chart"   options={{ headerTitle: 'Mes revenus' }} />
      <Stack.Screen name="payment-history" options={{ headerTitle: 'Historique des paiements' }} />
      <Stack.Screen name="language"        options={{ headerTitle: 'Langue' }} />
      <Stack.Screen name="support"         options={{ headerTitle: 'Aide & Support' }} />
      <Stack.Screen name="delete-account"  options={{ headerTitle: 'Supprimer mon compte' }} />
    </Stack>
  );
}
