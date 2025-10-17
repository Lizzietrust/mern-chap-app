import { useTheme } from "../../contexts/ThemeContext";
import { SunIcon, MoonIcon } from "./icons/ThemeIcons";
import { themeToggleStyles } from "../../styles/themeToggleStyles";

export function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={themeToggleStyles.button(isDark)}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      type="button"
    >
      {isDark ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </button>
  );
}
