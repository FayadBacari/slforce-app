import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildOnboardingScreenStyles(theme: AppTheme) {
  const isLight = !theme.isDark;

  return StyleSheet.create({
    // ── Root ─────────────────────────────────────────────────────────────────
    safeArea: {
      flex:            1,
      backgroundColor: theme.colors.pageBackground,
    },
    keyboardAvoider: {
      flex: 1,
    },

    // ── Progress bar ─────────────────────────────────────────────────────────
    progressContainer: {
      paddingHorizontal: SPACING.screenHorizontalPadding,
      paddingTop:        SPACING[4],
      paddingBottom:     SPACING[3],
      gap:               SPACING[2],
    },
    progressBarTrack: {
      height:           6,
      borderRadius:     BORDER_RADIUS.full,
      backgroundColor:  isLight ? COLORS.neutral.gray200 : COLORS.dark.border,
      overflow:         'hidden',
    },
    progressBarFill: {
      height:       6,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.colors.brandPrimary,
    },
    progressText: {
      ...TYPOGRAPHY.presets.caption,
      color:     theme.colors.textSecondary,
      textAlign: 'right',
    },

    // ── Scrollable content ────────────────────────────────────────────────────
    scrollContent: {
      flexGrow:    1,
      paddingBottom: SPACING[24],
    },

    // ── Step card ─────────────────────────────────────────────────────────────
    stepContainer: {
      flex:              1,
      alignItems:        'center',
      paddingHorizontal: SPACING.screenHorizontalPadding,
      paddingTop:        SPACING[8],
      gap:               SPACING[3],
    },
    iconWrapper: {
      marginBottom: SPACING[2],
    },
    iconText: {
      fontSize: 72,
    },
    stepTitle: {
      ...TYPOGRAPHY.presets.screenTitle,
      color:     theme.colors.textPrimary,
      textAlign: 'center',
    },
    stepSubtitle: {
      ...TYPOGRAPHY.presets.bodyMedium,
      color:     theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },

    // ── Inputs ────────────────────────────────────────────────────────────────
    input: {
      width:             '100%',
      marginTop:         SPACING[4],
      paddingVertical:   SPACING.inputVerticalPadding,
      paddingHorizontal: SPACING.inputHorizontalPadding,
      borderRadius:      BORDER_RADIUS.input,
      borderWidth:       1.5,
      borderColor:       theme.colors.brandPrimary,
      backgroundColor:   theme.colors.inputBackground,
      color:             theme.colors.textPrimary,
      fontSize:          TYPOGRAPHY.fontSize.lg,
      fontWeight:        TYPOGRAPHY.fontWeight.semiBold,
    },
    inputReadOnly: {
      opacity: 0.5,
    },
    textArea: {
      width:             '100%',
      marginTop:         SPACING[4],
      paddingVertical:   SPACING.inputVerticalPadding,
      paddingHorizontal: SPACING.inputHorizontalPadding,
      borderRadius:      BORDER_RADIUS.input,
      borderWidth:       1.5,
      borderColor:       theme.colors.brandPrimary,
      backgroundColor:   theme.colors.inputBackground,
      color:             theme.colors.textPrimary,
      fontSize:          TYPOGRAPHY.fontSize.md,
      minHeight:         120,
      textAlignVertical: 'top',
    },

    // ── Numeric input with unit ───────────────────────────────────────────────
    numericInputRow: {
      flexDirection: 'row',
      alignItems:    'center',
      marginTop:     SPACING[4],
      gap:           SPACING[2],
    },
    numericInput: {
      flex:              1,
      paddingVertical:   SPACING.inputVerticalPadding,
      paddingHorizontal: SPACING.inputHorizontalPadding,
      borderRadius:      BORDER_RADIUS.input,
      borderWidth:       1.5,
      borderColor:       theme.colors.brandPrimary,
      backgroundColor:   theme.colors.inputBackground,
      color:             theme.colors.textPrimary,
      fontSize:          TYPOGRAPHY.fontSize['2xl'],
      fontWeight:        TYPOGRAPHY.fontWeight.bold,
      textAlign:         'center',
    },
    unitLabel: {
      ...TYPOGRAPHY.presets.sectionTitle,
      color:      theme.colors.textSecondary,
      minWidth:   40,
    },

    // ── Feedback messages ─────────────────────────────────────────────────────
    feedbackChecking: {
      ...TYPOGRAPHY.presets.bodySmall,
      color:     theme.colors.textSecondary,
      marginTop: SPACING[2],
    },
    feedbackSuccess: {
      ...TYPOGRAPHY.presets.bodySmall,
      color:     theme.colors.success,
      marginTop: SPACING[2],
    },
    feedbackError: {
      ...TYPOGRAPHY.presets.bodySmall,
      color:     theme.colors.danger,
      marginTop: SPACING[2],
    },

    // ── Badge rows (gender, speciality) ───────────────────────────────────────
    badgesRow: {
      flexDirection:  'row',
      flexWrap:       'wrap',
      gap:            SPACING[3],
      marginTop:      SPACING[4],
      justifyContent: 'center',
    },
    badgeButton: {
      paddingVertical:   SPACING[3],
      paddingHorizontal: SPACING[5],
      borderRadius:      BORDER_RADIUS.full,
      borderWidth:       1.5,
      borderColor:       theme.colors.border,
      backgroundColor:   theme.colors.cardBackground,
    },
    badgeButtonSelected: {
      borderColor:     theme.colors.brandPrimary,
      backgroundColor: theme.colors.brandPrimary,
    },
    badgeButtonText: {
      ...TYPOGRAPHY.presets.bodyMedium,
      fontWeight: TYPOGRAPHY.fontWeight.semiBold,
      color:      theme.colors.textPrimary,
    },
    badgeButtonTextSelected: {
      color: COLORS.neutral.white,
    },

    // ── Discipline grid (multi-select) ─────────────────────────────────────────
    badgesGrid: {
      flexDirection:  'row',
      flexWrap:       'wrap',
      gap:            SPACING[3],
      marginTop:      SPACING[4],
      justifyContent: 'center',
    },
    disciplineBadge: {
      paddingVertical:   SPACING[3],
      paddingHorizontal: SPACING[5],
      borderRadius:      BORDER_RADIUS.md,
      borderWidth:       1.5,
      borderColor:       theme.colors.border,
      backgroundColor:   theme.colors.cardBackground,
    },
    disciplineBadgeSelected: {
      borderColor:     theme.colors.brandPrimary,
      backgroundColor: theme.colors.brandPrimary,
    },
    disciplineBadgeText: {
      ...TYPOGRAPHY.presets.bodyMedium,
      fontWeight: TYPOGRAPHY.fontWeight.semiBold,
      color:      theme.colors.textPrimary,
    },
    disciplineBadgeTextSelected: {
      color: COLORS.neutral.white,
    },
    selectedInfo: {
      marginTop: SPACING[3],
    },
    selectedInfoText: {
      ...TYPOGRAPHY.presets.bodySmall,
      color: theme.colors.textSecondary,
    },

    // ── Bottom navigation ─────────────────────────────────────────────────────
    navigationBar: {
      flexDirection:     'row',
      gap:               SPACING[3],
      paddingHorizontal: SPACING.screenHorizontalPadding,
      paddingVertical:   SPACING[4],
      paddingBottom:     SPACING[6],
      backgroundColor:   theme.colors.pageBackground,
      borderTopWidth:    1,
      borderTopColor:    theme.colors.divider,
    },
    backButton: {
      flexDirection:   'row',
      alignItems:      'center',
      gap:             SPACING[2],
      paddingVertical: SPACING[4],
      paddingHorizontal: SPACING[4],
      borderRadius:    BORDER_RADIUS.button,
      borderWidth:     1.5,
      borderColor:     theme.colors.border,
    },
    backButtonText: {
      ...TYPOGRAPHY.presets.buttonLabel,
      color: theme.colors.textPrimary,
    },
    nextButton: {
      flex:            1,
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             SPACING[2],
      paddingVertical: SPACING[4],
      borderRadius:    BORDER_RADIUS.button,
      backgroundColor: theme.colors.brandPrimary,
    },
    nextButtonFull: {
      flex: 1,
    },
    nextButtonDisabled: {
      opacity: 0.4,
    },
    nextButtonText: {
      ...TYPOGRAPHY.presets.buttonLabel,
      color: COLORS.neutral.white,
    },
  });
}
