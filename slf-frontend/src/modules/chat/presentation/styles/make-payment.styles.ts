// Styles for the MakePaymentScreen.
// Convention: screens inside src/modules/*  → styles in src/modules/*/presentation/styles/
//             screens inside app/ (Expo Router) → styles in src/screen-styles/
import { StyleSheet } from 'react-native';
import type { AppTheme } from '@shared/theme/theme-provider';

export function buildMakePaymentStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex:            1,
      backgroundColor: theme.colors.pageBackground,
    },

    // ─── Header ────────────────────────────────────────────────────────────
    header: {
      flexDirection:     'row',
      alignItems:        'center',
      paddingHorizontal: 12,
      paddingVertical:   10,
      backgroundColor:   theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    backButton: {
      width:          36,
      height:         36,
      alignItems:     'center',
      justifyContent: 'center',
    },
    backArrow: {
      fontSize:   24,
      color:      theme.colors.brandPrimary,
      fontWeight: '700',
    },
    headerTitle: {
      flex:       1,
      textAlign:  'center',
      fontSize:   17,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    headerSpacer: { width: 36 },

    // ─── Scroll ────────────────────────────────────────────────────────────
    scrollContent: {
      padding:       20,
      paddingBottom: 36,
      gap:           20,
    },

    // ─── Recipient card ────────────────────────────────────────────────────
    recipientCard: {
      flexDirection:   'row',
      alignItems:      'center',
      backgroundColor: theme.colors.cardBackground,
      borderRadius:    16,
      padding:         16,
      gap:             12,
      borderWidth:     1,
      borderColor:     theme.colors.divider,
    },
    recipientInfo: { flex: 1, gap: 2 },
    recipientLabel: {
      fontSize: 12,
      color:    theme.colors.textSecondary,
    },
    recipientName: {
      fontSize:   16,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    stripePill: {
      backgroundColor:   '#635BFF',
      borderRadius:      12,
      paddingHorizontal: 10,
      paddingVertical:   4,
    },
    stripePillText: {
      fontSize:      11,
      fontWeight:    '700',
      color:         '#fff',
      letterSpacing: 0.3,
    },

    // ─── Amount ────────────────────────────────────────────────────────────
    amountSection: { gap: 12 },
    sectionLabel: {
      fontSize:      13,
      fontWeight:    '600',
      color:         theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    amountInputRow: {
      flexDirection:     'row',
      alignItems:        'center',
      backgroundColor:   theme.colors.cardBackground,
      borderRadius:      14,
      borderWidth:       2,
      borderColor:       theme.colors.brandPrimary,
      paddingHorizontal: 16,
      paddingVertical:   4,
      gap:               8,
    },
    amountInput: {
      flex:            1,
      fontSize:        40,
      fontWeight:      '700',
      color:           theme.colors.textPrimary,
      paddingVertical: 8,
    },
    currencySymbol: {
      fontSize:   30,
      fontWeight: '600',
      color:      theme.colors.textSecondary,
    },
    presetsRow: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           8,
    },
    presetChip: {
      paddingHorizontal: 14,
      paddingVertical:   8,
      borderRadius:      20,
      backgroundColor:   theme.colors.cardBackground,
      borderWidth:       1,
      borderColor:       theme.colors.divider,
    },
    presetChipSelected: {
      backgroundColor: theme.colors.brandPrimary,
      borderColor:     theme.colors.brandPrimary,
    },
    presetChipText: {
      fontSize:   14,
      fontWeight: '600',
      color:      theme.colors.textSecondary,
    },
    presetChipTextSelected: { color: '#fff' },

    // ─── Note ──────────────────────────────────────────────────────────────
    noteSection: { gap: 8 },
    noteInput: {
      backgroundColor:   theme.colors.cardBackground,
      borderRadius:      12,
      borderWidth:       1,
      borderColor:       theme.colors.divider,
      paddingHorizontal: 14,
      paddingTop:        12,
      paddingBottom:     12,
      fontSize:          15,
      color:             theme.colors.textPrimary,
      minHeight:         80,
    },

    // ─── Error banner ──────────────────────────────────────────────────────
    errorBanner: {
      flexDirection:   'row',
      alignItems:      'center',
      backgroundColor: '#FEF2F2',
      borderRadius:    12,
      borderWidth:     1,
      borderColor:     '#FECACA',
      padding:         14,
      gap:             10,
    },
    errorBannerIcon:  { fontSize: 18 },
    errorBannerTitle: {
      fontSize:     13,
      fontWeight:   '700',
      color:        '#B91C1C',
      marginBottom: 2,
    },
    errorBannerText: {
      fontSize:   12,
      color:      '#DC2626',
      lineHeight: 17,
    },
    errorBannerDismiss: {
      fontSize: 14,
      color:    '#B91C1C',
      padding:  4,
    },

    // ─── Pay button ────────────────────────────────────────────────────────
    payButton: {
      backgroundColor: theme.colors.brandPrimary,
      borderRadius:    14,
      paddingVertical: 16,
      alignItems:      'center',
      minHeight:       52,
      justifyContent:  'center',
    },
    payButtonDisabled: {
      backgroundColor: theme.colors.divider,
    },
    payButtonText: {
      fontSize:   17,
      fontWeight: '700',
      color:      '#fff',
    },

    // ─── Payment method hint ───────────────────────────────────────────────
    methodsHint: { alignItems: 'center' },
    methodsHintText: {
      fontSize:  13,
      color:     theme.colors.textSecondary,
      textAlign: 'center',
    },

    // ─── Fine print ────────────────────────────────────────────────────────
    secureNote: {
      fontSize:   11,
      color:      theme.colors.textSecondary,
      textAlign:  'center',
      lineHeight: 16,
    },

    // ─── Success state ─────────────────────────────────────────────────────
    successContainer: {
      flex:           1,
      alignItems:     'center',
      justifyContent: 'center',
      padding:        32,
      gap:            16,
    },
    successEmoji: {
      fontSize:     64,
      marginBottom: 8,
    },
    successTitle: {
      fontSize:   22,
      fontWeight: '800',
      color:      theme.colors.textPrimary,
      textAlign:  'center',
    },
    successSubtitle: {
      fontSize:   15,
      color:      theme.colors.textSecondary,
      textAlign:  'center',
      lineHeight: 22,
    },
    successButton: {
      marginTop:         16,
      backgroundColor:   theme.colors.brandPrimary,
      borderRadius:      14,
      paddingVertical:   14,
      paddingHorizontal: 32,
    },
    successButtonText: {
      fontSize:   16,
      fontWeight: '700',
      color:      '#fff',
    },
  });
}
