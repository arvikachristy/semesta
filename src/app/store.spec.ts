// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createAppStore } from './store';
import { setTheme } from '../styles/theme-slice';
import { themeStorage, ThemeId } from '../styles/theme';

beforeEach(() => localStorage.clear());

describe('theme state', () => {
  it('starts in Rose and persists Redux changes for the next store', () => {
    const store = createAppStore();
    expect(store.getState().theme.current).toBe(ThemeId.Rose);
    expect(localStorage.getItem(themeStorage.key)).toBeNull();

    store.dispatch(setTheme(ThemeId.Midnight));
    expect(store.getState().theme.current).toBe(ThemeId.Midnight);
    expect(localStorage.getItem(themeStorage.key)).toBe(ThemeId.Midnight);
    expect(createAppStore().getState().theme.current).toBe(ThemeId.Midnight);

    store.dispatch(setTheme(ThemeId.Rose));
    expect(createAppStore().getState().theme.current).toBe(ThemeId.Rose);
  });

  it('falls back to Rose for an invalid saved theme', () => {
    localStorage.setItem(themeStorage.key, 'unknown');
    expect(createAppStore().getState().theme.current).toBe(ThemeId.Rose);
  });
});
