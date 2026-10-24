export const ThemeId = {
  Rose: 'rose',
  Midnight: 'midnight',
} as const;

export type TTheme = (typeof ThemeId)[keyof typeof ThemeId];

const themeKey = 'semesta.theme.v1';

export const readStoredTheme = (): TTheme => {
  try {
    return window.localStorage.getItem(themeKey) === ThemeId.Midnight
      ? ThemeId.Midnight
      : ThemeId.Rose;
  } catch {
    return ThemeId.Rose;
  }
};

export const applyTheme = (theme: TTheme) => {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(themeKey, theme);
  } catch {
    // The current session can still switch themes when storage is unavailable.
  }
};
