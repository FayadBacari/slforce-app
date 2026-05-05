// ─── DESIGN SYSTEM — TYPOGRAPHY ──────────────────────────────────────────────
// Every font size, weight, and line height used in the app.

export const TYPOGRAPHY = {
  fontFamily: {
    // System fonts give the best performance — no custom font loading needed
    regular: undefined,   // System default
    medium:  undefined,
    bold:    undefined,
  },

  fontSize: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    '2xl':24,
    '3xl':30,
    '4xl':36,
  },

  fontWeight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semiBold: '600' as const,
    bold:     '700' as const,
    extraBold:'800' as const,
  },

  lineHeight: {
    tight:  1.25,  // Headings
    normal: 1.5,   // Body text
    relaxed:1.75,  // Readable paragraphs
  },

  // Pre-built text style combinations ready to use directly
  presets: {
    screenTitle: {
      fontSize:   24,
      fontWeight: '700' as const,
      lineHeight: 30,
    },
    sectionTitle: {
      fontSize:   18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    bodyLarge: {
      fontSize:   17,
      fontWeight: '400' as const,
      lineHeight: 26,
    },
    bodyMedium: {
      fontSize:   15,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    bodySmall: {
      fontSize:   13,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize:   11,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    buttonLabel: {
      fontSize:   16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    inputLabel: {
      fontSize:   14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    messageText: {
      fontSize:   15,
      fontWeight: '400' as const,
      lineHeight: 21,
    },
  },
} as const;
