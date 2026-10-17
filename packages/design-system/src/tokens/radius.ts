export const radius = {
  none: "0",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.375rem",
  "2xl": "1.75rem",
  full: "9999px",
} as const;

export type RadiusToken = keyof typeof radius;
