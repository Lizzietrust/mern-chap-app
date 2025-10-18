import { ThemeContext } from "./theme-context";
import { useThemeLogic } from "../../hooks/useThemeLogic";
import type { ThemeProviderProps } from "../../types/theme";

export function ThemeProvider({
  children,
  defaultTheme = "light",
  defaultAccent = "blue",
}: ThemeProviderProps) {
  const themeLogic = useThemeLogic({ defaultTheme, defaultAccent });

  return (
    <ThemeContext.Provider value={themeLogic}>{children}</ThemeContext.Provider>
  );
}
