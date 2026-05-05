import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildSupportStyles(theme: AppTheme) {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical:   24,
      gap:               16,
    },
    sectionTitle: {
      fontSize:   18,
      fontWeight: '700',
      color:      theme.colors.textPrimary,
    },
    faqList: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius:    16,
      overflow:        'hidden',
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
    faqItem: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    faqQuestion: {
      flexDirection:     'row',
      alignItems:        'center',
      paddingVertical:   16,
      paddingHorizontal: 16,
      gap:               8,
    },
    faqQuestionText: {
      fontSize:   15,
      fontWeight: '500',
      color:      theme.colors.textPrimary,
      flex:       1,
    },
    faqChevron: {
      fontSize:   22,
      color:      theme.colors.textSecondary,
      lineHeight: 26,
    },
    faqChevronExpanded: {
      transform: [{ rotate: '90deg' }],
    },
    faqAnswer: {
      fontSize:          14,
      color:             theme.colors.textSecondary,
      paddingHorizontal: 16,
      paddingBottom:     16,
      lineHeight:        20,
    },
    contactCard: {
      backgroundColor:  theme.colors.cardBackground,
      borderRadius:     16,
      padding:          16,
      flexDirection:    'row',
      alignItems:       'center',
      gap:              12,
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
    contactIcon: {
      fontSize: 24,
    },
    contactTextSection: {
      flex: 1,
      gap:  2,
    },
    contactLabel: {
      fontSize:   16,
      fontWeight: '500',
      color:      theme.colors.textPrimary,
    },
    contactSubLabel: {
      fontSize: 12,
      color:    theme.colors.textSecondary,
    },
    chevron: {
      fontSize:   22,
      color:      theme.colors.textSecondary,
      lineHeight: 26,
    },
  });
}
