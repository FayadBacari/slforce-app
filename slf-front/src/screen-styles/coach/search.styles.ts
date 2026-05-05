import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

// Pixel-perfect twin of the athlete search screen — same visual language,
// just used to find athletes instead of coaches.
export function buildCoachSearchStyles(theme: AppTheme) {
  const cardShadow = Platform.select({
    ios: {
      shadowColor:   '#000',
      shadowOpacity: 0.10,
      shadowRadius:  10,
      shadowOffset:  { width: 0, height: 4 },
    },
    android: { elevation: 3 },
  });

  return StyleSheet.create({
    safeArea: {
      flex:            1,
      backgroundColor: theme.colors.pageBackground,
    },

    // ─── Tall blue header (everything above the list) ───────────────────────
    header: {
      backgroundColor:         COLORS.brand.primary,
      borderBottomLeftRadius:  24,
      borderBottomRightRadius: 24,
      paddingHorizontal:       20,
      paddingTop:              16,
      paddingBottom:           20,
      gap:                     14,
      ...Platform.select({
        ios: {
          shadowColor:   '#000',
          shadowOpacity: 0.18,
          shadowRadius:  10,
          shadowOffset:  { width: 0, height: 4 },
        },
        android: { elevation: 5 },
      }),
    },
    headerTitle: {
      fontSize:   28,
      fontWeight: '900',
      color:      '#FFFFFF',
    },
    headerSubtitle: {
      fontSize:   14,
      fontWeight: '600',
      color:      '#DBEAFE',
      marginTop:  -6,
    },

    // ─── Search bar ─────────────────────────────────────────────────────────
    searchBar: {
      backgroundColor:   '#FFFFFF',
      borderRadius:      14,
      paddingHorizontal: 14,
      paddingVertical:   4,
      flexDirection:     'row',
      alignItems:        'center',
      gap:               10,
      ...Platform.select({
        ios: {
          shadowColor:   '#000',
          shadowOpacity: 0.10,
          shadowRadius:  4,
          shadowOffset:  { width: 0, height: 2 },
        },
        android: { elevation: 3 },
      }),
    },
    searchIcon: {
      fontSize: 16,
    },
    searchInput: {
      flex:            1,
      fontSize:        15,
      fontWeight:      '500',
      color:           '#1F2937',
      paddingVertical: 10,
    },

    // ─── Stats row (3 white cards inside the blue header) ───────────────────
    statsRow: {
      flexDirection: 'row',
      gap:           10,
      marginTop:     2,
    },
    statCard: {
      flex:            1,
      backgroundColor: '#FFFFFF',
      borderRadius:    14,
      paddingVertical: 12,
      alignItems:      'center',
      gap:             2,
    },
    statValue: {
      fontSize:   22,
      fontWeight: '900',
      color:      '#0F172A',
    },
    statLabel: {
      fontSize:   12,
      fontWeight: '500',
      color:      '#6B7280',
    },

    // ─── Result list ────────────────────────────────────────────────────────
    listContent: {
      paddingHorizontal: 16,
      paddingTop:        16,
      paddingBottom:     32,
      gap:               14,
    },

    // ─── Athlete result card ────────────────────────────────────────────────
    athleteCard: {
      backgroundColor: '#FFFFFF',
      borderRadius:    20,
      padding:         16,
      gap:             12,
      ...cardShadow,
    },
    athleteCardTopRow: {
      flexDirection: 'row',
      alignItems:    'flex-start',
      gap:           14,
    },
    avatarSquare: {
      width:        62,
      height:       62,
      borderRadius: 16,
      borderWidth:  2.5,
      borderColor:  COLORS.brand.primary,
      alignItems:   'center',
      justifyContent: 'center',
      overflow:     'hidden',
    },
    avatarSquareImage: {
      width:        58,
      height:       58,
      borderRadius: 12,
    },
    athleteInfoSection: {
      flex: 1,
      gap:  3,
    },
    athleteName: {
      fontSize:   18,
      fontWeight: '900',
      color:      theme.colors.textPrimary,
    },
    athleteCategory: {
      fontSize:   14,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    athleteMetaRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           14,
      marginTop:     4,
    },
    athleteMetaItem: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           4,
    },
    athleteMetaText: {
      fontSize:   13,
      fontWeight: '600',
      color:      '#6B7280',
    },

    cardDivider: {
      height:          1,
      backgroundColor: '#E5E7EB',
      marginTop:       4,
    },

    bottomRow: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
    },
    bottomRowLeft: {
      gap: 0,
    },
    bottomRowCaption: {
      fontSize: 12,
      color:    '#6B7280',
    },
    bottomRowMain: {
      fontSize:   16,
      fontWeight: '800',
      color:      theme.colors.textPrimary,
    },
    contactButton: {
      backgroundColor:   COLORS.brand.primary,
      paddingHorizontal: 22,
      paddingVertical:   12,
      borderRadius:      9999,
    },
    contactButtonLabel: {
      color:      '#FFFFFF',
      fontSize:   14,
      fontWeight: '700',
    },

    // ─── Empty state ────────────────────────────────────────────────────────
    emptyStateContainer: {
      alignItems:        'center',
      justifyContent:    'center',
      paddingTop:         60,
      paddingHorizontal:  32,
      gap:                12,
    },
    emptyStateEmoji: {
      fontSize: 48,
    },
    emptyStateTitle: {
      fontSize:   17,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
      textAlign:  'center',
    },
    emptyStateMessage: {
      fontSize:   13,
      color:      theme.colors.textSecondary,
      textAlign:  'center',
      lineHeight: 20,
    },
  });
}
