import { Stack } from 'expo-router';

// Stack navigator for the chat screens (list + individual conversation).
export default function ChatStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="[conversation-id]"
        options={{
          // ChatScreen renders its own full custom header (avatar + name +
          // online status + back button). The Stack native bar is hidden to
          // avoid a double-header on both iOS and Android.
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="make-payment"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
