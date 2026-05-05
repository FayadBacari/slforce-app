import React, { memo } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme/theme-provider';
import { buildMessageInputBarStyles } from './styles/message-input-bar.styles';

interface MessageInputBarProps {
  currentText:    string;
  onTextChanged:  (newText: string) => void;
  onSendPressed:  () => void;
  isSending:      boolean;
  onAttachPressed?: () => void;
}

// The text input bar at the bottom of the chat screen.
// Kept pure and fast — no hooks with heavy logic inside.
export const MessageInputBar = memo(function MessageInputBar({
  currentText,
  onTextChanged,
  onSendPressed,
  isSending,
  onAttachPressed,
}: MessageInputBarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = buildMessageInputBarStyles(theme);

  const canSendMessage = currentText.trim().length > 0 && !isSending;

  return (
    <View style={styles.container}>
      {/* Attachment button */}
      <TouchableOpacity onPress={onAttachPressed} style={styles.attachButton}>
        <Text style={styles.attachIcon}>📎</Text>
      </TouchableOpacity>

      {/* Text input */}
      <TextInput
        style={styles.textInput}
        value={currentText}
        onChangeText={onTextChanged}
        placeholder={t('chat.messagePlaceholder')}
        placeholderTextColor={theme.colors.textDisabled}
        multiline
        maxLength={2000}
        returnKeyType="default"
      />

      {/* Send button */}
      <TouchableOpacity
        onPress={onSendPressed}
        disabled={!canSendMessage}
        style={[styles.sendButton, canSendMessage && styles.sendButtonActive]}
        activeOpacity={0.8}
      >
        <Text style={styles.sendIcon}>➤</Text>
      </TouchableOpacity>
    </View>
  );
});
