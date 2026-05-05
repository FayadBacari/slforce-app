import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

// Faithful reproduction of the legacy slf-frontend "coachProfile" styles.
// Three sections shown in scrollable cards: identity, coach info, details + rates.
export function buildCoachProfileStyles(theme: AppTheme) {
  const cardShadow = Platform.select({
    ios: {
      shadowColor:   COLORS.brand.primaryDark,
      shadowOpacity: 0.08,
      shadowRadius:  10,
      shadowOffset:  { width: 0, height: 4 },
    },
    android: { elevation: 2 },
  });

  return StyleSheet.create({
    safeArea: {
      flex:            1,
      backgroundColor: theme.colors.pageBackground,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop:        16,
      paddingBottom:     32,
      gap:               16,
    },

    // ─── Card shared base ────────────────────────────────────────────────────
    card: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius:    20,
      padding:         16,
      gap:             12,
      ...cardShadow,
    },
    cardHeader: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           8,
    },
    cardTitle: {
      fontSize:   18,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    cardEmoji: {
      fontSize: 22,
    },

    // ─── Identity card ───────────────────────────────────────────────────────
    identityRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           16,
    },
    identityTextSection: {
      flex: 1,
      gap:  4,
    },
    identityName: {
      fontSize:   20,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    identitySpeciality: {
      fontSize:   14,
      color:      theme.colors.brandPrimary,
      fontWeight: '600',
    },
    identityMeta: {
      fontSize: 13,
      color:    theme.colors.textSecondary,
    },
    editButton: {
      width:           36,
      height:          36,
      borderRadius:    12,
      backgroundColor: COLORS.brand.primarySubtle,
      alignItems:      'center',
      justifyContent:  'center',
    },
    editButtonActive: {
      backgroundColor: COLORS.semantic.dangerLight,
    },
    editButtonIcon: {
      fontSize: 16,
    },

    // ─── Field row (label + value/textarea/badge) ────────────────────────────
    field: {
      gap: 6,
    },
    fieldLabelRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           6,
    },
    fieldLabel: {
      fontSize:   13,
      fontWeight: '600',
      color:      theme.colors.textSecondary,
    },
    fieldValue: {
      fontSize:   15,
      color:      theme.colors.textPrimary,
      paddingVertical: 4,
    },
    textArea: {
      fontSize:        14,
      color:           theme.colors.textPrimary,
      backgroundColor: theme.colors.inputBackground,
      borderRadius:    10,
      padding:         12,
      minHeight:       80,
      textAlignVertical: 'top',
    },
    textAreaDisabled: {
      backgroundColor: 'transparent',
      paddingVertical: 4,
      paddingHorizontal: 0,
    },
    inputUnderlined: {
      fontSize:          15,
      color:             theme.colors.textPrimary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.brandPrimary,
      paddingVertical:   4,
    },

    // ─── Speciality badge ────────────────────────────────────────────────────
    specialityBadge: {
      alignSelf:        'flex-start',
      backgroundColor:  COLORS.brand.primarySubtle,
      paddingHorizontal: 12,
      paddingVertical:   6,
      borderRadius:      9999,
    },
    specialityBadgeText: {
      fontSize:   13,
      fontWeight: '700',
      color:      COLORS.brand.primaryDark,
    },

    // ─── Rate row (price by hour / by month etc.) ────────────────────────────
    rateRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           8,
    },
    rateValue: {
      fontSize:   28,
      fontWeight: '900',
      color:      theme.colors.brandPrimary,
    },
    rateUnit: {
      fontSize:   14,
      fontWeight: '600',
      color:      theme.colors.textSecondary,
    },

    // ─── Stats grid (sessions / athletes / years) ────────────────────────────
    statsGrid: {
      flexDirection: 'row',
      gap:           12,
      marginTop:     4,
    },
    statBox: {
      flex:            1,
      backgroundColor: theme.colors.inputBackground,
      borderRadius:    14,
      padding:         12,
      gap:             4,
    },
    statValue: {
      fontSize:   22,
      fontWeight: '800',
      color:      theme.colors.brandPrimary,
    },
    statLabel: {
      fontSize: 12,
      color:    theme.colors.textSecondary,
    },

    // ─── Save button (when in edit mode) ─────────────────────────────────────
    saveButton: {
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             8,
      backgroundColor: theme.colors.brandPrimary,
      paddingVertical: 12,
      borderRadius:    12,
      marginTop:       4,
    },
    saveButtonText: {
      fontSize:   15,
      fontWeight: '700',
      color:      '#FFFFFF',
    },

    // ─── Visibility info banner ──────────────────────────────────────────────
    visibilityBanner: {
      flexDirection:   'row',
      gap:             12,
      backgroundColor: theme.colors.cardBackground,
      borderRadius:    16,
      padding:         16,
      borderLeftWidth: 3,
      borderLeftColor: COLORS.semantic.info,
      ...cardShadow,
    },
    visibilityBannerEmoji: {
      fontSize: 22,
    },
    visibilityBannerContent: {
      flex: 1,
      gap:  4,
    },
    visibilityBannerTitle: {
      fontSize:   14,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    visibilityBannerText: {
      fontSize:   13,
      color:      theme.colors.textSecondary,
      lineHeight: 18,
    },
  });
}
