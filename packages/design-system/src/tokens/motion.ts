export const motion = {
  duration: {
    instant: "80ms",
    fast: "160ms",
    normal: "240ms",
    slow: "360ms",
    slower: "500ms",
  },

  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.2, 0, 0, 1.2)",
    entrance: "cubic-bezier(0, 0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;
