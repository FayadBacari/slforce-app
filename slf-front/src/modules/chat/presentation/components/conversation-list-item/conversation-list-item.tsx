import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppAvatar } from '@shared/components/app-avatar/app-avatar';
import { useTheme } from '@shared/theme/theme-provider';
import { formatConversationDateInFrench } from '@shared/utils/format-date.util';
import type { ConversationEntity } from '../../../domain/entities/conversation.entity';
import { buildConversationListItemStyles } from './styles/conversation-list-item.styles';

interface ConversationListItemProps {
  conversation: ConversationEntity;
  onPress:      (conversationId: string) => void;
}

// A single row in the conversation list. Matches the legacy Messages screen
// pixel-perfect: avatar (50px circular) + (name on top, preview below) + date (right).
//
// Performance — wrapped in React.memo with a custom comparator that only
// re-renders when one of the FOUR fields the row visibly displays changes.
// The conversation entity often gets recreated (new object reference) without
// any visible change (e.g. `updatedAt` ticking) — without this comparator the
// whole list would re-render on every push.
function ConversationListItemComponent({
  conversation,
  onPress,
}: ConversationListItemProps) {
  const { theme } = useTheme();
  const styles = buildConversationListItemStyles(theme);

  const hasUnreadMessages   = conversation.numberOfUnreadMessages > 0;
  const lastMessageContent  = conversation.lastMessage?.text ?? '';
  const formattedDate       = conversation.lastMessage
    ? formatConversationDateInFrench(conversation.lastMessage.sentAt)
    : '';

  // True when the latest message is an attachment with no text body
  const isAttachmentMessage = !!conversation.lastMessage
    && (conversation.lastMessage.text ?? '').trim().length === 0
    && (conversation.lastMessage.attachments?.length ?? 0) > 0;

  function handlePressed() {
    onPress(conversation.id);
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePressed}
      activeOpacity={0.65}
    >
      <AppAvatar
        photoUrl={conversation.otherParticipantPhoto}
        fullName={conversation.otherParticipantName}
        size="md"
        isOnline={conversation.isOtherParticipantOnline}
      />

      <View style={styles.textContent}>
        <Text style={styles.participantName} numberOfLines={1}>
          {conversation.otherParticipantName}
        </Text>

        {isAttachmentMessage ? (
          <View style={styles.previewWithIconRow}>
            <Text style={styles.previewIcon}>🖼️</Text>
            <Text
              style={[styles.lastMessagePreview, hasUnreadMessages && styles.unreadText]}
              numberOfLines={1}
            >
              Photo
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.lastMessagePreview, hasUnreadMessages && styles.unreadText]}
            numberOfLines={1}
          >
            {lastMessageContent}
          </Text>
        )}
      </View>

      <View style={styles.rightColumn}>
        <Text style={styles.timeText}>{formattedDate}</Text>
        {hasUnreadMessages && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {conversation.numberOfUnreadMessages > 99
                ? '99+'
                : conversation.numberOfUnreadMessages}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Custom comparator — re-render ONLY if a visible field changed.
// This is what keeps the list buttery smooth even when 50 conversations
// receive irrelevant state updates (presence pings, typing indicators, etc.).
function arePropsEqualForListItem(
  previous: ConversationListItemProps,
  next:     ConversationListItemProps,
): boolean {
  return (
    previous.onPress === next.onPress
    && previous.conversation.id                        === next.conversation.id
    && previous.conversation.otherParticipantName      === next.conversation.otherParticipantName
    && previous.conversation.otherParticipantPhoto     === next.conversation.otherParticipantPhoto
    && previous.conversation.isOtherParticipantOnline  === next.conversation.isOtherParticipantOnline
    && previous.conversation.numberOfUnreadMessages    === next.conversation.numberOfUnreadMessages
    && previous.conversation.lastMessage?.id           === next.conversation.lastMessage?.id
    && previous.conversation.lastMessage?.text         === next.conversation.lastMessage?.text
  );
}

export const ConversationListItem = React.memo(ConversationListItemComponent, arePropsEqualForListItem);
