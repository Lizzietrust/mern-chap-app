export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export const ACCENTS = {
  BLUE: "blue",
  EMERALD: "emerald",
  VIOLET: "violet",
  ROSE: "rose",
  AMBER: "amber",
} as const;

export const STORAGE_KEYS = {
  THEME: "theme",
  ACCENT: "accent",
} as const;

export const THEME_COLORS = {
  LIGHT: "#ffffff",
  DARK: "#1f2937",
} as const;

export const ACCENT_CLASSES = [
  "accent-blue",
  "accent-emerald",
  "accent-violet",
  "accent-rose",
  "accent-amber",
] as const;
