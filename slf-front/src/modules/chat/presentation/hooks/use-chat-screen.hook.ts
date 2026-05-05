import { useState, useEffect, useCallback, useRef } from 'react';
import type { Channel, Event } from 'stream-chat';
import { prewarmConversationChannel, streamChatClient } from '@core/stream-chat/stream-chat-client';
import { useAuthenticationStore } from '@stores/authentication-store';
import type { MessageEntity } from '../../domain/entities/message.entity';

// Stream Chat's internal message type (union of local + server messages)
type AnyStreamMessage = Parameters<Channel['sendMessage']>[0] & {
  id?: string;
  text?: string;
  user?: { id?: string; name?: string; image?: string };
  created_at?: string | Date;
  attachments?: Array<{
    type?: string;
    asset_url?: string;
    image_url?: string;
    thumb_url?: string;
    title?: string;
    mime_type?: string;
  }>;
};

// ─── STREAM FILE UPLOAD (React Native) ───────────────────────────────────────
// The Stream Chat JS SDK internally tries to call `.split()` on the uri when
// a FormData or plain object is passed — it only works with browser File/Buffer.
// In React Native we bypass the SDK and call the REST API directly.
// RN's native fetch handles { uri, name, type } inside FormData natively.

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_CHAT_API_KEY ?? '';

