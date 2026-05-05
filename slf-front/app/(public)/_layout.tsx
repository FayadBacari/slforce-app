import { Stack } from 'expo-router';

// Layout for all public screens (login, register, forgot password).
// No authentication required to access these screens.
export default function PublicScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="register-athlete" />
      <Stack.Screen name="register-coach" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
