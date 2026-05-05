import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

// Styles for the BankAccountPage — Stripe Connect onboarding UI.
export function buildBankAccountStyles(theme: AppTheme) {
  const card = {
    backgroundColor: theme.colors.cardBackground,
    borderRadius:    20,
    padding:         20,
    ...Platform.select({
      ios: {
        shadowColor:   COLORS.brand.primaryDark,
        shadowOpacity: 0.08,
        shadowRadius:  12,
        shadowOffset:  { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  };

  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical:   28,
      gap:               20,
    },

    // ── Hero card (not connected state) ───────────────────────────────────────
    heroCard: {
      ...card,
      alignItems: 'center',
      gap:        16,
      paddingVertical: 32,
    },
    heroIconWrapper: {
      width:           72,
      height:          72,
      borderRadius:    36,
      backgroundColor: theme.colors.brandPrimary + '18',
      alignItems:      'center',
      justifyContent:  'center',
    },
    heroIcon: {
      fontSize: 32,
    },
    heroTitle: {
      fontSize:   22,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
      textAlign:  'center',
    },
    heroSubtitle: {
      fontSize:   14,
      color:      theme.colors.textSecondary,
      textAlign:  'center',
      lineHeight: 22,
      maxWidth:   280,
    },

    // ── Feature list (inside hero card) ──────────────────────────────────────
    featureList: {
      gap:       10,
      width:     '100%',
      marginTop: 4,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           10,
    },
    featureCheck: {
      width:           24,
      height:          24,
      borderRadius:    12,
      backgroundColor: COLORS.semantic.success + '20',
      alignItems:      'center',
      justifyContent:  'center',
    },
    featureCheckIcon: {
      fontSize: 12,
    },
    featureText: {
      fontSize: 14,
      color:    theme.colors.textSecondary,
      flex:     1,
    },

    // ── Warning card (onboarding incomplete) ─────────────────────────────────
    warningCard: {
      ...card,
      borderWidth:  1.5,
      borderColor:  COLORS.semantic.warning + '60',
      flexDirection: 'row',
      alignItems:    'flex-start',
      gap:           12,
    },
    warningIconWrapper: {
      width:           40,
      height:          40,
      borderRadius:    20,
      backgroundColor: COLORS.semantic.warning + '20',
      alignItems:      'center',
      justifyContent:  'center',
      flexShrink:      0,
    },
    warningIcon: {
      fontSize: 18,
    },
    warningContent: {
      flex: 1,
      gap:  4,
    },
    warningTitle: {
      fontSize:   15,
      fontWeight: '600',
      color:      theme.colors.textPrimary,
    },
    warningText: {
      fontSize:   13,
      color:      theme.colors.textSecondary,
      lineHeight: 20,
    },

    // ── Success / connected card ──────────────────────────────────────────────
    connectedCard: {
      ...card,
      borderWidth: 1.5,
      borderColor: COLORS.semantic.success + '50',
      gap:         16,
    },
    connectedCardHeader: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           12,
    },
    connectedBadge: {
      width:           44,
      height:          44,
      borderRadius:    22,
      backgroundColor: COLORS.semantic.success + '20',
      alignItems:      'center',
      justifyContent:  'center',
    },
    connectedBadgeIcon: {
      fontSize: 20,
    },
    connectedCardTitleBlock: {
      flex: 1,
      gap:  2,
    },
    connectedTitle: {
      fontSize:   16,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    connectedEmail: {
      fontSize: 13,
      color:    theme.colors.textSecondary,
    },
    connectedDivider: {
      height:          1,
      backgroundColor: theme.colors.divider,
    },

    // ── Status pill row ───────────────────────────────────────────────────────
    statusPillRow: {
      flexDirection: 'row',
      gap:           8,
    },
    statusPill: {
      flexDirection:     'row',
      alignItems:        'center',
      gap:               5,
      paddingHorizontal: 10,
      paddingVertical:   5,
      borderRadius:      20,
    },
    statusPillDot: {
      width:        7,
      height:       7,
      borderRadius: 4,
    },
    statusPillText: {
      fontSize:   12,
      fontWeight: '600',
    },

    // ── Stripe logo row ───────────────────────────────────────────────────────
    stripeLogoRow: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            6,
      marginTop:      4,
    },
    stripePoweredText: {
      fontSize: 11,
      color:    theme.colors.textSecondary,
    },
    stripeBrandText: {
      fontSize:   13,
      fontWeight: '700',
      color:      theme.isDark ? '#a78bfa' : '#635bff',
      letterSpacing: 0.3,
    },

    // ── Info box ─────────────────────────────────────────────────────────────
    infoBox: {
      backgroundColor: theme.colors.brandPrimary + '12',
      borderRadius:    12,
      padding:         14,
      flexDirection:   'row',
      alignItems:      'flex-start',
      gap:             10,
    },
    infoBoxIcon: {
      fontSize: 18,
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

    // ── Disconnect button ─────────────────────────────────────────────────────
    disconnectButton: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'center',
      gap:               6,
      paddingVertical:   12,
      paddingHorizontal: 16,
      borderRadius:      12,
      borderWidth:       1,
      borderColor:       theme.colors.danger + '40',
    },
    disconnectButtonText: {
      fontSize:   14,
      fontWeight: '600',
      color:      theme.colors.danger,
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
      fontSize:  15,
      color:     theme.colors.danger,
      textAlign: 'center',
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
  });
}
