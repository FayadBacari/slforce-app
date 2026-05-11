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
import { useCoachSearch } from '@modules/search/presentation/hooks/use-coach-search.hook';
import type { CoachSearchResultEntity } from '@modules/search/domain/entities/coach-search-result.entity';
import { APP_ROUTES, pushRoute } from '@shared/navigation/app-routes';
import { createLogger } from '@shared/logger/logger';
import { buildAthleteSearchStyles } from '@screen-styles/athlete/search.styles';

const SEARCH_CATEGORIES = ['Tous', 'Street-Lifting', 'Endurance', 'Freestyle'] as const;
type SearchCategory = typeof SEARCH_CATEGORIES[number];

const logger = createLogger('AthleteSearch');

export default function AthleteSearchPage(): React.JSX.Element {
  const { t }         = useTranslation();
  const { theme }     = useTheme();
  const styles        = useMemo(() => buildAthleteSearchStyles(theme), [theme]);
  const currentUserId = useAuthenticationStore((s) => s.loggedInUser?.id ?? '');

  const { stats }                                = usePlatformStats();
  const { coaches, isLoading, hasError, reload } = useCoachSearch();

  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('Tous');
  const [openingConversationForCoachId, setOpeningConversationForCoachId] = useState<string | null>(null);

  // Filters coaches by text query AND selected discipline category.
  const visibleCoaches = useMemo(() => {
    let results = coaches;

    if (selectedCategory !== 'Tous') {
      results = results.filter((c) => c.disciplines.includes(selectedCategory));
    }

    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (trimmedQuery) {
      results = results.filter((c) => c.fullName.toLowerCase().includes(trimmedQuery));
    }

    return results;
  }, [coaches, searchQuery, selectedCategory]);

  const handleContactCoach = useCallback(async (coach: CoachSearchResultEntity): Promise<void> => {
    if (!currentUserId || openingConversationForCoachId) return;
    setOpeningConversationForCoachId(coach.id);
    try {
      const channel = await openOrCreateConversationBetweenTwoUsers(currentUserId, coach.id);

      if (!channel.id) throw new Error('channel id missing');

      pushRoute({
        pathname: APP_ROUTES.private.chatConversation,
        params: {
          'conversation-id': channel.id,
          participantName:   coach.fullName,
          participantPhoto:  coach.profilePhotoUrl ?? '',
        },
      });
    } catch (contactError) {
      logger.warn('Cannot open conversation with coach', contactError);
      Alert.alert(
        t('errors.network'),
        t('errors.unknown'),
        [{ text: t('common.confirm') }],
      );
    } finally {
      setOpeningConversationForCoachId(null);
    }
  }, [currentUserId, openingConversationForCoachId, t]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ─── Tall blue header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('search.coachSearchTitle')}</Text>
        <Text style={styles.headerSubtitle}>{t('search.coachSearchSubtitle')}</Text>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.searchCoachesPlaceholder')}
            placeholderTextColor={theme.colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel={t('search.searchCoachesPlaceholder')}
          />
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {SEARCH_CATEGORIES.map((category) => {
            const isActive = category === selectedCategory;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={category}
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 3 stats cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats ? String(stats.coachCount) : '—'}</Text>
            <Text style={styles.statLabel}>{t('search.statCoachCount')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>{t('search.statRating')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats ? String(stats.athleteCount) : '—'}</Text>
            <Text style={styles.statLabel}>{t('search.statAthleteCount')}</Text>
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
        {/* Loading skeleton */}
        {isLoading && coaches.length === 0 && (
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

        {/* Empty state — no coaches in DB yet */}
        {!isLoading && !hasError && visibleCoaches.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateEmoji}>🏋️</Text>
            <Text style={styles.emptyStateTitle}>{t('search.noCoachesFound')}</Text>
            <Text style={styles.emptyStateMessage}>
              {searchQuery.trim().length > 0
                ? t('common.noResults')
                : t('search.noCoachesFoundDesc')}
            </Text>
          </View>
        )}

        {/* Coach cards */}
        {!isLoading && !hasError && visibleCoaches.length > 0 && (
          <View style={styles.listContent}>
            {visibleCoaches.map((coach) => (
              <CoachResultCard
                key={coach.id}
                coach={coach}
                styles={styles}
                isContacting={openingConversationForCoachId === coach.id}
                onContact={handleContactCoach}
              />
            ))}
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Coach result card ──────────────────────────────────────────────────────
//
// `React.memo` est crucial : la search re-render à chaque keystroke. Sans memo,
// chaque card recréait toute son arborescence (avatar, badges, prix…) à chaque
// frappe — perceptible visuellement sur 50+ coaches.

interface CoachResultCardProps {
  coach:        CoachSearchResultEntity;
  styles:       ReturnType<typeof buildAthleteSearchStyles>;
  isContacting: boolean;
  onContact:    (coach: CoachSearchResultEntity) => Promise<void>;
}

const CoachResultCard = memo(function CoachResultCard({
  coach, styles, isContacting, onContact,
}: CoachResultCardProps): React.JSX.Element {
  const { t }     = useTranslation();
  const { theme } = useTheme();

  return (
    <View style={styles.coachCard}>

      {/* ── Top row : avatar + identity ── */}
      <View style={styles.coachCardTopRow}>
        <View style={styles.avatarSquare}>
          <AppAvatar
            photoUrl={coach.profilePhotoUrl}
            fullName={coach.fullName || 'Coach'}
            size="md"
          />
        </View>

        <View style={styles.coachInfoSection}>
          <Text style={styles.coachName}>{coach.fullName}</Text>
          <Text style={styles.coachSpeciality}>Coach certifié</Text>

          <View style={styles.coachMetaRow}>
            <View style={styles.coachMetaItem}>
              <Text>👥</Text>
              <Text style={styles.coachMetaText}>0 {t('search.statAthleteCount')}</Text>
            </View>
            <View style={styles.coachMetaItem}>
              <Text>⭐</Text>
              <Text style={styles.coachMetaText}>{t('common.seeAll')}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Description ── */}
      {coach.bio ? (
        <Text style={styles.coachDescription}>{coach.bio}</Text>
      ) : null}

      {/* ── Discipline badges ── */}
      {coach.disciplines.length > 0 && (
        <View style={styles.specialityBadgesRow}>
          {coach.disciplines.map((d) => (
            <View key={d} style={styles.specialityBadge}>
              <Text style={styles.specialityBadgeText}>{d}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Thin divider ── */}
      <View style={styles.cardDivider} />

      {/* ── Price row + contact button ── */}
      <View style={styles.priceRow}>
        <View style={styles.priceLeft}>
          <Text style={styles.priceCaption}>
            {coach.monthlyRate ? 'À partir de' : 'Tarif'}
          </Text>
          <View style={styles.priceValueRow}>
            {coach.monthlyRate ? (
              <>
                <Text style={styles.priceValue}>{coach.monthlyRate}</Text>
                <Text style={styles.priceUnit}>€{t('search.pricePerMonth')}</Text>
              </>
            ) : (
              <Text style={styles.priceValue}>Sur devis</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.contactButton, isContacting && contactDisabledStyle]}
          activeOpacity={0.7}
          disabled={isContacting}
          onPress={() => void onContact(coach)}
          accessibilityRole="button"
          accessibilityLabel={`${t('search.contactButton')} ${coach.fullName}`}
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

// Petit objet de style stable — référence partagée pour éviter de recréer
// `{ opacity: 0.7 }` à chaque render de CoachResultCard.
const contactDisabledStyle = { opacity: 0.7 } as const;
