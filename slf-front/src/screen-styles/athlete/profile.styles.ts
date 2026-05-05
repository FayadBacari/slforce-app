import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

// Pixel-perfect reproduction of the legacy slf-frontend "Ma Fiche Athlète" screen.
// Three blocks scroll under a fixed blue header:
//   1. Profil Athlète card (avatar, gender, weight category, height, weight)
//   2. Records personnels card (4 colored record rows)
//   3. Total Street-Lifting purple card + "Comment améliorer" blue tip box
export function buildAthleteProfileStyles(theme: AppTheme) {
  // Soft shadow used by every white card on the page
  const cardShadow = Platform.select({
    ios: {
      shadowColor:   '#000',
      shadowOpacity: 0.08,
      shadowRadius:  12,
      shadowOffset:  { width: 0, height: 4 },
    },
    android: { elevation: 3 },
  });

  return StyleSheet.create({
    // ─── Page shell ──────────────────────────────────────────────────────────
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
      padding:         18,
      gap:             16,
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
    cardTitleEmoji: {
      fontSize: 22,
    },
    cardTitleText: {
      fontSize:   17,
      fontWeight: '800',
      color:      theme.colors.textPrimary,
    },
    editButton: {
      width:           36,
      height:          36,
      borderRadius:    10,
      backgroundColor: '#FEF3C7',           // soft amber pill exactly like the screenshot
      alignItems:      'center',
      justifyContent:  'center',
    },
    editButtonActive: {
      backgroundColor: '#FEE2E2',
    },
    editButtonIcon: {
      fontSize: 16,
    },

    // ─── 1. Identity card (avatar + name + handle) ───────────────────────────
    avatarContainer: {
      alignItems: 'center',
      marginTop:  4,
    },
    avatarBorder: {
      width:           150,
      height:          150,
      borderRadius:    75,
      borderWidth:     5,
      borderColor:     COLORS.brand.primary,
      padding:         0,
      alignItems:      'center',
      justifyContent:  'center',
      backgroundColor: theme.colors.cardBackground,
    },
    avatarImage: {
      width:        140,
      height:       140,
      borderRadius: 70,
    },
    nameText: {
      fontSize:   28,
      fontWeight: '900',
      color:      theme.colors.textPrimary,
      textAlign:  'center',
      marginTop:  12,
    },
    handleText: {
      fontSize:   15,
      fontWeight: '600',
      color:      COLORS.brand.primary,
      textAlign:  'center',
      marginTop:  2,
    },

    // ─── Form section (label + content) ──────────────────────────────────────
    formSection: {
      gap: 8,
    },
    formSectionLabel: {
      fontSize:      12,
      fontWeight:    '700',
      color:         theme.colors.textSecondary,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },

    // ─── Gender row (HOMME / FEMME side by side) ─────────────────────────────
    genderRow: {
      flexDirection: 'row',
      gap:           10,
    },
    genderButton: {
      flex:            1,
      backgroundColor: theme.isDark ? '#1F2937' : '#F3F4F6',
      borderWidth:     1.5,
      borderColor:     'transparent',
      borderRadius:    14,
      paddingVertical: 14,
      alignItems:      'center',
      gap:             4,
    },
    genderButtonActive: {
      backgroundColor: '#DBEAFE',
      borderColor:     COLORS.brand.primary,
    },
    genderEmoji: {
      fontSize: 28,
    },
    genderLabel: {
      fontSize:      11,
      fontWeight:    '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color:         theme.colors.textSecondary,
    },
    genderLabelActive: {
      color: COLORS.brand.primaryDark,
    },

    // ─── Weight categories grid (-66 / -73 / … / +104) ───────────────────────
    weightGrid: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           8,
    },
    weightChip: {
      // 4 chips per row at exact 16px gap container
      minWidth:        '23%',
      flexGrow:        1,
      backgroundColor: theme.isDark ? '#1F2937' : '#F3F4F6',
      borderWidth:     1.5,
      borderColor:     'transparent',
      borderRadius:    12,
      paddingVertical: 10,
      alignItems:      'center',
    },
    weightChipActive: {
      backgroundColor: '#DBEAFE',
      borderColor:     COLORS.brand.primary,
    },
    weightChipLabel: {
      fontSize:   13,
      fontWeight: '700',
      color:      theme.colors.textSecondary,
    },
    weightChipLabelActive: {
      color: COLORS.brand.primaryDark,
    },

    // ─── Numeric input row (Poids / Taille — icon + label + input + unit) ────
    numericFieldRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           10,
    },
    numericFieldIcon: {
      fontSize: 22,
    },
    numericFieldLabel: {
      flex:          1,
      fontSize:      12,
      fontWeight:    '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color:         theme.colors.textSecondary,
    },
    numericFieldInput: {
      backgroundColor:   theme.isDark ? '#1F2937' : '#F3F4F6',
      borderRadius:      10,
      paddingHorizontal: 12,
      paddingVertical:   8,
      fontSize:          15,
      fontWeight:        '700',
      color:             theme.colors.textPrimary,
      minWidth:          80,
      textAlign:         'right',
    },

    // ─── 2. Records card (4 colored records) ─────────────────────────────────
    recordsList: {
      gap: 12,
    },
    recordItem: {
      borderRadius:    16,
      borderWidth:     2,
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap:             10,
    },
    recordItemRed:    { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    recordItemBlue:   { backgroundColor: COLORS.brand.primary, borderColor: COLORS.brand.primary },
    recordItemGreen:  { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
    recordItemYellow: { backgroundColor: '#FEFCE8', borderColor: '#FEF08A' },
    recordItemHeaderRow: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
    },
    recordItemLabel: {
      fontSize:      12,
      fontWeight:    '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color:         theme.colors.textPrimary,
    },
    recordItemLabelOnDark: {
      color: '#FFFFFF',
    },
    recordItemTrendEmoji: {
      fontSize: 16,
    },
    recordItemValueRow: {
      flexDirection:    'row',
      alignItems:       'center',
      justifyContent:   'space-between',
      backgroundColor:  '#FFFFFF',
      borderRadius:     12,
      paddingHorizontal: 16,
      paddingVertical:   12,
    },
    recordItemValueRowOnDark: {
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    recordItemValue: {
      fontSize:   28,
      fontWeight: '900',
      color:      '#9CA3AF',
      flex:       1,
      textAlign:  'center',
    },
    recordItemValueOnDark: {
      color: '#FFFFFF',
    },
    recordItemValueEditable: {
      color: theme.colors.textPrimary,
    },
    recordItemUnit: {
      fontSize:   14,
      fontWeight: '700',
      color:      theme.colors.textSecondary,
    },
    recordItemUnitOnDark: {
      color: 'rgba(255,255,255,0.85)',
    },
    saveRecordsButton: {
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             8,
      backgroundColor: COLORS.brand.primary,
      paddingVertical: 12,
      borderRadius:    12,
      marginTop:       4,
    },
    saveRecordsButtonText: {
      fontSize:   15,
      fontWeight: '700',
      color:      '#FFFFFF',
    },

    // ─── 3. Total card (purple "Total Street Lifting") ───────────────────────
    totalCard: {
      backgroundColor: '#8B5CF6',          // violet — exact match with screenshot
      borderRadius:    20,
      padding:         20,
      ...Platform.select({
        ios: {
          shadowColor:   '#8B5CF6',
          shadowOpacity: 0.30,
          shadowRadius:  14,
          shadowOffset:  { width: 0, height: 8 },
        },
        android: { elevation: 6 },
      }),
    },
    totalCardContent: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
    },
    totalCardLeft: {
      flex: 1,
      gap:  2,
    },
    totalCardLabel: {
      fontSize:      11,
      fontWeight:    '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color:         'rgba(255,255,255,0.85)',
    },
    totalCardValue: {
      fontSize:   48,
      fontWeight: '900',
      color:      '#FFFFFF',
      marginTop:  4,
    },
    totalCardUnit: {
      fontSize: 13,
      color:    'rgba(255,255,255,0.85)',
      fontWeight: '600',
    },
    totalCardEmoji: {
      fontSize: 64,
    },

    // ─── 4. Tip box "Comment améliorer ton score ?" ──────────────────────────
    tipBox: {
      flexDirection:   'row',
      gap:             12,
      backgroundColor: '#DBEAFE',
      borderRadius:    14,
      padding:         14,
      alignItems:      'flex-start',
    },
    tipBoxEmoji: {
      fontSize: 22,
    },
    tipBoxContent: {
      flex: 1,
      gap:  4,
    },
    tipBoxTitle: {
      fontSize:   14,
      fontWeight: '800',
      color:      COLORS.brand.primaryDark,
    },
    tipBoxText: {
      fontSize:   13,
      color:      COLORS.brand.primary,
      lineHeight: 18,
    },
  });
}
