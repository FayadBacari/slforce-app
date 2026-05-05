import React, { useCallback } from 'react';
import { Alert, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker    from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@shared/theme/theme-provider';
import { AppAvatar } from '@shared/components/app-avatar/app-avatar';
import { AppErrorMessage } from '@shared/components/app-error-message/app-error-message';
import { MessageBubble } from '../components/message-bubble/message-bubble';
import { MessageInputBar } from '../components/message-input-bar/message-input-bar';
import { useChatScreen } from '../hooks/use-chat-screen.hook';
import { buildChatScreenStyles } from '../styles/chat-screen.styles';
import { useAuthenticationStore } from '@stores/authentication-store';
import type { MessageEntity } from '../../domain/entities/message.entity';

export function ChatScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const styles    = buildChatScreenStyles(theme);

  // Params forwarded by the conversation list when the user taps a row.
  // Receiving these lets the header render IMMEDIATELY — no flash of empty state
  // while the channel state finishes loading in the background.
  // Expo Router v6's `Route` constraint is too strict for custom param types,
  // so we read the raw record and coerce each value to a string ourselves.
  const rawParams = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const readParamAsString = (key: string): string => {
    const value = rawParams[key];
    if (Array.isArray(value)) return value[0] ?? '';
    return value ?? '';
  };

  const conversationId   = readParamAsString('conversation-id');
  const participantName  = readParamAsString('participantName');
  const participantPhoto = readParamAsString('participantPhoto') || undefined;

  const currentUserId = useAuthenticationStore((store) => store.loggedInUser?.id ?? '');

  // The participant's Stream / MongoDB user ID is forwarded as a param from the
  // conversation list (instant access). The hook also resolves it asynchronously
  // from the channel state as a fallback (covers deep-link entry).
  const participantId = readParamAsString('participantId');

  // Current user's role — gates the "Effectuer un paiement" menu option.
  const userRole  = useAuthenticationStore((store) => store.loggedInUser?.role);
  const isAthlete = userRole === 'athlete';

  const {
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
  } = useChatScreen(conversationId);

  // Prefer the URL param (available immediately) over the hook value (async).
  const resolvedParticipantId = participantId || otherParticipantId;

  // ─── Header three-dot menu ─────────────────────────────────────────────────
  //
  // All users see "Supprimer la conversation" and "Bloquer l'utilisateur".
  // Athletes additionally see "Effectuer un paiement" to pay the coach in context.
  const handleMenuPressed = useCallback(() => {
    const menuItems = [
      // ── Delete conversation ──────────────────────────────────────────────
      {
        text:  'Supprimer la conversation',
        style: 'destructive' as const,
        onPress: () =>
          Alert.alert(
            'Supprimer la conversation ?',
            'Cette conversation disparaîtra de votre liste. Si vous recevez un nouveau message, elle réapparaîtra.',
            [
              { text: 'Annuler', style: 'cancel' as const },
              {
                text:  'Supprimer',
                style: 'destructive' as const,
                onPress: async () => {
                  await deleteConversation();
                  router.back();
                },
              },
            ],
          ),
      },
      // ── Block user ───────────────────────────────────────────────────────
      {
        text:  "Bloquer l'utilisateur",
        style: 'destructive' as const,
        onPress: () =>
          Alert.alert(
            'Bloquer cet utilisateur ?',
            `${participantName || 'Cet utilisateur'} ne pourra plus vous contacter depuis cette conversation.`,
            [
              { text: 'Annuler', style: 'cancel' as const },
              {
                text:  'Bloquer',
                style: 'destructive' as const,
                onPress: async () => {
                  await blockUser();
                  router.back();
                },
              },
            ],
          ),
      },
      // ── Pay coach (athletes only) ────────────────────────────────────────
      ...(isAthlete
        ? [
            {
              text:    'Effectuer un paiement',
              style:   'default' as const,
              onPress: () => {
                router.push({
                  pathname: '/(private)/chat/make-payment' as never,
                  params:   {
                    coachId:   resolvedParticipantId,
                    coachName: participantName,
                  },
                } as never);
              },
            },
          ]
        : []),
      // ── Cancel ───────────────────────────────────────────────────────────
      { text: 'Annuler', style: 'cancel' as const, onPress: undefined },
    ];

    Alert.alert('Options', '', menuItems);
  }, [
    deleteConversation,
    blockUser,
    isAthlete,
    resolvedParticipantId,
    participantName,
    router,
  ]);

  // ─── Attachment picker ─────────────────────────────────────────────────────
  const handleAttachPressed = useCallback(() => {
    Alert.alert('Joindre un fichier', '', [
      {
        text: 'Photo / Image',
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (permission.status !== 'granted') {
            Alert.alert(
              'Permission refusée',
              'Autorise l\'accès à ta galerie dans les Réglages.',
            );
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality:    0.85,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            await sendAttachment({
              uri:      asset.uri,
              name:     asset.fileName ?? `photo_${Date.now()}.jpg`,
              mimeType: asset.mimeType ?? 'image/jpeg',
              isImage:  true,
            });
          }
        },
      },
      {
        text: 'Document / PDF',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type:                 '*/*',
            copyToCacheDirectory: true,
          });
          if (!result.canceled && result.assets[0]) {
            const doc = result.assets[0];
            await sendAttachment({
              uri:      doc.uri,
              name:     doc.name,
              mimeType: doc.mimeType ?? 'application/octet-stream',
              isImage:  false,
            });
          }
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, [sendAttachment]);

  // ─── Render single bubble ──────────────────────────────────────────────────
  const renderMessageItem = useCallback(
    ({ item }: { item: MessageEntity }) => (
      <MessageBubble
        message={item}
        isMyMessage={item.authorId === currentUserId}
      />
    ),
    [currentUserId],
  );

  const getUniqueKeyForMessage = useCallback(
    (message: MessageEntity) => message.id,
    [],
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* Header — visible IMMEDIATELY thanks to params (no wait for state) */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          activeOpacity={0.6}
        >
          <Text style={styles.headerBackArrow}>‹</Text>
        </TouchableOpacity>

        <AppAvatar
          photoUrl={participantPhoto}
          fullName={participantName || 'Utilisateur'}
          size="sm"
        />

        <View style={styles.headerTitleColumn}>
          <Text style={styles.headerParticipantName} numberOfLines={1}>
            {participantName || 'Conversation'}
          </Text>
          <Text style={styles.headerStatusText}>
            {isLoadingMessages
              ? 'Chargement…'
              : isParticipantOnlineStatusHidden
                ? 'Désactivé'
                : isParticipantOnline
                  ? '🟢 En ligne'
                  : 'Hors ligne'}
          </Text>
        </View>

        {/* Three-dot menu ─ opened via Alert (ActionSheet on iOS) */}
        <TouchableOpacity
          style={styles.headerMenuButton}
          onPress={handleMenuPressed}
          activeOpacity={0.6}
          accessibilityLabel="Options de conversation"
          accessibilityRole="button"
        >
          <Text style={styles.headerMenuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Body — error / loading / message list */}
        {loadingErrorMessage ? (
          <View style={styles.errorContainer}>
            <AppErrorMessage message={loadingErrorMessage} />
          </View>
        ) : (
          <View style={styles.messagesContainer}>
            {isLoadingMessages && listOfMessages.length === 0 ? (
              <View style={styles.inlineLoaderContainer}>
                <ActivityIndicator color={theme.colors.brandPrimary} />
              </View>
            ) : (
              <FlashList
                data={listOfMessages}
                renderItem={renderMessageItem}
                keyExtractor={getUniqueKeyForMessage}
                // Chat layout: render from bottom (newest at bottom) and keep
                // position stable when older messages are prepended.
                maintainVisibleContentPosition={{ startRenderingFromBottom: true }}
                onStartReached={hasOlderMessagesToLoad ? loadOlderMessages : undefined}
                onStartReachedThreshold={0.3}
                ListHeaderComponent={
                  isLoadingOlderMessages ? (
                    <View style={styles.inlineLoaderContainer}>
                      <ActivityIndicator color={theme.colors.brandPrimary} />
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        )}

        {/* Bottom message composer */}
        <MessageInputBar
          currentText={currentMessageInputText}
          onTextChanged={setCurrentMessageInputText}
          onSendPressed={sendTextMessage}
          isSending={isSendingMessage}
          onAttachPressed={handleAttachPressed}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
