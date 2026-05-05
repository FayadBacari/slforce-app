import { StyleSheet } from 'react-native';

// The tab icon size matches the legacy slf-frontend's iOS tab bar (~24px).
const TAB_ICON_SIZE = 24;

export function buildAppTabIconStyles(tintColor: string) {
  return StyleSheet.create({
    icon: {
      width:     TAB_ICON_SIZE,
      height:    TAB_ICON_SIZE,
      tintColor,
    },
  });
}
