export const shadows = {
  none: "none",
  xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
  sm: "0 2px 8px rgba(15, 23, 42, 0.06)",
  md: "0 10px 30px rgba(15, 23, 42, 0.08)",
  lg: "0 24px 60px rgba(49, 46, 129, 0.14)",
  xl: "0 30px 90px rgba(49, 46, 129, 0.18)",
  focus: "0 0 0 4px rgba(99, 91, 255, 0.12)",
  brand: "0 14px 34px rgba(79, 70, 229, 0.24)",
} as const;

export type ShadowToken = keyof typeof shadows;
