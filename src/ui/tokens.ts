import { Platform } from 'react-native';
import { FontFamily } from './fonts';

// ─── Spacing Scale ───────────────────────────────────────────────
export const Space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Border Radii ────────────────────────────────────────────────
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ─── Typography ──────────────────────────────────────────────────
export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
} as const;

export const LineHeight = {
  xs: 16,
  sm: 18,
  base: 22,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 38,
  '3xl': 48,
} as const;

// Pre-built type styles
export const TypeStyle = {
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['3xl'],
    lineHeight: LineHeight['3xl'],
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    lineHeight: LineHeight['2xl'],
  },
  h3: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
    lineHeight: LineHeight.xl,
  },
  h4: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
  },
  bodySm: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    lineHeight: LineHeight.xs,
  },
  button: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
  },
  buttonSm: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
  },
} as const;

// ─── Shadows ─────────────────────────────────────────────────────
export const Shadow = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    android: { elevation: 3 },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
    },
  }),
} as const;

// ─── Breakpoints ─────────────────────────────────────────────────
export const Breakpoint = {
  compact: 0,     // phones
  medium: 600,    // small tablets, large phones in landscape
  expanded: 900,  // tablets
} as const;

// ─── Touch Targets ───────────────────────────────────────────────
export const HitTarget = {
  min: 48,
} as const;
