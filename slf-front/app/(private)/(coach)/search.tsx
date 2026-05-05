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
import { useAthleteSearch } from '@modules/search/presentation/hooks/use-athlete-search.hook';
import type { AthleteSearchResultEntity } from '@modules/search/domain/entities/athlete-search-result.entity';
import { buildCoachSearchStyles } from '@screen-styles/coach/search.styles';

export default function CoachSearchPage() {
  const { theme }     = useTheme();
  const router        = useRouter();
  const styles        = buildCoachSearchStyles(theme);
  const currentUserId = useAuthenticationStore((s) => s.loggedInUser?.id ?? '');

  const { stats }                          = usePlatformStats();
  const { athletes, isLoading, hasError, reload } = useAthleteSearch();

  const [searchQuery, setSearchQuery] = useState('');
  const [openingConversationForAthleteId, setOpeningConversationForAthleteId] = useState<string | null>(null);

  // Local search filter — name only
  const visibleAthletes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return athletes;
    return athletes.filter((a) =>
      a.fullName.toLowerCase().includes(q),
    );
  }, [athletes, searchQuery]);

  const handleContactAthlete = useCallback(async (athlete: AthleteSearchResultEntity) => {
    if (!currentUserId || openingConversationForAthleteId) return;
    setOpeningConversationForAthleteId(athlete.id);
    try {
      const channel = await openOrCreateConversationBetweenTwoUsers(currentUserId, athlete.id);

      if (!channel.id) throw new Error('channel id missing');

      router.push({
        pathname: '/(private)/chat/[conversation-id]' as never,
        params: {
          'conversation-id': channel.id,
          participantName:   athlete.fullName,
          participantPhoto:  athlete.profilePhotoUrl ?? '',
        },
      } as never);
    } catch {
      Alert.alert(
        'Connexion impossible',
        'Impossible d\'ouvrir la conversation. Vérifie ta connexion et réessaie.',
        [{ text: 'OK' }],
      );
    } finally {
      setOpeningConversationForAthleteId(null);
    }
  }, [currentUserId, openingConversationForAthleteId, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ─── Tall blue header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trouve ton Athlète</Text>
        <Text style={styles.headerSubtitle}>Les meilleurs athlètes à coacher 🇫🇷</Text>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un athlète..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {/* 3 stats cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats ? String(stats.athleteCount) : '—'}</Text>
            <Text style={styles.statLabel}>Athlètes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Note moy.</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats ? String(stats.coachCount) : '—'}</Text>
            <Text style={styles.statLabel}>Coachs</Text>
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
            <Text style={styles.emptyStateTitle}>Erreur de chargement</Text>
            <Text style={styles.emptyStateMessage}>
              Impossible de charger les athlètes. Tire vers le bas pour réessayer.
            </Text>
          </View>
        )}

        {/* Empty state */}
        {!isLoading && !hasError && visibleAthletes.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateEmoji}>🏃</Text>
            <Text style={styles.emptyStateTitle}>
              {searchQuery.trim().length > 0
                ? 'Aucun athlète trouvé'
                : 'Aucun athlète inscrit'}
            </Text>
            <Text style={styles.emptyStateMessage}>
              {searchQuery.trim().length > 0
                ? 'Essaie une autre recherche.'
                : 'Les athlètes apparaîtront ici dès qu\'ils créent un compte.'}
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
function AthleteResultCard({
  athlete,
  styles,
  isContacting,
  onContact,
}: {
  athlete:      AthleteSearchResultEntity;
  styles:       ReturnType<typeof buildCoachSearchStyles>;
  isContacting: boolean;
  onContact:    (athlete: AthleteSearchResultEntity) => Promise<void>;
}) {
  return (
    <View style={styles.athleteCard}>
      {/* Top row : avatar + identity */}
      <View style={styles.athleteCardTopRow}>
        <View style={styles.avatarSquare}>
          <AppAvatar
            photoUrl={athlete.profilePhotoUrl}
            fullName={athlete.fullName}
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
          style={[styles.contactButton, isContacting && { opacity: 0.7 }]}
          activeOpacity={0.7}
          disabled={isContacting}
          onPress={() => void onContact(athlete)}
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
