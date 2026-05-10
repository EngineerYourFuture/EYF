export type ThemeMode = "light" | "dark";

const THEME_KEY = "eyf.theme";

const applyThemeClass = (theme: ThemeMode): void => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
};

export const getTheme = (): ThemeMode => {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return "dark";
};

export const setTheme = (theme: ThemeMode): void => {
  localStorage.setItem(THEME_KEY, theme);
  applyThemeClass(theme);
};

export const toggleTheme = (): ThemeMode => {
  const next: ThemeMode = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
};

export const initTheme = (): ThemeMode => {
  const theme = getTheme();
  applyThemeClass(theme);
  return theme;
};