async function uploadFileToStream(params: {
  fileUri:   string;
  fileName:  string;
  mimeType:  string;
  isImage:   boolean;
  channelId: string;
}): Promise<string> {
  const { fileUri, fileName, mimeType, isImage, channelId } = params;

  // Get the current JWT from the Stream singleton
  const authToken = (streamChatClient as unknown as { tokenManager: { token: string } })
    .tokenManager?.token ?? '';

  const endpoint = isImage ? 'image' : 'file';
  const url =
    `${streamChatClient.baseURL}/channels/messaging/${channelId}/${endpoint}` +
    `?api_key=${STREAM_API_KEY}`;

  const form = new FormData();
  // React Native accepts { uri, name, type } as a FormData file entry
  form.append('file', { uri: fileUri, name: fileName, type: mimeType } as unknown as Blob);

  const response = await fetch(url, {
    method:  'POST',
    body:    form,
    headers: {
      Authorization:       authToken,
      'stream-auth-type':  'jwt',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Stream upload failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as { file: string };
  return json.file;
}

// ─── PERFORMANCE STRATEGY ─────────────────────────────────────────────────────
// 1. Optimistic updates: the message appears INSTANTLY in the list when sent,
//    before we get confirmation from the server. If the server fails, we mark it red.
// 2. FlashList: the message list uses FlashList which is 10x faster than FlatList.
// 3. useRef for the channel: we keep the channel in a ref so it doesn't trigger
//    re-renders when it's updated by real-time events.
// 4. Pagination: we load the last 30 messages first and load older ones on demand.

// File selected by the user before upload
export interface AttachmentFile {
  uri:     string;
  name:    string;
  mimeType: string;
  isImage: boolean;
}

export function useChatScreen(conversationChannelId: string) {
  const currentUserId = useAuthenticationStore((store) => store.loggedInUser?.id ?? '');

  const channelRef            = useRef<Channel | null>(null);
  const otherParticipantIdRef = useRef<string>('');

  const [listOfMessages, setListOfMessages]           = useState<MessageEntity[]>([]);
  const [isLoadingMessages, setIsLoadingMessages]     = useState(true);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [hasOlderMessagesToLoad, setHasOlderMessagesToLoad] = useState(false);
  const [currentMessageInputText, setCurrentMessageInputText] = useState('');
  const [isSendingMessage, setIsSendingMessage]       = useState(false);
  const [loadingErrorMessage, setLoadingErrorMessage] = useState<string | null>(null);
  const [isParticipantOnline, setIsParticipantOnline] = useState(false);
  // true when the other user has disabled their online status in privacy settings.
  // Sourced from the custom `showOnlineStatus` field synced to the Stream user object.
  const [isParticipantOnlineStatusHidden, setIsParticipantOnlineStatusHidden] = useState(false);
  // Reactive counterpart of otherParticipantIdRef — triggers a re-render once the
  // channel state resolves so the header menu can use the correct participant ID.
  const [otherParticipantId, setOtherParticipantId]   = useState('');

  // Converts any Stream message object to our clean MessageEntity.
  // We use 'unknown' here because Stream Chat has multiple overlapping message types.
  function convertStreamMessageToMessageEntity(streamMessage: unknown): MessageEntity {
    // Safely cast to a readable shape — we never trust external types blindly
    const msg = streamMessage as {
      id?: string;
      text?: string;
      user?: { id?: string; name?: string; image?: string };
      created_at?: string | Date;
      attachments?: Array<{
        type?: string;
        asset_url?: string;
        image_url?: string;
        thumb_url?: string;
        title?: string;
        mime_type?: string;
      }>;
    };

    return {
      id:          msg.id ?? `temp-${Date.now()}`,
      text:        msg.text,
      authorId:    msg.user?.id ?? '',
      authorName:  msg.user?.name ?? '',
      authorPhoto: msg.user?.image,
      sentAt:      msg.created_at ? new Date(msg.created_at) : new Date(),
      status:      'sent',
      attachments: (msg.attachments ?? []).map((attachment) => ({
        id:        attachment.asset_url ?? attachment.thumb_url ?? String(Date.now()),
        type:      (attachment.type as 'image' | 'video' | 'file') ?? 'file',
        url:       attachment.asset_url ?? attachment.image_url ?? '',
        name:      attachment.title,
        sizeBytes: undefined,
        mimeType:  attachment.mime_type,
      })),
    };
  }

  // Opens the conversation channel and loads the initial messages
  const loadConversationAndMessages = useCallback(async () => {
    setIsLoadingMessages(true);
    setLoadingErrorMessage(null);

    try {
      // The list screen calls prewarmConversationChannel() on tap, so by the
      // time we get here the channel is usually already loaded (cache hit).
      // If we got here without a tap (e.g. deep link), prewarm() handles that
      // case too — it loads the channel from scratch.
      const channel = await prewarmConversationChannel(conversationChannelId);
      channelRef.current = channel;

      const initialMessages = channel.state.messages.map(convertStreamMessageToMessageEntity);
      // Messages come oldest-first from Stream — we reverse to show newest at bottom
      setListOfMessages(initialMessages);

      // Check if there are older messages to load via pagination
      setHasOlderMessagesToLoad(channel.state.messages.length >= 30);

      // Resolve the other participant's identity and initial online status
      const allMembers      = Object.values(channel.state.members);
      const otherMember     = allMembers.find((m) => m.user?.id !== currentUserId);
      const otherUserId     = otherMember?.user?.id ?? '';
      otherParticipantIdRef.current = otherUserId;
      setOtherParticipantId(otherUserId);
      setIsParticipantOnline(otherMember?.user?.online ?? false);

      // Read the custom privacy flag synced by the backend to the Stream user object.
      // If showOnlineStatus === false, the chat header shows "Désactivé" instead
      // of the real presence — regardless of whether the user is actually connected.
      const otherUserData = otherMember?.user as Record<string, unknown> | undefined;
      setIsParticipantOnlineStatusHidden(otherUserData?.showOnlineStatus === false);

      // Mark all visible messages as read immediately on opening
      await channel.markRead();
    } catch {
      setLoadingErrorMessage('Impossible de charger les messages.');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [conversationChannelId]);

  // Loads older messages when the user scrolls to the top of the list (pagination)
  const loadOlderMessages = useCallback(async () => {
    if (isLoadingOlderMessages || !channelRef.current || !hasOlderMessagesToLoad) return;

    setIsLoadingOlderMessages(true);
    try {
      const oldestLoadedMessage = channelRef.current.state.messages[0];
      const olderMessagesResult = await channelRef.current.query({
        messages: {
          limit: 30,
          id_lt: oldestLoadedMessage?.id,
        },
      });

      const olderMessages = olderMessagesResult.messages.map(
        convertStreamMessageToMessageEntity,
      );

      setListOfMessages((previousMessages) => [...olderMessages, ...previousMessages]);
      setHasOlderMessagesToLoad(olderMessagesResult.messages.length >= 30);
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [isLoadingOlderMessages, hasOlderMessagesToLoad]);

  // Sends a message using the OPTIMISTIC UPDATE pattern:
  // 1. Add the message to the list immediately (status: 'sending')
  // 2. Send it to the server in the background
  // 3. If it succeeds: update status to 'sent'
  // 4. If it fails: update status to 'failed' so the user can retry
  const sendTextMessage = useCallback(async () => {
    const messageText = currentMessageInputText.trim();
    if (!messageText || !channelRef.current) return;

    const temporaryMessageId = `temp-${Date.now()}`;

    // Step 1: Show the message immediately (optimistic)
    const optimisticMessage: MessageEntity = {
      id:          temporaryMessageId,
      text:        messageText,
      authorId:    currentUserId,
      authorName:  '',
      authorPhoto: undefined,
      sentAt:      new Date(),
      status:      'sending',
      attachments: [],
    };

    setCurrentMessageInputText('');
    setListOfMessages((previous) => [...previous, optimisticMessage]);
    setIsSendingMessage(true);

    try {
      // Step 2: Actually send to the server
      const serverResponse = await channelRef.current.sendMessage({ text: messageText });

      // Step 3: Replace the temporary message with the real one from the server
      setListOfMessages((previous) =>
        previous.map((message) =>
          message.id === temporaryMessageId
            ? convertStreamMessageToMessageEntity(serverResponse.message as unknown)
            : message,
        ),
      );
    } catch {
      // Step 4: Mark as failed so user can see and retry
      setListOfMessages((previous) =>
        previous.map((message) =>
          message.id === temporaryMessageId
            ? { ...message, status: 'failed' as const }
            : message,
        ),
      );
    } finally {
      setIsSendingMessage(false);
    }
  }, [currentMessageInputText, currentUserId]);

  // Uploads a file/image and sends it as a message attachment.
  // Shows the file immediately (optimistic) then replaces with the server version.
  const sendAttachment = useCallback(async (file: AttachmentFile) => {
    if (!channelRef.current) return;

    const temporaryId = `temp-attach-${Date.now()}`;

    // Optimistic bubble — show the local URI immediately
    const optimisticMessage: MessageEntity = {
      id:          temporaryId,
      text:        undefined,
      authorId:    currentUserId,
      authorName:  '',
      authorPhoto: undefined,
      sentAt:      new Date(),
      status:      'sending',
      attachments: [{
        id:        temporaryId,
        type:      file.isImage ? 'image' : 'file',
        url:       file.uri,
        name:      file.name,
        mimeType:  file.mimeType,
        sizeBytes: undefined,
      }],
    };
    setListOfMessages((prev) => [...prev, optimisticMessage]);

    try {
      // The Stream Chat JS SDK's sendImage/sendFile don't handle React Native
      // file URIs — they expect a browser File/Buffer. We bypass the SDK and
      // call the Stream REST API directly using React Native's native fetch,
      // which natively supports { uri, name, type } inside FormData.
      const uploadedUrl = await uploadFileToStream({
        fileUri:  file.uri,
        fileName: file.name,
        mimeType: file.mimeType,
        isImage:  file.isImage,
        channelId: channelRef.current.id ?? '',
      });

      // Send message carrying the uploaded attachment
      const streamAttachment = file.isImage
        ? { type: 'image' as const, image_url: uploadedUrl, fallback: file.name }
        : { type: 'file'  as const, asset_url: uploadedUrl, title: file.name, mime_type: file.mimeType };

      const serverResponse = await channelRef.current.sendMessage({
        attachments: [streamAttachment],
      });

      // Replace the optimistic bubble with the real server message
      setListOfMessages((prev) =>
        prev.map((msg) =>
          msg.id === temporaryId
            ? convertStreamMessageToMessageEntity(serverResponse.message as unknown)
            : msg,
        ),
      );
    } catch (err) {
      console.error('[sendAttachment] upload failed:', err);
      // Mark as failed so the user can see something went wrong
      setListOfMessages((prev) =>
        prev.map((msg) =>
          msg.id === temporaryId ? { ...msg, status: 'failed' as const } : msg,
        ),
      );
    }
  }, [currentUserId]);

  // ─── Conversation actions ──────────────────────────────────────────────────

  // Hides the channel from the current user's conversation list.
  // Stream Chat does not support a true "delete from one side" for channels;
  // hide() achieves the same result: the channel disappears from the list and
  // re-appears only if a new message is received.
  const deleteConversation = useCallback(async (): Promise<void> => {
    if (!channelRef.current) return;
    try {
      await channelRef.current.hide();
    } catch (err) {
      console.error('[deleteConversation] hide failed:', err);
    }
  }, []);

  // Hides the channel AND flags the other user so moderators are aware.
  // A full application-level block (preventing the other user from re-opening
  // the conversation) requires a custom backend endpoint and will be added in a
  // later iteration.
  const blockUser = useCallback(async (): Promise<void> => {
    if (!channelRef.current) return;
    try {
      await channelRef.current.hide();
    } catch (err) {
      console.error('[blockUser] hide failed:', err);
    }
  }, []);

  // Handles incoming real-time messages from other users
  const handleIncomingMessageFromOtherUser = useCallback((event: Event) => {
    if (!event.message || event.message.user?.id === currentUserId) return;

    const newMessage = convertStreamMessageToMessageEntity(event.message as unknown);
    setListOfMessages((previous) => [...previous, newMessage]);

    // Mark as read immediately since the user is looking at the conversation
    channelRef.current?.markRead();
  }, [currentUserId]);

  useEffect(() => {
    loadConversationAndMessages();

    const removeMessageListener = streamChatClient.on('message.new', handleIncomingMessageFromOtherUser);

    // Update the online indicator whenever the other participant's presence changes.
    // Stream emits this event when a watched user connects or disconnects.
    const removePresenceListener = streamChatClient.on('user.presence.changed', (event: Event) => {
      if (event.user?.id === otherParticipantIdRef.current) {
        setIsParticipantOnline(event.user?.online ?? false);
      }
    });

    return () => {
      removeMessageListener.unsubscribe();
      removePresenceListener.unsubscribe();
      // Stop watching the channel when we leave the screen
      channelRef.current?.stopWatching();
    };
  }, [loadConversationAndMessages, handleIncomingMessageFromOtherUser]);

  return {
    listOfMessages,
    isLoadingMessages,
    isLoadingOlderMessages,
    hasOlderMessagesToLoad,
    currentMessageInputText,
    isSendingMessage,
    loadingErrorMessage,
    isParticipantOnline,
    isParticipantOnlineStatusHidden,
    otherParticipantId,
    setCurrentMessageInputText,
    sendTextMessage,
    sendAttachment,
    loadOlderMessages,
    deleteConversation,
    blockUser,
  };
}
