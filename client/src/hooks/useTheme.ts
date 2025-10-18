import { useContext } from "react";
import { ThemeContext } from "../contexts/theme/theme-context";
import type { ThemeContextType } from "../types/theme";

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function useThemeState() {
  const { theme, isDark } = useTheme();
  return { theme, isDark };
}

export function useThemeActions() {
  const { setTheme, toggleTheme } = useTheme();
  return { setTheme, toggleTheme };
}

export function useAccent() {
  const { accent, setAccent } = useTheme();
  return { accent, setAccent };
}
