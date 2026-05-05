import { StyleSheet } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildProfileSettingsStyles(theme: AppTheme) {
  return StyleSheet.create({
    scrollContent: {
      paddingVertical: 24,
      gap:             24,
    },

    // ─── Avatar section ────────────────────────────────────────────────────
    avatarSection: {
      alignItems: 'center',
      gap:        12,
    },
    // Wrapper so the edit badge can be positioned absolutely over the avatar
    avatarWrapper: {
      position: 'relative',
    },
    // Small blue camera badge in the bottom-right corner of the avatar
    editPhotoBadge: {
      position:        'absolute',
      bottom:          0,
      right:           0,
      width:           30,
      height:          30,
      borderRadius:    15,
      backgroundColor: COLORS.brand.primary,
      alignItems:      'center',
      justifyContent:  'center',
      borderWidth:     2,
      borderColor:     theme.colors.pageBackground,
    },
    editPhotoBadgeEmoji: {
      fontSize: 13,
    },
    changePhotoLabel: {
      fontSize:   14,
      fontWeight: '600',
      color:      COLORS.brand.primary,
    },

    // ─── Form ──────────────────────────────────────────────────────────────
    formSection: {
      gap: 16,
    },
    nameRow: {
      flexDirection: 'row',
      gap:           12,
    },
    halfInput: {
      flex: 1,
    },

    // ─── Disciplines section (coaches only) ────────────────────────────────
    disciplinesSection: {
      gap: 12,
    },
    disciplinesSectionTitle: {
      fontSize:    14,
      fontWeight:  '600',
      color:       theme.colors.textPrimary,
      marginBottom: 4,
    },
    disciplinesGrid: {
      flexDirection:  'row',
      flexWrap:       'wrap',
      gap:            8,
    },
    disciplineChip: {
      paddingHorizontal: 14,
      paddingVertical:   8,
      borderRadius:      20,
      borderWidth:       1.5,
      borderColor:       theme.colors.border,
      backgroundColor:   theme.colors.pageBackground,
    },
    disciplineChipSelected: {
      borderColor:     theme.colors.brandPrimary,
      backgroundColor: `${theme.colors.brandPrimary}18`,
    },
    disciplineChipLabel: {
      fontSize:   13,
      fontWeight: '500',
      color:      theme.colors.textSecondary,
    },
    disciplineChipLabelSelected: {
      color:      theme.colors.brandPrimary,
      fontWeight: '700',
    },
    disciplinesSaveButton: {
      marginTop: 4,
    },
  });
}
