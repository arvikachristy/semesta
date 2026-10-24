export const ThemeId = { Rose: 'rose', Midnight: 'midnight' } as const;
export type TThemeId = (typeof ThemeId)[keyof typeof ThemeId];

export const themeStorage = { key: 'semesta.theme', event: 'semesta:themechange' } as const;

export const isTheme = (value: string | null): value is TThemeId =>
  value === ThemeId.Rose || value === ThemeId.Midnight;

export const getTheme = (): TThemeId => {
  const current = document.documentElement.dataset.theme ?? null;
  return isTheme(current) ? current : ThemeId.Rose;
};

export const initializeTheme = () => {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(themeStorage.key);
  } catch {
    // Private browsing may prevent storage access.
  }
  document.documentElement.dataset.theme = isTheme(saved) ? saved : ThemeId.Rose;
};

export const setTheme = (theme: TThemeId) => {
  if (getTheme() === theme) {
    return;
  }
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(themeStorage.key, theme);
  } catch {
    // Keep the live theme even when persistence is blocked.
  }
  window.dispatchEvent(new Event(themeStorage.event));
};

export const subscribeTheme = (callback: () => void) => {
  window.addEventListener(themeStorage.event, callback);
  return () => window.removeEventListener(themeStorage.event, callback);
};
