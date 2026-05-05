import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@shared/theme/theme-provider';
import { formatTimeFromDate } from '@shared/utils/format-date.util';
import type { MessageEntity } from '../../../domain/entities/message.entity';
import { buildMessageBubbleStyles } from './styles/message-bubble.styles';

interface MessageBubbleProps {
  message:       MessageEntity;
  isMyMessage:   boolean;
}

// A single message bubble in the chat.
// Uses React.memo — only re-renders when the message itself changes (e.g. status update).
export const MessageBubble = memo(function MessageBubble({
  message,
  isMyMessage,
}: MessageBubbleProps) {
  const { theme } = useTheme();
  const styles = buildMessageBubbleStyles(theme, isMyMessage, message.status);

  const formattedTime = formatTimeFromDate(message.sentAt);

  return (
    <View style={styles.bubbleWrapper}>
      <View style={styles.bubbleContainer}>

        {/* ── Attachments ── */}
        {message.attachments.map((att) =>
          att.type === 'image' ? (
            <Image
              key={att.id}
              source={{ uri: att.url }}
              style={styles.attachmentImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <TouchableOpacity
              key={att.id}
              style={styles.fileAttachmentRow}
              activeOpacity={0.7}
              onPress={() => att.url ? void Linking.openURL(att.url) : null}
            >
              <Text style={styles.fileIcon}>📄</Text>
              <Text style={styles.fileNameText} numberOfLines={2}>
                {att.name ?? 'Document'}
              </Text>
            </TouchableOpacity>
          ),
        )}

        {/* ── Text ── */}
        {message.text ? (
          <Text style={styles.messageText}>{message.text}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.timeText}>{formattedTime}</Text>
          {isMyMessage && (
            <Text style={styles.statusIndicator}>
              {message.status === 'sending' ? '⏳' : message.status === 'failed' ? '❌' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
},
// Re-render only when status, text, or attachments change
(previousProps, nextProps) => {
  return (
    previousProps.message.id          === nextProps.message.id &&
    previousProps.message.status      === nextProps.message.status &&
    previousProps.message.text        === nextProps.message.text &&
    previousProps.message.attachments.length === nextProps.message.attachments.length
  );
});
