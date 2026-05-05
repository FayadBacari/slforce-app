import { StyleSheet } from 'react-native';
import type { AppTheme } from '@shared/theme/theme.types';

// Pixel-perfect single conversation row (matches the legacy "Messages" screen).
// Layout left-to-right: avatar (50px circular) + (name + last message stacked) + date column.
export function buildConversationListItemStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flexDirection:     'row',
      alignItems:        'center',
      paddingVertical:   12,
      paddingHorizontal: 16,
      gap:               12,
      backgroundColor:   theme.colors.cardBackground,
    },

    // ─── Middle column (name + preview message) ─────────────────────────────
    textContent: {
      flex: 1,
      gap:  2,
    },
    participantName: {
      fontSize:   16,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    lastMessagePreview: {
      fontSize: 14,
      color:    theme.colors.textSecondary,
    },
    unreadText: {
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },

    // Inline preview row (icon + text) — used when the last message is a photo
    previewWithIconRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           6,
    },
    previewIcon: {
      fontSize: 14,
    },

    // ─── Right column (date + optional unread badge) ────────────────────────
    rightColumn: {
      alignItems: 'flex-end',
      gap:        6,
    },
    timeText: {
      fontSize: 13,
      color:    theme.colors.textSecondary,
    },
    unreadBadge: {
      backgroundColor:   theme.colors.brandPrimary,
      borderRadius:      9999,
      minWidth:          20,
      height:            20,
      paddingHorizontal: 6,
      alignItems:        'center',
      justifyContent:    'center',
    },
    unreadCount: {
      fontSize:   11,
      color:      '#FFFFFF',
      fontWeight: '800',
    },
  });
}
