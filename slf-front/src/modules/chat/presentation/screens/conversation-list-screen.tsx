import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme/theme-provider';
import { AppLoadingSpinner } from '@shared/components/app-loading-spinner/app-loading-spinner';
import { AppErrorMessage } from '@shared/components/app-error-message/app-error-message';
import { prewarmConversationChannel } from '@core/stream-chat/stream-chat-client';
import { ConversationListItem } from '../components/conversation-list-item/conversation-list-item';
import { useConversationList } from '../hooks/use-conversation-list.hook';
import { buildConversationListScreenStyles } from '../styles/conversation-list-screen.styles';
import type { ConversationEntity } from '../../domain/entities/conversation.entity';

// The Messages screen.
// Pixel-perfect against the legacy slf-frontend "Messages" screen:
//   • White search bar at the top (no blue header)
//   • FlashList of conversation rows separated by a thin grey divider
//
// Performance highlights:
//   1. Local search — pure useMemo filter, zero network hit
//   2. Pre-warm — calling channel.watch() the moment the user TAPS a row,
//      so the conversation screen mounts on a hot channel (~instant render)
//   3. Forward known data via params (name, photo) so the conversation header
//      shows immediately, before the heavy state finishes loading
//   4. FlashList v2 with stable keyExtractor — auto-recycles cells optimally
export function ConversationListScreen() {
  const { t }     = useTranslation();
  const { theme } = useTheme();
  const router    = useRouter();
  const styles    = buildConversationListScreenStyles(theme);

  const {
    listOfConversations,
    isLoadingConversations,
    loadingErrorMessage,
    reloadConversations,
  } = useConversationList();

  const [searchQuery, setSearchQuery] = useState('');

  // Local-only filter — instant response, no API call.
  const visibleConversations = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (trimmed.length === 0) return listOfConversations;
    return listOfConversations.filter((conv) =>
      conv.otherParticipantName.toLowerCase().includes(trimmed),
    );
  }, [searchQuery, listOfConversations]);

  // Tap on a row → start warming up the channel BEFORE pushing the route.
  // Then forward the participant's name & photo as params so the conversation
  // screen renders its header immediately, without waiting for state to load.
  const handleConversationPressed = useCallback(
    (conversationId: string) => {
      const tappedConversation = listOfConversations.find((c) => c.id === conversationId);

      // Fire-and-forget — the channel will be hot by the time the screen mounts
      void prewarmConversationChannel(conversationId);

      router.push({
        pathname: '/(private)/chat/[conversation-id]' as never,
        params: {
          'conversation-id': conversationId,
          participantId:     tappedConversation?.otherParticipantId   ?? '',
          participantName:   tappedConversation?.otherParticipantName ?? '',
          participantPhoto:  tappedConversation?.otherParticipantPhoto ?? '',
        },
      } as never);
    },
    [router, listOfConversations],
  );

  // Memoised renderItem — passing a stable function reference lets FlashList
  // skip re-renders aggressively.
  const renderConversationItem = useCallback(
    ({ item }: { item: ConversationEntity }) => (
      <ConversationListItem conversation={item} onPress={handleConversationPressed} />
    ),
    [handleConversationPressed],
  );

  const getUniqueKeyForConversation = useCallback(
    (conversation: ConversationEntity) => conversation.id,
    [],
  );

  if (isLoadingConversations && listOfConversations.length === 0) {
    return <AppLoadingSpinner fullScreen message={t('common.loading')} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ─── Search bar at the top ──────────────────────────────────────── */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* ─── List of conversations ──────────────────────────────────────── */}
      {loadingErrorMessage ? (
        <AppErrorMessage
          message={loadingErrorMessage}
          onRetry={reloadConversations}
        />
      ) : (
        <FlashList
          data={visibleConversations}
          renderItem={renderConversationItem}
          keyExtractor={getUniqueKeyForConversation}
          contentContainerStyle={styles.listContentContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateEmoji}>💬</Text>
              <Text style={styles.emptyStateTitle}>{t('chat.noConversations')}</Text>
              <Text style={styles.emptyStateSubtitle}>
                {t('chat.noConversationsDesc')}
              </Text>
            </View>
          }
          onRefresh={reloadConversations}
          refreshing={isLoadingConversations}
        />
      )}
    </SafeAreaView>
  );
}
