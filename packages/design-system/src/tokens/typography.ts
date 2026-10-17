export const fontFamilies = {
  arabic:
    '"IBM Plex Sans Arabic", "Noto Sans Arabic", Arial, sans-serif',
  latin:
    '"IBM Plex Sans", Inter, Arial, sans-serif',
  mono:
    '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
} as const;

export const fontSizes = {
  xs: "0.75rem",
  sm: "0.875rem",
  md: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
  "6xl": "3.75rem",
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const lineHeights = {
  tight: 1.2,
  heading: 1.35,
  normal: 1.6,
  relaxed: 1.8,
  loose: 2,
} as const;

export const typography = {
  display: {
    fontSize: fontSizes["5xl"],
    fontWeight: fontWeights.extrabold,
    lineHeight: lineHeights.tight,
  },
  heading1: {
    fontSize: fontSizes["4xl"],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.heading,
  },
  heading2: {
    fontSize: fontSizes["3xl"],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.heading,
  },
  heading3: {
    fontSize: fontSizes["2xl"],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.heading,
  },
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.relaxed,
  },
  body: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
} as const;
