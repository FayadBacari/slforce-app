// ─── DESIGN SYSTEM — BORDER RADIUS ───────────────────────────────────────────

export const BORDER_RADIUS = {
  sm:     6,
  md:     10,
  lg:     16,
  xl:     24,
  full:   9999,  // Perfect circle / pill shape

  // Named aliases
  button:  12,
  card:    16,
  input:   12,
  avatar:  9999,
  modal:   24,
  badge:   9999,

  // Chat bubble specific
  messageBubble:         18,
  messageBubbleTailless:  6,
} as const;
