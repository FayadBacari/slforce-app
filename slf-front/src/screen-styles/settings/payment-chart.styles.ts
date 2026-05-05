import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

// Styles for the PaymentChart screen (coach only — monthly revenue + transactions).
export function buildPaymentChartStyles(theme: AppTheme) {
  const shadow = Platform.select({
    ios: {
      shadowColor:   COLORS.brand.primaryDark,
      shadowOpacity: 0.06,
      shadowRadius:  8,
      shadowOffset:  { width: 0, height: 2 },
    },
    android: { elevation: 2 },
  });

  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical:   24,
      gap:               16,
    },

    // ── Stats grid ──────────────────────────────────────────────────────────────
    statsGrid: {
      flexDirection: 'row',
      gap:           12,
    },
    statCard: {
      flex:           1,
      borderRadius:   16,
      padding:        16,
      alignItems:     'center',
      gap:            6,
      ...shadow,
    },
    statCardPrimary: {
      backgroundColor: theme.colors.brandPrimary + '18',
    },
    statCardSuccess: {
      backgroundColor: theme.colors.success + '18',
    },
    statLabel: {
      fontSize:   12,
      color:      theme.colors.textSecondary,
      textAlign:  'center',
      fontWeight: '500',
    },
    statValue: {
      fontSize:   20,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },

    // ── Chart card ──────────────────────────────────────────────────────────────
    chartCard: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius:    16,
      padding:         16,
      gap:             8,
      ...shadow,
    },
    chartCardHeader: {
      flexDirection:  'row',
      alignItems:     'center',
      gap:            8,
      marginBottom:   4,
    },
    chartCardTitle: {
      fontSize:   16,
      fontWeight: '600',
      color:      theme.colors.textPrimary,
    },
    chartLegendRow: {
      flexDirection:  'row',
      alignItems:     'center',
      gap:            6,
      marginTop:      4,
    },
    chartLegendDot: {
      width:        10,
      height:       10,
      borderRadius: 5,
      backgroundColor: theme.colors.brandPrimary,
    },
    chartLegendLabel: {
      fontSize: 12,
      color:    theme.colors.textSecondary,
    },

    // ── Transactions card ────────────────────────────────────────────────────────
    transactionsCard: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius:    16,
      padding:         16,
      gap:             12,
      ...shadow,
    },
    transactionsCardHeader: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
    },
    transactionsCardTitleRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           8,
    },
    transactionsCardTitle: {
      fontSize:   16,
      fontWeight: '600',
      color:      theme.colors.textPrimary,
    },
    transactionsBadge: {
      backgroundColor:   theme.colors.brandPrimary + '22',
      borderRadius:      12,
      paddingHorizontal: 8,
      paddingVertical:   2,
    },
    transactionsBadgeText: {
      fontSize:   12,
      fontWeight: '700',
      color:      theme.colors.brandPrimary,
    },
    transactionItem: {
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    transactionItemLeft: {
      gap: 2,
      flex: 1,
    },
    transactionItemName: {
      fontSize:   14,
      fontWeight: '600',
      color:      theme.colors.textPrimary,
    },
    transactionItemDate: {
      fontSize: 12,
      color:    theme.colors.textSecondary,
    },
    transactionItemRight: {
      alignItems: 'flex-end',
      gap:        4,
    },
    transactionItemAmount: {
      fontSize:   15,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    statusBadge: {
      borderRadius:      9999,
      paddingVertical:   2,
      paddingHorizontal: 8,
    },
    statusBadgeText: {
      fontSize:   11,
      fontWeight: '600',
    },

    // ── Empty state ──────────────────────────────────────────────────────────────
    emptyState: {
      paddingVertical: 32,
      alignItems:      'center',
    },
    emptyStateText: {
      fontSize: 15,
      color:    theme.colors.textSecondary,
    },

    // ── Info box ─────────────────────────────────────────────────────────────────
    infoBox: {
      backgroundColor: theme.colors.brandPrimary + '12',
      borderRadius:    12,
      padding:         14,
      flexDirection:   'row',
      alignItems:      'flex-start',
      gap:             10,
    },
    infoBoxIcon: {
      fontSize: 20,
    },
    infoBoxContent: {
      flex: 1,
      gap:  4,
    },
    infoBoxTitle: {
      fontSize:   13,
      fontWeight: '600',
      color:      theme.colors.textPrimary,
    },
    infoBoxText: {
      fontSize:   12,
      color:      theme.colors.textSecondary,
      lineHeight: 18,
    },
  });
}
