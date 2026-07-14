export const colors = {
  brand: {
    50: "#F6F5FF",
    100: "#ECEAFF",
    200: "#D9D5FF",
    300: "#BEB7FF",
    400: "#9A8FFF",
    500: "#7467FF",
    600: "#635BFF",
    700: "#4F46E5",
    800: "#4338CA",
    900: "#312E81",
    950: "#1E1B4B",
  },

  navy: {
    50: "#F4F7FB",
    100: "#E8EEF7",
    200: "#C9D5E8",
    300: "#A4B7D3",
    400: "#7891B8",
    500: "#58729E",
    600: "#415983",
    700: "#344768",
    800: "#233454",
    900: "#0B1739",
    950: "#071128",
  },

  blue: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },

  cyan: {
    50: "#ECFEFF",
    100: "#CFFAFE",
    200: "#A5F3FC",
    300: "#67E8F9",
    400: "#22D3EE",
    500: "#14B8D4",
    600: "#0891B2",
    700: "#0E7490",
    800: "#155E75",
    900: "#164E63",
  },

  gray: {
    0: "#FFFFFF",
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
    950: "#020617",
  },

  green: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
  },

  amber: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
  },

  red: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
  },
} as const;

export const semanticColors = {
  background: {
    page: colors.gray[50],
    surface: colors.gray[0],
    elevated: colors.gray[0],
    dark: colors.navy[950],
  },

  text: {
    primary: colors.gray[900],
    secondary: colors.gray[600],
    muted: colors.gray[500],
    inverse: colors.gray[0],
    link: colors.brand[700],
  },

  border: {
    default: colors.gray[200],
    strong: colors.gray[300],
    focus: colors.brand[500],
  },

  action: {
    primary: colors.brand[700],
    primaryHover: colors.brand[800],
    secondary: colors.navy[900],
    disabled: colors.gray[300],
  },

  status: {
    success: colors.green[600],
    warning: colors.amber[600],
    danger: colors.red[600],
    info: colors.blue[600],
  },
} as const;

export type ColorTokens = typeof colors;
export type SemanticColorTokens = typeof semanticColors;
