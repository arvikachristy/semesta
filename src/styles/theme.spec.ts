// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { applyTheme, readStoredTheme, ThemeId } from './theme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('appearance', () => {
  it('defaults to Rose and persists an explicit Midnight selection', () => {
    expect(readStoredTheme()).toBe(ThemeId.Rose);
    applyTheme(ThemeId.Midnight);
    expect(document.documentElement.dataset.theme).toBe(ThemeId.Midnight);
    expect(readStoredTheme()).toBe(ThemeId.Midnight);
    applyTheme(ThemeId.Rose);
    expect(readStoredTheme()).toBe(ThemeId.Rose);
  });

  it('ignores an unknown saved theme', () => {
    localStorage.setItem('semesta.theme.v1', 'unknown');
    expect(readStoredTheme()).toBe(ThemeId.Rose);
  });
});
