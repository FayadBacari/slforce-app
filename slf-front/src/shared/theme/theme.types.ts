// Describes the shape of a complete app theme.
// Both the light theme and the dark theme must match this shape exactly.
export interface AppTheme {
  isDark: boolean;

  // Page and surface backgrounds
  colors: {
    pageBackground:    string;
    cardBackground:    string;
    inputBackground:   string;
    modalBackground:   string;
    divider:           string;
    border:            string;

    // Text
    textPrimary:       string;
    textSecondary:     string;
    textDisabled:      string;
    textOnPrimary:     string;   // Text on top of brand color buttons

    // Brand
    brandPrimary:      string;
    brandPrimaryDark:  string;

    // Status colors
    success:           string;
    danger:            string;
    warning:           string;

    // Chat-specific
    myMessageBubble:   string;
    theirMessageBubble:string;
    myMessageText:     string;
    theirMessageText:  string;

    // Tab bar
    tabBarBackground:  string;
    tabBarActive:      string;
    tabBarInactive:    string;
  };
}
