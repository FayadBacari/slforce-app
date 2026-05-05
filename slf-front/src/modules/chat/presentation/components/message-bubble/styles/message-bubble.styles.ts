import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';
import type { MessageDeliveryStatus } from '@modules/chat/domain/entities/message.entity';

export function buildMessageBubbleStyles(
  theme: AppTheme,
  isMyMessage: boolean,
  status: MessageDeliveryStatus,
) {
  const bubbleBackground = isMyMessage
    ? theme.colors.myMessageBubble
    : theme.colors.theirMessageBubble;

  const textColor = isMyMessage
    ? theme.colors.myMessageText
    : theme.colors.theirMessageText;

  const isFailedMessage = status === 'failed';

  return StyleSheet.create({
    bubbleWrapper: {
      alignItems:     isMyMessage ? 'flex-end' : 'flex-start',
      marginVertical: SPACING[1],
      paddingHorizontal: SPACING[4],
    },
    bubbleContainer: {
      maxWidth:          '75%',
      backgroundColor:   isFailedMessage ? theme.colors.danger : bubbleBackground,
      borderRadius:      BORDER_RADIUS.messageBubble,
      borderBottomRightRadius: isMyMessage ? BORDER_RADIUS.messageBubbleTailless : BORDER_RADIUS.messageBubble,
      borderBottomLeftRadius:  isMyMessage ? BORDER_RADIUS.messageBubble : BORDER_RADIUS.messageBubbleTailless,
      paddingVertical:   SPACING[2],
      paddingHorizontal: SPACING[3],
      opacity:           status === 'sending' ? 0.7 : 1,
    },
    messageText: {
      ...TYPOGRAPHY.presets.messageText,
      color: textColor,
    },
    metaRow: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'flex-end',
      gap:            SPACING[1],
      marginTop:      SPACING[1],
    },
    timeText: {
      ...TYPOGRAPHY.presets.caption,
      color:   isMyMessage ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary,
      fontSize: 10,
    },
    statusIndicator: {
      fontSize: 10,
    },

    // ─── Attachment styles ───────────────────────────────────────────────────
    attachmentImage: {
      width:        220,
      height:       160,
      borderRadius: BORDER_RADIUS.messageBubble,
      marginBottom: SPACING[1],
    },
    fileAttachmentRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           SPACING[2],
      paddingVertical: SPACING[1],
    },
    fileIcon: {
      fontSize: 24,
    },
    fileNameText: {
      flex:       1,
      fontSize:   13,
      fontWeight: '600',
      color:      textColor,
    },
  });
}
