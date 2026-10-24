export const ThemeId = {
  Rose: 'rose',
  Midnight: 'midnight',
} as const;

export type TTheme = (typeof ThemeId)[keyof typeof ThemeId];

export const themeStorage = { key: 'semesta.theme.v1' } as const;

export const readStoredTheme = (): TTheme => {
  try {
    return window.localStorage.getItem(themeStorage.key) === ThemeId.Midnight
      ? ThemeId.Midnight
      : ThemeId.Rose;
  } catch {
    return ThemeId.Rose;
  }
};

export const applyTheme = (theme: TTheme) => {
  document.documentElement.dataset.theme = theme;
};

export const saveStoredTheme = (theme: TTheme) => {
  try {
    window.localStorage.setItem(themeStorage.key, theme);
  } catch {
    // The current session can still switch themes when storage is unavailable.
  }
};
