import { useEffect, useState } from 'react';
import type { Event } from 'stream-chat';
import { streamChatClient, getTotalUnreadMessageCountForCurrentUser } from '@core/stream-chat/stream-chat-client';

// ─── useUnreadMessageCount ────────────────────────────────────────────────────
// Returns the total number of unread messages for the current user across ALL
// conversations, updated in real-time via Stream Chat WebSocket events.
//
// Used by the bottom nav to show a badge on the Messages tab.
//
// Performance notes:
//   • Only three lightweight events are subscribed to — no polling.
//   • The count is read directly from the Stream client's cached user object
//     when an event does not carry it explicitly.
//   • Returns 0 when the user is not connected yet (safe for pre-auth renders).

export function useUnreadMessageCount(): number {
  const [unreadCount, setUnreadCount] = useState<number>(
    () => getTotalUnreadMessageCountForCurrentUser(),
  );

  useEffect(() => {
    // Fired when a new message arrives in a channel the user is NOT currently watching.
    // Stream sends total_unread_count on this event — use it directly.
    const onNewNotification = (event: Event) => {
      if (typeof event.total_unread_count === 'number') {
        setUnreadCount(event.total_unread_count);
      } else {
        setUnreadCount(getTotalUnreadMessageCountForCurrentUser());
      }
    };

    // Fired when a notification channel is marked as read (external device / background).
    const onNotificationMarkRead = (event: Event) => {
      if (typeof event.total_unread_count === 'number') {
        setUnreadCount(event.total_unread_count);
      } else {
        setUnreadCount(0);
      }
    };

    // Fired when a user reads messages in a watched channel (channel.markRead()).
    // The event does NOT include total_unread_count — we recalculate from
    // activeChannels which is updated synchronously by markRead().
    const onMessageRead = (event: Event) => {
      // Only react to reads by the CURRENT user — another participant reading
      // their copy doesn't affect our badge.
      if (event.user?.id !== streamChatClient.userID) return;
      setUnreadCount(getTotalUnreadMessageCountForCurrentUser());
    };

    // Fired when the WebSocket (re)connects — refresh the count from the client object.
    const onConnectionChanged = () => {
      setUnreadCount(getTotalUnreadMessageCountForCurrentUser());
    };

    const removeNew        = streamChatClient.on('notification.message_new', onNewNotification);
    const removeRead       = streamChatClient.on('notification.mark_read',   onNotificationMarkRead);
    const removeMessageRead = streamChatClient.on('message.read',            onMessageRead);
    const removeConnection = streamChatClient.on('connection.changed',       onConnectionChanged);

    return () => {
      removeNew.unsubscribe();
      removeRead.unsubscribe();
      removeMessageRead.unsubscribe();
      removeConnection.unsubscribe();
    };
  }, []);

  return unreadCount;
}
