import React, { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@shared/theme/theme-provider';
import { AppAvatar } from '@shared/components/app-avatar/app-avatar';
import { useAuthenticationStore } from '@stores/authentication-store';
import { openOrCreateConversationBetweenTwoUsers } from '@core/stream-chat/stream-chat-client';
import { usePlatformStats } from '@modules/search/presentation/hooks/use-platform-stats.hook';
import { useCoachSearch } from '@modules/search/presentation/hooks/use-coach-search.hook';
import type { CoachSearchResultEntity } from '@modules/search/domain/entities/coach-search-result.entity';
import { buildAthleteSearchStyles } from '@screen-styles/athlete/search.styles';

const SEARCH_CATEGORIES = ['Tous', 'Street-Lifting', 'Endurance', 'Freestyle'] as const;
type SearchCategory = typeof SEARCH_CATEGORIES[number];

export default function AthleteSearchPage() {
  const { theme }     = useTheme();
  const router        = useRouter();
  const styles        = buildAthleteSearchStyles(theme);
  const currentUserId = useAuthenticationStore((s) => s.loggedInUser?.id ?? '');

  const { stats }                        = usePlatformStats();
  const { coaches, isLoading, hasError, reload } = useCoachSearch();

  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('Tous');
  const [openingConversationForCoachId, setOpeningConversationForCoachId] = useState<string | null>(null);

  // Filters coaches by text query AND selected discipline category.
  const visibleCoaches = useMemo(() => {
    let results = coaches;

    // Category filter — 'Tous' shows everything
    if (selectedCategory !== 'Tous') {
      results = results.filter((c) => c.disciplines.includes(selectedCategory));
    }

    // Name search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      results = results.filter((c) => c.fullName.toLowerCase().includes(q));
    }

    return results;
  }, [coaches, searchQuery, selectedCategory]);

  const handleContactCoach = useCallback(async (coach: CoachSearchResultEntity) => {
    if (!currentUserId || openingConversationForCoachId) return;
    setOpeningConversationForCoachId(coach.id);
    try {
      const channel = await openOrCreateConversationBetweenTwoUsers(currentUserId, coach.id);

      if (!channel.id) throw new Error('channel id missing');

      router.push({
        pathname: '/(private)/chat/[conversation-id]' as never,
        params: {
          'conversation-id': channel.id,
          participantName:   coach.fullName,
          participantPhoto:  coach.profilePhotoUrl ?? '',
        },
      } as never);
    } catch {
      Alert.alert(
        'Connexion impossible',
        'Impossible d\'ouvrir la conversation. Vérifie ta connexion et réessaie.',
        [{ text: 'OK' }],
      );
    } finally {
      setOpeningConversationForCoachId(null);
    }
  }, [currentUserId, openingConversationForCoachId, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ─── Tall blue header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trouve ton Coach</Text>
        <Text style={styles.headerSubtitle}>Les meilleurs coachs de France 🇫🇷</Text>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un coach..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
        >
          {SEARCH_CATEGORIES.map((category) => {
            const isActive = category === selectedCategory;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}
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
            <Text style={styles.statLabel}>Coachs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Note moy.</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats ? String(stats.athleteCount) : '—'}</Text>
            <Text style={styles.statLabel}>Athlètes</Text>
          </View>
        </View>
      </View>

      {/* ─── Result list ─────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={reload} />
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
            <Text style={styles.emptyStateTitle}>Erreur de chargement</Text>
            <Text style={styles.emptyStateMessage}>
              Impossible de charger les coachs. Tire vers le bas pour réessayer.
            </Text>
          </View>
        )}

        {/* Empty state — no coaches in DB yet */}
        {!isLoading && !hasError && visibleCoaches.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateEmoji}>🏋️</Text>
            <Text style={styles.emptyStateTitle}>
              {searchQuery.trim().length > 0
                ? 'Aucun coach trouvé'
                : 'Aucun coach inscrit'}
            </Text>
            <Text style={styles.emptyStateMessage}>
              {searchQuery.trim().length > 0
                ? 'Essaie une autre recherche.'
                : 'Les coachs apparaîtront ici dès qu\'ils créent un compte.'}
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
function CoachResultCard({
  coach,
  styles,
  isContacting,
  onContact,
}: {
  coach:        CoachSearchResultEntity;
  styles:       ReturnType<typeof buildAthleteSearchStyles>;
  isContacting: boolean;
  onContact:    (coach: CoachSearchResultEntity) => Promise<void>;
}) {
  return (
    <View style={styles.coachCard}>

      {/* ── Top row : avatar + identity ── */}
      <View style={styles.coachCardTopRow}>
        <View style={styles.avatarSquare}>
          <AppAvatar
            photoUrl={coach.profilePhotoUrl}
            fullName={coach.fullName}
            size="md"
          />
        </View>

        <View style={styles.coachInfoSection}>
          <Text style={styles.coachName}>{coach.fullName}</Text>
          <Text style={styles.coachSpeciality}>Coach certifié</Text>

          <View style={styles.coachMetaRow}>
            <View style={styles.coachMetaItem}>
              <Text>👥</Text>
              <Text style={styles.coachMetaText}>0 athlètes</Text>
            </View>
            <View style={styles.coachMetaItem}>
              <Text>⭐</Text>
              <Text style={styles.coachMetaText}>Nouveau</Text>
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
                <Text style={styles.priceUnit}>€/mois</Text>
              </>
            ) : (
              <Text style={styles.priceValue}>Sur devis</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.contactButton, isContacting && { opacity: 0.7 }]}
          activeOpacity={0.7}
          disabled={isContacting}
          onPress={() => void onContact(coach)}
        >
          {isContacting
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={styles.contactButtonLabel}>Contacter</Text>
          }
        </TouchableOpacity>
      </View>

    </View>
  );
}
