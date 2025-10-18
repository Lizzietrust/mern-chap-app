export type Theme = "light" | "dark" | "system";
export type Accent = "blue" | "emerald" | "violet" | "rose" | "amber";

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultAccent?: Accent;
}
