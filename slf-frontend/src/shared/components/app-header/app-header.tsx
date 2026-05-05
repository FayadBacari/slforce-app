import React from 'react';
import { View, Text } from 'react-native';
import { buildAppHeaderStyles } from './app-header.styles';

interface AppHeaderProps {
  title:        string;
  subtitle?:    string;
  rightElement?: React.ReactNode;
  // Optional content rendered below the title row (e.g. a search bar)
  children?:    React.ReactNode;
}

// The signature SLForce header: blue background with rounded bottom corners,
// soft shadow, white bold title, and a light-blue subtitle.
// Used at the top of every "main" screen (dashboards, search, earnings, profile).
export function AppHeader({ title, subtitle, rightElement, children }: AppHeaderProps) {
  const styles = buildAppHeaderStyles();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>
        {rightElement && <View>{rightElement}</View>}
      </View>
      {children && <View style={styles.childrenContainer}>{children}</View>}
    </View>
  );
}
