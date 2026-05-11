// ─── DESIGN SYSTEM — COLORS ──────────────────────────────────────────────────
// The single source of truth for every color in the app.
// NOTHING is hard-coded anywhere else.

export const COLORS = {
  brand: {
    primary:          '#3B82F6',   // Main SLForce blue
    primaryLight:     '#60A5FA',   // Lighter blue for dark mode
    primaryDark:      '#2563EB',   // Darker blue for pressed states
    primarySubtle:    '#EFF6FF',   // Very light blue background (light mode)
    primarySubtleDark:'#1E3A5F',   // Very dark blue background (dark mode)
  },

  neutral: {
    white:   '#FFFFFF',
    gray50:  '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black:   '#000000',
  },

  dark: {
    background:      '#0F172A',  // Darkest — page background
    surface:         '#1E293B',  // Cards, inputs, modals
    surfaceElevated: '#334155',  // Tooltips, dropdowns (above surface)
    border:          '#334155',
  },

  semantic: {
    success:      '#10B981',
    successLight: '#D1FAE5',
    danger:       '#EF4444',
    dangerLight:  '#FEE2E2',
    dangerDark:   '#B91C1C',
    warning:      '#F59E0B',
    warningLight: '#FEF3C7',
    info:         '#06B6D4',
    infoLight:    '#CFFAFE',
  },

  // Couleurs "subtle" — petits accents de fond pour les badges, alertes douces
  // ou cards pastel. Centralisées ici pour ne plus voir d'hex en dur dans les
  // styles d'écrans (cf. screen-styles/athlete/profile.styles.ts ancien code).
  subtle: {
    amber:  '#FEF3C7',   // background badge "warning" doux
    blue:   '#DBEAFE',   // background badge "info" doux
    red:    '#FEE2E2',   // background badge "danger" doux
    green:  '#D1FAE5',   // background badge "success" doux
    purple: '#EDE9FE',   // background badge coach (light mode)
    indigo: '#1E3A8A',   // chip actif (search header)
    slate:  '#0F172A',   // text foncé sur subtle backgrounds
  },

  // Rôles — pour les UI qui veulent contraster coach (violet) vs athlète (bleu).
  // Aujourd'hui seul l'avatar / la search en tirent parti.
  roles: {
    coach:        '#8B5CF6',  // Purple — coach-specific elements
    coachLight:   '#EDE9FE',
    athlete:      '#3B82F6',  // Blue — athlete-specific elements
    athleteLight: '#EFF6FF',
  },

  // Couleur de base des shadows iOS — toujours noire opaque, l'opacité est
  // gérée via shadowOpacity. Centralisée pour éviter `shadowColor: '#000'`
  // dupliqué dans 15+ styles.
  shadowBase: '#000000',

  overlay: {
    dark10: 'rgba(0,0,0,0.10)',
    dark20: 'rgba(0,0,0,0.20)',
    dark40: 'rgba(0,0,0,0.40)',
    dark60: 'rgba(0,0,0,0.60)',
    dark80: 'rgba(0,0,0,0.80)',

    // Overlays clairs sur fonds sombres (ex: modals photo plein écran).
    light15: 'rgba(255,255,255,0.15)',
    light20: 'rgba(255,255,255,0.20)',
    light45: 'rgba(255,255,255,0.45)',
  },
} as const;

export type AppColors = typeof COLORS;
