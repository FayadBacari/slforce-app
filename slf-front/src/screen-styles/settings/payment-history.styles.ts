import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildPaymentHistoryStyles(theme: AppTheme) {
  return StyleSheet.create({
    // ── Stats grid ────────────────────────────────────────────────────────────
    statsGrid: {
      flexDirection:   'row',
      gap:             12,
      marginBottom:    4,
    },
    statCard: {
      flex:           1,
      borderRadius:   16,
      padding:        16,
      alignItems:     'center',
      gap:            6,
      ...Platform.select({
        ios: {
          shadowColor:   COLORS.brand.primaryDark,
          shadowOpacity: 0.06,
          shadowRadius:  8,
          shadowOffset:  { width: 0, height: 2 },
        },
        android: { elevation: 1 },
      }),
    },
    statLabel: {
      fontSize:   12,
      color:      theme.colors.textSecondary,
      textAlign:  'center',
      fontWeight: '500',
    },
    statValue: {
      fontSize:   18,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },

    // ── Centered states (loading / error) ─────────────────────────────────────
    centeredState: {
      flex:           1,
      alignItems:     'center',
      justifyContent: 'center',
      paddingTop:     80,
      gap:            12,
    },
    centeredStateText: {
      fontSize: 15,
      color:    theme.colors.textSecondary,
    },
    errorText: {
      fontSize:   15,
      color:      theme.colors.danger,
      textAlign:  'center',
    },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical:   10,
      backgroundColor:   theme.colors.brandPrimary,
      borderRadius:      10,
    },
    retryButtonText: {
      color:      '#fff',
      fontWeight: '600',
      fontSize:   14,
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical:   24,
      gap:               12,
    },
    paymentsList: {
      gap: 12,
    },
    paymentCard: {
      backgroundColor:  theme.colors.cardBackground,
      borderRadius:     16,
      padding:          16,
      flexDirection:    'row',
      alignItems:       'center',
      justifyContent:   'space-between',
      ...Platform.select({
        ios: {
          shadowColor:   COLORS.brand.primaryDark,
          shadowOpacity: 0.06,
          shadowRadius:  8,
          shadowOffset:  { width: 0, height: 2 },
        },
        android: { elevation: 1 },
      }),
    },
    paymentCardLeft: {
      gap: 4,
    },
    paymentPartyName: {
      fontSize:   16,
      fontWeight: '600',
      color:      theme.colors.textPrimary,
    },
    paymentDate: {
      fontSize: 12,
      color:    theme.colors.textSecondary,
    },
    paymentDescription: {
      fontSize: 12,
      color:    theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    paymentCardRight: {
      alignItems: 'flex-end',
      gap:        4,
    },
    paymentAmount: {
      fontSize:   16,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    statusBadge: {
      borderRadius:      9999,
      paddingVertical:   2,
      paddingHorizontal: 8,
    },
    statusLabel: {
      fontSize:   12,
      fontWeight: '600',
    },
    emptyState: {
      flex:           1,
      alignItems:     'center',
      justifyContent: 'center',
      paddingTop:     80,
    },
    emptyStateText: {
      fontSize: 16,
      color:    theme.colors.textSecondary,
    },
  });
}
