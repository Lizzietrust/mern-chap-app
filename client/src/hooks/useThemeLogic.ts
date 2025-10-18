import { useState, useEffect, useCallback, useMemo } from "react";
import type { Theme, Accent } from "../types/theme";
import {
  THEMES,
  ACCENTS,
  STORAGE_KEYS,
  THEME_COLORS,
  ACCENT_CLASSES,
} from "../constants/theme";

interface UseThemeLogicProps {
  defaultTheme?: Theme;
  defaultAccent?: Accent;
}

export function useThemeLogic({
  defaultTheme = THEMES.LIGHT,
  defaultAccent = ACCENTS.BLUE,
}: UseThemeLogicProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getInitialTheme(defaultTheme)
  );
  const [accent, setAccentState] = useState<Accent>(() =>
    getInitialAccent(defaultAccent)
  );

  const isDark = useMemo(() => theme === THEMES.DARK, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
  }, [theme, setTheme]);

  const setAccent = useCallback((newAccent: Accent) => {
    setAccentState(newAccent);
    localStorage.setItem(STORAGE_KEYS.ACCENT, newAccent);
  }, []);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    applyAccentToDocument(accent);
  }, [accent]);

  useEffect(() => {
    return setupSystemThemeListener(setTheme);
  }, [setTheme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
    accent,
    setAccent,
  };
}

function getInitialTheme(defaultTheme: Theme): Theme {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME) as Theme;
  if (saved && Object.values(THEMES).includes(saved)) {
    return saved;
  }

  if (defaultTheme === THEMES.SYSTEM) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? THEMES.DARK
      : THEMES.LIGHT;
  }

  return defaultTheme;
}

function getInitialAccent(defaultAccent: Accent): Accent {
  const saved = localStorage.getItem(STORAGE_KEYS.ACCENT) as Accent;
  if (saved && Object.values(ACCENTS).includes(saved)) {
    return saved;
  }
  return defaultAccent;
}

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove(THEMES.LIGHT, THEMES.DARK);

  const effectiveTheme =
    theme === THEMES.SYSTEM
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? THEMES.DARK
        : THEMES.LIGHT
      : theme;

  root.classList.add(effectiveTheme);

  updateMetaThemeColor(effectiveTheme);
}

function applyAccentToDocument(accent: Accent) {
  const root = document.documentElement;
  root.classList.remove(...ACCENT_CLASSES);
  root.classList.add(`accent-${accent}`);
}

function updateMetaThemeColor(theme: "light" | "dark") {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      "content",
      THEME_COLORS[theme.toUpperCase() as keyof typeof THEME_COLORS]
    );
  }
}

function setupSystemThemeListener(setTheme: (theme: Theme) => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = (e: MediaQueryListEvent) => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);

    if (!savedTheme) {
      setTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
    }
  };

  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
}
