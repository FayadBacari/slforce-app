import { StyleSheet, Platform } from 'react-native';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildChatScreenStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex:            1,
      backgroundColor: theme.colors.pageBackground,
    },
    keyboardAvoider: {
      flex: 1,
    },

    // ─── Top header (back button + avatar + name) ───────────────────────────
    headerBar: {
      flexDirection:     'row',
      alignItems:        'center',
      backgroundColor:   theme.colors.cardBackground,
      paddingHorizontal: 12,
      paddingVertical:   10,
      gap:               10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      ...Platform.select({
        ios: {
          shadowColor:   '#000',
          shadowOpacity: 0.05,
          shadowRadius:  4,
          shadowOffset:  { width: 0, height: 2 },
        },
        android: { elevation: 2 },
      }),
    },
    headerBackButton: {
      width:           36,
      height:          36,
      alignItems:      'center',
      justifyContent:  'center',
      borderRadius:    18,
    },
    headerBackArrow: {
      fontSize:   22,
      color:      theme.colors.brandPrimary,
      fontWeight: '700',
    },
    headerTitleColumn: {
      flex: 1,
      gap:  2,
    },
    headerParticipantName: {
      fontSize:   16,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    headerStatusText: {
      fontSize: 12,
      color:    theme.colors.textSecondary,
    },
    // ─── Three-dot menu button ──────────────────────────────────────────────
    headerMenuButton: {
      width:           36,
      height:          36,
      alignItems:      'center',
      justifyContent:  'center',
      borderRadius:    18,
    },
    headerMenuIcon: {
      fontSize:   22,
      color:      theme.colors.textPrimary,
      fontWeight: '700',
      lineHeight: 22,
    },

    // ─── Messages area ──────────────────────────────────────────────────────
    messagesContainer: {
      flex: 1,
    },
    inlineLoaderContainer: {
      paddingTop: 24,
      alignItems: 'center',
    },

    // ─── Error state ────────────────────────────────────────────────────────
    errorContainer: {
      flex:           1,
      alignItems:     'center',
      justifyContent: 'center',
      padding:        24,
      backgroundColor: theme.colors.pageBackground,
    },
  });
}
