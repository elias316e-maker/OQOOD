import { colors } from "../tokens/colors";

export const darkTheme = {
  name: "dark",

  colors: {
    background: {
      page: colors.navy[950],
      surface: colors.navy[900],
      elevated: colors.navy[800],
      dark: colors.gray[950],
    },

    text: {
      primary: colors.gray[0],
      secondary: colors.gray[300],
      muted: colors.gray[400],
      inverse: colors.gray[950],
      link: colors.brand[300],
    },

    border: {
      default: colors.navy[700],
      strong: colors.navy[600],
      focus: colors.brand[400],
    },

    action: {
      primary: colors.brand[500],
      primaryHover: colors.brand[400],
      secondary: colors.blue[600],
      disabled: colors.gray[600],
    },

    status: {
      success: colors.green[500],
      warning: colors.amber[500],
      danger: colors.red[500],
      info: colors.blue[400],
    },
  },
} as const;
