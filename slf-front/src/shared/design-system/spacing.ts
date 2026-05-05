// ─── DESIGN SYSTEM — SPACING ─────────────────────────────────────────────────
// All margins, paddings, and gaps use values from this scale.
// Based on a 4px base unit — every value is a multiple of 4.

export const SPACING = {
  0:   0,
  1:   4,    // Extra tight
  2:   8,    // Tight
  3:   12,
  4:   16,   // Standard (most used)
  5:   20,
  6:   24,   // Comfortable
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  16:  64,
  20:  80,
  24:  96,

  // Named aliases for common use cases
  screenHorizontalPadding: 20,
  screenVerticalPadding:   24,
  cardPadding:             16,
  inputVerticalPadding:    14,
  inputHorizontalPadding:  16,
  sectionGap:              24,
  itemGap:                 12,
  iconGap:                  8,
} as const;
