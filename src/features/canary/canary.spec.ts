// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createAppStore } from '../../app/store';
import { CanaryIDs } from './canary-registry';
import { selectCanaryEnabled } from './canary-selectors';
import { setCanary, setDevMode } from './canary-slice';
import { canaryStorage, readCanaryOverrides } from './canary-storage';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
});

describe('Canary feature flags', () => {
  it('disables Trip Studio for visitors, regardless of persisted beta selection', () => {
    const store = createAppStore();
    store.dispatch(setCanary({ id: CanaryIDs.TRIP_STUDIO, enabled: true }));
    expect(selectCanaryEnabled(store.getState(), CanaryIDs.TRIP_STUDIO)).toBe(false);
    expect(localStorage.getItem(canaryStorage.key)).toContain('"trip-studio":true');
  });

  it('enables selected features only in developer mode and saves the preference', () => {
    const store = createAppStore();
    store.dispatch(setDevMode(true));
    expect(selectCanaryEnabled(store.getState(), CanaryIDs.TRIP_STUDIO)).toBe(false);
    store.dispatch(setCanary({ id: CanaryIDs.TRIP_STUDIO, enabled: true }));
    expect(selectCanaryEnabled(store.getState(), CanaryIDs.TRIP_STUDIO)).toBe(true);
    const reloaded = createAppStore();
    expect(selectCanaryEnabled(reloaded.getState(), CanaryIDs.TRIP_STUDIO)).toBe(true);
    reloaded.dispatch(setDevMode(false));
    expect(selectCanaryEnabled(reloaded.getState(), CanaryIDs.TRIP_STUDIO)).toBe(false);
  });

  it('recognizes the URL switch and ignores unknown, malformed or future storage', () => {
    window.history.replaceState({}, '', '/?devmode=true');
    localStorage.setItem(
      canaryStorage.key,
      JSON.stringify({ version: 1, overrides: { 'trip-studio': true, unknown: true } }),
    );
    const store = createAppStore();
    expect(selectCanaryEnabled(store.getState(), CanaryIDs.TRIP_STUDIO)).toBe(true);
    expect(readCanaryOverrides()).toEqual({ 'trip-studio': true });
    localStorage.setItem(canaryStorage.key, 'not json');
    expect(readCanaryOverrides()).toEqual({});
    localStorage.setItem(canaryStorage.key, JSON.stringify({ version: 99, overrides: {} }));
    expect(readCanaryOverrides()).toEqual({});
  });
});
