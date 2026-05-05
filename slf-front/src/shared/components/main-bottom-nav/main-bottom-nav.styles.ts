import { StyleSheet, Platform } from 'react-native';
import type { AppTheme } from '@shared/theme/theme.types';

// Visual reference: the screenshot of the legacy app's bottom nav.
// Key details copied as-is:
//   • Tab bar background = white card with subtle top border
//   • Active tab: light-blue rounded pill BEHIND the icon only (not the label)
//   • Active label: bold black; inactive: medium grey
//   • Icons are square images (28×28) shown at full opacity when active,
//     dimmed slightly when inactive
export function buildMainBottomNavStyles(theme: AppTheme, bottomSafeAreaInset: number) {
  const pillActiveBackground = theme.isDark
    ? 'rgba(96,165,250,0.20)'   // soft blue glow on dark
    : '#DBEAFE';                // pale blue (#DBEAFE matches the legacy screenshot)

  return StyleSheet.create({
    navContainer: {
      backgroundColor:   theme.colors.tabBarBackground,
      borderTopWidth:    1,
      borderTopColor:    theme.colors.divider,
      paddingTop:        8,
      paddingHorizontal: 8,
      paddingBottom:     Platform.OS === 'ios' ? bottomSafeAreaInset : 8,
    },
    tabsRow: {
      flexDirection:  'row',
      alignItems:     'flex-end',
      justifyContent: 'space-around',
    },
    tabButton: {
      flex:           1,
      alignItems:     'center',
      paddingVertical: 6,
      gap:             4,
    },

    // ─── Icon pill (rounded rectangle behind the icon) ──────────────────────
    iconPill: {
      width:           48,
      height:          40,
      borderRadius:    14,
      alignItems:      'center',
      justifyContent:  'center',
      backgroundColor: 'transparent',
    },
    iconPillActive: {
      backgroundColor: pillActiveBackground,
    },

    // ─── Icon (square image rendered with cover so JPGs fill nicely) ────────
    tabIcon: {
      width:        26,
      height:       26,
      borderRadius: 6,
    },
    tabIconInactive: {
      opacity: 0.55,
    },

    // ─── Label below the icon ───────────────────────────────────────────────
    tabLabel: {
      fontSize:   12,
      fontWeight: '500',
      color:      theme.isDark ? '#9CA3AF' : '#6B7280',   // grey when inactive
    },
    tabLabelActive: {
      fontWeight: '700',
      color:      theme.isDark ? '#FFFFFF' : '#0F172A',    // black when active
    },

    // ─── Unread badge (red dot in the top-right corner of the icon pill) ───
    // Wraps the iconPill so the badge can be positioned absolutely.
    iconPillWrapper: {
      position: 'relative',
    },
    unreadBadge: {
      position:        'absolute',
      top:             -2,
      right:           -2,
      minWidth:        18,
      height:          18,
      borderRadius:    9,
      backgroundColor: '#EF4444',   // red-500
      alignItems:      'center',
      justifyContent:  'center',
      paddingHorizontal: 4,
      // White border so the badge doesn't bleed into the icon
      borderWidth:     1.5,
      borderColor:     theme.colors.tabBarBackground,
      zIndex:          10,
    },
    unreadBadgeText: {
      color:      '#FFFFFF',
      fontSize:   10,
      fontWeight: '700',
      lineHeight: 14,
    },
  });
}
