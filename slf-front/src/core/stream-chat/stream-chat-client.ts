import { StreamChat, type Channel } from 'stream-chat';

const STREAM_CHAT_API_KEY = process.env.EXPO_PUBLIC_STREAM_CHAT_API_KEY ?? '';

// ─── SINGLE SHARED INSTANCE ───────────────────────────────────────────────────
// One Stream Chat client for the entire app.
// Sharing one instance means ONE WebSocket connection handles ALL real-time messages.
// Creating multiple instances would open multiple connections and kill performance.
const streamChatClient = StreamChat.getInstance(STREAM_CHAT_API_KEY, {
  timeout: 6000,
  enableWSFallback: true,   // Falls back to polling if WebSocket is unavailable
});

// ─── CONNECTION ───────────────────────────────────────────────────────────────

// Connects the logged-in user to Stream Chat.
// Must be called right after a successful login.
// If the user is already connected (app resumed from background), skips reconnection.
export async function connectCurrentUserToStreamChat(
  userId: string,
  userFullName: string,
  userPhotoUrl: string | undefined,
  streamAuthToken: string,
): Promise<void> {
  const isAlreadyConnectedAsThisUser = streamChatClient.userID === userId;
  if (isAlreadyConnectedAsThisUser) return;

  await streamChatClient.connectUser(
    { id: userId, name: userFullName, image: userPhotoUrl },
    streamAuthToken,
  );
}

// Disconnects the user from Stream Chat.
// Must be called on logout to close the WebSocket and stop battery drain.
export async function disconnectCurrentUserFromStreamChat(): Promise<void> {
  try {
    await streamChatClient.disconnectUser();
  } catch {
    // We continue the logout process even if disconnection fails
  }
}

// ─── CONVERSATIONS ────────────────────────────────────────────────────────────

// Loads all conversation channels for the current user, sorted by most recent.
// "watching" the channels means we also subscribe to real-time updates for each one.
export async function loadAllConversationsForCurrentUser(): Promise<Channel[]> {
  const currentUserId = streamChatClient.userID ?? '';

  const conversationChannels = await streamChatClient.queryChannels(
    {
      type: 'messaging',
      members: { $in: [currentUserId] },
    },
    { last_message_at: -1 },
    {
      watch: true,          // Subscribe to real-time updates
      state: true,          // Load full channel state
      limit: 30,
      message_limit: 1,     // Only the last message per channel (for the list view)
    },
  );

  return conversationChannels;
}

// Opens (or creates) a conversation channel between two users.
// Stream Chat automatically reuses existing channels, so this is always fast.
export async function openOrCreateConversationBetweenTwoUsers(
  currentUserId: string,
  otherUserId: string,
): Promise<Channel> {
  const conversationChannel = streamChatClient.channel('messaging', {
    members: [currentUserId, otherUserId],
  });

  // watch() loads channel data AND subscribes to real-time updates in one call
  await conversationChannel.watch();

  return conversationChannel;
}

// Opens an existing conversation channel by its unique ID.
// Used when navigating from the conversation list to a specific chat.
export async function openExistingConversationById(channelId: string): Promise<Channel> {
  const channel = streamChatClient.channel('messaging', channelId);
  await channel.watch();
  return channel;
}

// ─── PRE-WARM (perf-critical) ─────────────────────────────────────────────────
// Caches in-flight `watch()` promises so calling prewarm multiple times for the
// same channel doesn't fire multiple network requests. The conversation screen
// awaits the SAME promise on mount → if the user finger-down → finger-up takes
// 200ms, the channel is already half-loaded by the time the screen appears.
const channelWarmupPromisesByChannelId = new Map<string, Promise<Channel>>();

// Call this the moment the user TAPS a conversation in the list — BEFORE the
// router push completes. The channel will start loading in parallel with the
// screen transition animation, making the message screen feel instantaneous.
export function prewarmConversationChannel(channelId: string): Promise<Channel> {
  const cachedWarmup = channelWarmupPromisesByChannelId.get(channelId);
  if (cachedWarmup) return cachedWarmup;

  const newWarmup = (async () => {
    const channel = streamChatClient.channel('messaging', channelId);
    await channel.watch();
    return channel;
  })();

  channelWarmupPromisesByChannelId.set(channelId, newWarmup);

  // Drop the cache once it settles — a future open will re-watch fresh state.
  // We keep the entry briefly (5s) to absorb the screen mount round-trip,
  // then clean up so we don't leak old promises forever.
  newWarmup.finally(() => {
    setTimeout(() => channelWarmupPromisesByChannelId.delete(channelId), 5_000);
  });

  return newWarmup;
}

// ─── MESSAGES ────────────────────────────────────────────────────────────────

// Sends a text message to a conversation channel.
export async function sendTextMessageToConversation(
  channel: Channel,
  messageText: string,
): Promise<void> {
  await channel.sendMessage({ text: messageText });
}

// ─── UNREAD COUNTS ────────────────────────────────────────────────────────────

// Returns how many unread messages the current user has across all conversations.
//
// Priority:
//   1. Sum countUnread() across all WATCHED channels  ← updated synchronously by markRead()
//   2. Fallback to the user object's cached field     ← updated async via WebSocket
//
// Using activeChannels is the most accurate source because channel.markRead()
// immediately updates channel.state.read, so countUnread() returns 0 right away
// without waiting for the server to confirm via notification.mark_read.
export function getTotalUnreadMessageCountForCurrentUser(): number {
  const watched = Object.values(streamChatClient.activeChannels);
  if (watched.length > 0) {
    return watched.reduce((sum, ch) => sum + ch.countUnread(), 0);
  }
  // No watched channels yet — fall back to the user object
  const currentUser = streamChatClient.user as Record<string, unknown> | undefined;
  return (currentUser?.['total_unread_count'] as number | undefined) ?? 0;
}

export { streamChatClient };
