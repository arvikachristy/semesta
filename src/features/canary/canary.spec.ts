// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createAppStore } from '../../app/store';
import { CanaryIDs } from './canary-registry';
import { selectCanaryEnabled } from './canary-selectors';
import { setCanary } from './canary-slice';
import { canaryStorage, readCanaryOverrides } from './canary-storage';
import { isDevMode } from './use-dev-mode';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
});

describe('Canary feature flags', () => {
  it('does not enable an experiment for public visitors despite saved preferences', () => {
    const store = createAppStore();
    store.dispatch(setCanary({ id: CanaryIDs.TRIP_STUDIO, enabled: true }));
    expect(selectCanaryEnabled(store.getState(), CanaryIDs.TRIP_STUDIO, false)).toBe(false);
    expect(localStorage.getItem(canaryStorage.key)).toContain('"trip-studio":true');
  });

  it('restores selections only when the current URL explicitly enables developer mode', () => {
    const store = createAppStore();
    store.dispatch(setCanary({ id: CanaryIDs.TRIP_STUDIO, enabled: true }));
    const reloaded = createAppStore();
    expect(selectCanaryEnabled(reloaded.getState(), CanaryIDs.TRIP_STUDIO, true)).toBe(true);
    expect(selectCanaryEnabled(reloaded.getState(), CanaryIDs.TRIP_STUDIO, false)).toBe(false);
  });

  it('ignores legacy session flags and requires the exact devmode=true URL parameter', () => {
    sessionStorage.setItem('semesta.devmode', 'true');
    expect(isDevMode(window.location.search)).toBe(false);
    expect(isDevMode('?devmode=false')).toBe(false);
    expect(isDevMode('?devmode=1')).toBe(false);
    expect(isDevMode('?devmode=true')).toBe(true);
  });

  it('ignores unknown, malformed or future-version overrides', () => {
    localStorage.setItem(
      canaryStorage.key,
      JSON.stringify({ version: 1, overrides: { 'trip-studio': true, unknown: true } }),
    );
    expect(readCanaryOverrides()).toEqual({ 'trip-studio': true });
    localStorage.setItem(canaryStorage.key, 'not json');
    expect(readCanaryOverrides()).toEqual({});
    localStorage.setItem(canaryStorage.key, JSON.stringify({ version: 99, overrides: {} }));
    expect(readCanaryOverrides()).toEqual({});
  });
});
