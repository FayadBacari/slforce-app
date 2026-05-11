import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme/theme-provider';
import { AppAvatar } from '@shared/components/app-avatar/app-avatar';
import { useAuthenticationStore } from '@stores/authentication-store';
import { openOrCreateConversationBetweenTwoUsers } from '@core/stream-chat/stream-chat-client';
import { usePlatformStats } from '@modules/search/presentation/hooks/use-platform-stats.hook';
import { useAthleteSearch } from '@modules/search/presentation/hooks/use-athlete-search.hook';
import type { AthleteSearchResultEntity } from '@modules/search/domain/entities/athlete-search-result.entity';
import { APP_ROUTES, pushRoute } from '@shared/navigation/app-routes';
import { createLogger } from '@shared/logger/logger';
import { buildCoachSearchStyles } from '@screen-styles/coach/search.styles';

const logger = createLogger('CoachSearch');

export default function CoachSearchPage(): React.JSX.Element {
  const { t }         = useTranslation();
  const { theme }     = useTheme();
  const styles        = useMemo(() => buildCoachSearchStyles(theme), [theme]);
  const currentUserId = useAuthenticationStore((s) => s.loggedInUser?.id ?? '');

  const { stats }                                 = usePlatformStats();
  const { athletes, isLoading, hasError, reload } = useAthleteSearch();

  const [searchQuery, setSearchQuery] = useState('');
  const [openingConversationForAthleteId, setOpeningConversationForAthleteId] = useState<string | null>(null);

  // Local search filter — name only
  const visibleAthletes = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (!trimmedQuery) return athletes;
    return athletes.filter((a) => a.fullName.toLowerCase().includes(trimmedQuery));
  }, [athletes, searchQuery]);

  const handleContactAthlete = useCallback(async (athlete: AthleteSearchResultEntity): Promise<void> => {
    if (!currentUserId || openingConversationForAthleteId) return;
    setOpeningConversationForAthleteId(athlete.id);
    try {
      const channel = await openOrCreateConversationBetweenTwoUsers(currentUserId, athlete.id);

      if (!channel.id) throw new Error('channel id missing');

      pushRoute({
        pathname: APP_ROUTES.private.chatConversation,
        params: {
          'conversation-id': channel.id,
          participantName:   athlete.fullName,
          participantPhoto:  athlete.profilePhotoUrl ?? '',
        },
      });
    } catch (contactError) {
      logger.warn('Cannot open conversation with athlete', contactError);
      Alert.alert(
        t('errors.network'),
        t('errors.unknown'),
        [{ text: t('common.confirm') }],
      );
    } finally {
      setOpeningConversationForAthleteId(null);
    }
  }, [currentUserId, openingConversationForAthleteId, t]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ─── Tall blue header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('search.athleteSearchTitle')}</Text>
        <Text style={styles.headerSubtitle}>{t('search.athleteSearchSubtitle')}</Text>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.searchAthletesPlaceholder')}
            placeholderTextColor={theme.colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel={t('search.searchAthletesPlaceholder')}
          />
        </View>

        {/* 3 stats cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats ? String(stats.athleteCount) : '—'}</Text>
            <Text style={styles.statLabel}>{t('search.statAthleteCount')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>{t('search.statRating')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats ? String(stats.coachCount) : '—'}</Text>
            <Text style={styles.statLabel}>{t('search.statCoachCount')}</Text>
          </View>
        </View>
      </View>

      {/* ─── Result list ─────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={reload} tintColor={theme.colors.brandPrimary} />
        }
      >
        {/* Loading spinner */}
        {isLoading && athletes.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <ActivityIndicator size="large" color={theme.colors.brandPrimary} />
          </View>
        )}

        {/* Error state */}
        {hasError && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateEmoji}>⚠️</Text>
            <Text style={styles.emptyStateTitle}>{t('errors.network')}</Text>
            <Text style={styles.emptyStateMessage}>{t('common.retry')}</Text>
          </View>
        )}

        {/* Empty state */}
        {!isLoading && !hasError && visibleAthletes.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateEmoji}>🏃</Text>
            <Text style={styles.emptyStateTitle}>{t('search.noAthletesFound')}</Text>
            <Text style={styles.emptyStateMessage}>
              {searchQuery.trim().length > 0
                ? t('common.noResults')
                : t('search.noAthletesFoundDesc')}
            </Text>
          </View>
        )}

        {/* Athlete cards */}
        {!isLoading && !hasError && visibleAthletes.length > 0 && (
          <View style={styles.listContent}>
            {visibleAthletes.map((athlete) => (
              <AthleteResultCard
                key={athlete.id}
                athlete={athlete}
                styles={styles}
                isContacting={openingConversationForAthleteId === athlete.id}
                onContact={handleContactAthlete}
              />
            ))}
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Athlete result card ────────────────────────────────────────────────────

interface AthleteResultCardProps {
  athlete:      AthleteSearchResultEntity;
  styles:       ReturnType<typeof buildCoachSearchStyles>;
  isContacting: boolean;
  onContact:    (athlete: AthleteSearchResultEntity) => Promise<void>;
}

const AthleteResultCard = memo(function AthleteResultCard({
  athlete, styles, isContacting, onContact,
}: AthleteResultCardProps): React.JSX.Element {
  const { t }     = useTranslation();
  const { theme } = useTheme();

  return (
    <View style={styles.athleteCard}>
      {/* Top row : avatar + identity */}
      <View style={styles.athleteCardTopRow}>
        <View style={styles.avatarSquare}>
          <AppAvatar
            photoUrl={athlete.profilePhotoUrl}
            fullName={athlete.fullName || 'Athlète'}
            size="md"
          />
        </View>

        <View style={styles.athleteInfoSection}>
          <Text style={styles.athleteName}>{athlete.fullName}</Text>
          {/* Category will be shown once AthleteProfile collection is added */}
          <Text style={styles.athleteCategory}>Athlète</Text>

          <View style={styles.athleteMetaRow}>
            <View style={styles.athleteMetaItem}>
              <Text>🏋️</Text>
              <Text style={styles.athleteMetaText}>Street-Lifting</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Thin divider */}
      <View style={styles.cardDivider} />

      {/* Bottom row : contact button */}
      <View style={styles.bottomRow}>
        <View style={styles.bottomRowLeft} />
        <TouchableOpacity
          style={[styles.contactButton, isContacting && contactDisabledStyle]}
          activeOpacity={0.7}
          disabled={isContacting}
          onPress={() => void onContact(athlete)}
          accessibilityRole="button"
          accessibilityLabel={`${t('search.contactButton')} ${athlete.fullName}`}
          accessibilityState={{ disabled: isContacting }}
        >
          {isContacting
            ? <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
            : <Text style={styles.contactButtonLabel}>{t('search.contactButton')}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
});

const contactDisabledStyle = { opacity: 0.7 } as const;
