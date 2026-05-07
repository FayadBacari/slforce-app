import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

// Pixel-perfect reproduction of the legacy slf-frontend "Trouve ton Coach" screen.
// Visual structure:
//   • Tall blue header that contains EVERYTHING above the result list:
//       title + subtitle + search bar + category chips + 3 stat cards
//   • White result cards below, each with avatar (square blue) + name +
//     speciality + meta + description + badge + price row + Contacter button
export function buildAthleteSearchStyles(theme: AppTheme) {
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
      backgroundColor:         COLORS.brand.primary,    // #3B82F6
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

    // ─── Search bar (white pill, inside the header) ─────────────────────────
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

    // ─── Category chips row (horizontal scroll) ─────────────────────────────
    chipsScrollContent: {
      paddingHorizontal: 0,
      gap:               8,
      flexDirection:     'row',
    },
    chip: {
      backgroundColor:   'rgba(255,255,255,0.22)',
      paddingHorizontal: 16,
      paddingVertical:   9,
      borderRadius:      9999,
    },
    chipActive: {
      backgroundColor: '#1E3A8A',                 // deep indigo for the selected chip
    },
    chipLabel: {
      fontSize:   13,
      fontWeight: '700',
      color:      '#FFFFFF',
    },
    chipLabelActive: {
      color: '#FFFFFF',
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

    // ─── Coach result card ──────────────────────────────────────────────────
    coachCard: {
      backgroundColor: theme.colors.cardBackground,   // adapts to dark/light mode
      borderRadius:    20,
      padding:         16,
      gap:             12,
      ...cardShadow,
    },
    coachCardTopRow: {
      flexDirection: 'row',
      alignItems:    'flex-start',
      gap:           14,
    },

    // Square avatar — the image fills the container exactly, the blue appears
    // as a border ring that follows the same rounded-square shape as the photo.
    avatarSquare: {
      width:           58,
      height:          58,
      borderRadius:    14,
      borderWidth:     2.5,
      borderColor:     COLORS.brand.primary,
      overflow:        'hidden',
      alignItems:      'center',
      justifyContent:  'center',
    },
    avatarSquareImage: {
      width:        58,
      height:       58,
      borderRadius: 12,   // slightly less than the container so the border shows cleanly
    },

    coachInfoSection: {
      flex: 1,
      gap:  3,
    },
    coachName: {
      fontSize:   18,
      fontWeight: '900',
      color:      theme.colors.textPrimary,
    },
    coachSpeciality: {
      fontSize:   14,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    coachMetaRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           14,
      marginTop:     4,
    },
    coachMetaItem: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           4,
    },
    coachMetaText: {
      fontSize:   13,
      fontWeight: '600',
      color:      '#6B7280',
    },

    // Description line (under the top row)
    coachDescription: {
      fontSize: 13,
      color:    '#6B7280',
    },

    // Row that holds all speciality badge pills side by side
    specialityBadgesRow: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           8,
    },
    // Individual speciality badge pill
    specialityBadge: {
      alignSelf:         'flex-start',
      backgroundColor:   '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical:   6,
      borderRadius:      9999,
    },
    specialityBadgeText: {
      fontSize:   12,
      fontWeight: '700',
      color:      '#374151',
    },

    // Thin divider before the price row
    cardDivider: {
      height:          1,
      backgroundColor: '#E5E7EB',
      marginTop:       4,
    },

    // Price + contact button row at the bottom
    priceRow: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
    },
    priceLeft: {
      gap: 0,
    },
    priceCaption: {
      fontSize: 12,
      color:    '#6B7280',
    },
    priceValueRow: {
      flexDirection: 'row',
      alignItems:    'baseline',
      gap:           4,
    },
    priceValue: {
      fontSize:   20,
      fontWeight: '900',
      color:      theme.colors.textPrimary,
    },
    priceUnit: {
      fontSize: 13,
      color:    '#6B7280',
      fontWeight: '500',
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
