import { useState, useEffect, useCallback, useRef } from 'react';
import type { Channel, Event } from 'stream-chat';
import {
  loadAllConversationsForCurrentUser,
  streamChatClient,
} from '@core/stream-chat/stream-chat-client';
import { useAuthenticationStore } from '@stores/authentication-store';
import type { ConversationEntity } from '../../domain/entities/conversation.entity';
import type { MessageEntity } from '../../domain/entities/message.entity';

// All the state and logic needed by the ConversationListScreen.
export function useConversationList() {
  const currentUserId = useAuthenticationStore((store) => store.loggedInUser?.id ?? '');

  const [listOfConversations, setListOfConversations] = useState<ConversationEntity[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [loadingErrorMessage, setLoadingErrorMessage] = useState<string | null>(null);

  // We keep a ref to the raw Stream channels so we can update them on new messages
  const rawChannelsRef = useRef<Channel[]>([]);

  // Converts a Stream Chat channel to our clean ConversationEntity
  const convertChannelToConversationEntity = useCallback(
    (channel: Channel): ConversationEntity => {
      const allMembers      = Object.values(channel.state.members);
      const otherParticipant = allMembers.find((member) => member.user?.id !== currentUserId);

      const lastStreamMessage  = channel.state.messages[channel.state.messages.length - 1];
      const lastMessageEntity: MessageEntity | undefined = lastStreamMessage
        ? {
            id:          lastStreamMessage.id,
            text:        lastStreamMessage.text,
            authorId:    lastStreamMessage.user?.id ?? '',
            authorName:  lastStreamMessage.user?.name ?? '',
            authorPhoto: lastStreamMessage.user?.image as string | undefined,
            sentAt:      new Date(lastStreamMessage.created_at ?? Date.now()),
            status:      'sent',
            attachments: [],
          }
        : undefined;

      return {
        id:                      channel.id ?? '',
        otherParticipantId:      otherParticipant?.user?.id ?? '',
        otherParticipantName:    otherParticipant?.user?.name ?? 'Utilisateur',
        otherParticipantPhoto:   otherParticipant?.user?.image as string | undefined,
        isOtherParticipantOnline:otherParticipant?.user?.online ?? false,
        lastMessage:             lastMessageEntity,
        numberOfUnreadMessages:  channel.countUnread(),
        updatedAt:               new Date(channel.data?.last_message_at ?? Date.now()),
      };
    },
    [currentUserId],
  );

  // Loads all conversations and sorts them by most recent
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setLoadingErrorMessage(null);
    try {
      const channels = await loadAllConversationsForCurrentUser();
      rawChannelsRef.current = channels;
      const conversations = channels.map(convertChannelToConversationEntity);
      setListOfConversations(conversations);
    } catch {
      setLoadingErrorMessage('Impossible de charger les conversations.');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [convertChannelToConversationEntity]);

  // Updates the conversation list when a new message arrives in any channel
  const handleNewMessageReceived = useCallback(
    (event: Event) => {
      if (!event.channel_id) return;

      setListOfConversations((previousConversations) => {
        const channelThatReceivedMessage = rawChannelsRef.current.find(
          (ch) => ch.id === event.channel_id,
        );
        if (!channelThatReceivedMessage) return previousConversations;

        const updatedConversation = convertChannelToConversationEntity(
          channelThatReceivedMessage,
        );

        // Move the updated conversation to the top (most recent first)
        const conversationsWithoutUpdated = previousConversations.filter(
          (conv) => conv.id !== event.channel_id,
        );

        return [updatedConversation, ...conversationsWithoutUpdated];
      });
    },
    [convertChannelToConversationEntity],
  );

  // Clears the unread badge on a conversation when the user reads it.
  // Triggered by channel.markRead() in the chat screen.
  const handleMessageRead = useCallback((event: Event) => {
    if (!event.channel_id) return;
    setListOfConversations((previous) =>
      previous.map((conv) =>
        conv.id === event.channel_id
          ? { ...conv, numberOfUnreadMessages: 0 }
          : conv,
      ),
    );
  }, []);

  useEffect(() => {
    loadConversations();

    // New message → move conversation to top and update preview
    const removeNewMessageListener = streamChatClient.on(
      'message.new',
      handleNewMessageReceived,
    );

    // Message read → clear the unread badge on that conversation
    const removeReadListener = streamChatClient.on(
      'message.read',
      handleMessageRead,
    );

    return () => {
      removeNewMessageListener.unsubscribe();
      removeReadListener.unsubscribe();
    };
  }, [loadConversations, handleNewMessageReceived, handleMessageRead]);

  return {
    listOfConversations,
    isLoadingConversations,
    loadingErrorMessage,
    reloadConversations: loadConversations,
  };
}
