import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, SPACING } from '@shared/design-system';
import type { AppTheme } from '@shared/theme/theme.types';

export function buildMessageInputBarStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flexDirection:   'row',
      alignItems:      'flex-end',
      paddingHorizontal: SPACING[4],
      paddingVertical:   SPACING[2],
      backgroundColor:   theme.colors.cardBackground,
      borderTopWidth:  1,
      borderTopColor:  theme.colors.border,
      gap:             SPACING[2],
    },
    attachButton: {
      width:          40,
      height:         40,
      alignItems:     'center',
      justifyContent: 'center',
    },
    attachIcon: {
      fontSize: 22,
    },
    textInput: {
      flex:             1,
      minHeight:        40,
      maxHeight:        120,
      backgroundColor:  theme.colors.inputBackground,
      borderRadius:     BORDER_RADIUS.input,
      paddingHorizontal: SPACING[3],
      paddingVertical:   SPACING[2],
      fontSize:         15,
      color:            theme.colors.textPrimary,
    },
    sendButton: {
      width:          40,
      height:         40,
      borderRadius:   BORDER_RADIUS.avatar,
      alignItems:     'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.border,
    },
    sendButtonActive: {
      backgroundColor: theme.colors.brandPrimary,
    },
    sendIcon: {
      fontSize: 18,
      color:    '#FFFFFF',
    },
  });
}
