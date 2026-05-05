import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/design-system';

// Reproduces the legacy slf-frontend "header" style block:
//  - blue primary background
//  - 24px rounded bottom corners
//  - 24px padding
//  - strong shadow underneath
//  - white bold title + light-blue subtitle
export function buildAppHeaderStyles() {
  return StyleSheet.create({
    headerContainer: {
      backgroundColor:         COLORS.brand.primary,
      borderBottomLeftRadius:  24,
      borderBottomRightRadius: 24,
      paddingHorizontal:       24,
      paddingTop:              24,
      paddingBottom:           24,
      ...Platform.select({
        ios: {
          shadowColor:   '#000',
          shadowOffset:  { width: 0, height: 4 },
          shadowOpacity: 0.20,
          shadowRadius:  8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    titleRow: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
    },
    titleColumn: {
      flex: 1,
      gap:  4,
    },
    titleText: {
      color:      '#FFFFFF',
      fontWeight: '900',
      fontSize:   28,
    },
    subtitleText: {
      color:      '#BFDBFE',         // Light blue, exact legacy match
      fontWeight: '600',
      fontSize:   14,
    },
    childrenContainer: {
      marginTop: 16,
    },
  });
}
