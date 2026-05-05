import { StyleSheet, Platform } from 'react-native';
import type { AppTheme } from '@shared/theme/theme.types';

// Pixel-perfect reproduction of the legacy "Messages" screen.
// Layout:
//   • No blue header (unlike most screens)
//   • A wide white search bar at the top
//   • Then a flat scrollable list of conversation rows separated by a thin
//     full-width grey divider
export function buildConversationListScreenStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex:            1,
      backgroundColor: theme.colors.pageBackground,
    },

    // ─── Search bar (fills the screen width with margins) ───────────────────
    searchBarContainer: {
      paddingHorizontal: 16,
      paddingTop:        12,
      paddingBottom:     8,
    },
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
          shadowOpacity: 0.06,
          shadowRadius:  4,
          shadowOffset:  { width: 0, height: 1 },
        },
        android: { elevation: 2 },
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

    // ─── List ────────────────────────────────────────────────────────────────
    listContentContainer: {
      paddingBottom: 32,
    },
    separator: {
      height:          1,
      backgroundColor: theme.colors.divider,
      marginLeft:      78,             // align after the avatar column (16 + 50 + 12)
    },

    // ─── Empty state ─────────────────────────────────────────────────────────
    emptyStateContainer: {
      flex:           1,
      alignItems:     'center',
      justifyContent: 'center',
      paddingTop:     80,
      gap:            8,
    },
    emptyStateEmoji: {
      fontSize: 40,
    },
    emptyStateTitle: {
      fontSize:   18,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
      textAlign:  'center',
    },
    emptyStateSubtitle: {
      fontSize:   14,
      color:      theme.colors.textSecondary,
      textAlign:  'center',
      lineHeight: 20,
    },
  });
}
