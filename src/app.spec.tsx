// @vitest-environment jsdom
import { FrameStatus } from './performance/frame-monitor';
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { startPlayground } from './three/playground';
import { CountryList } from './types/country';
import { CountryStatus } from './types/country-status';
import { selectionStorage } from './storage/country-selection';
import { tripStorage } from './storage/trips';
import { emptyTripDetails } from './types/trip';

vi.mock('./three/playground', () => ({ startPlayground: vi.fn() }));
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
const setCountries = vi.fn(async () => {});
const dispose = vi.fn();
const click = async (query: string) => {
  const element = host.querySelector(query);
  if (!(element instanceof HTMLElement)) {
    throw new Error('Missing checklist control');
  }
  await act(async () => element.click());
};
beforeEach(() => {
  // jsdom has no dialog implementation; browser tests verify native modal behaviour.
  Object.defineProperties(HTMLDialogElement.prototype, {
    show: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true;
      },
    },
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true;
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false;
      },
    },
  });
  localStorage.clear();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.mocked(startPlayground).mockReturnValue({ setCountries, dispose });
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  for (const method of ['show', 'showModal', 'close']) {
    Reflect.deleteProperty(HTMLDialogElement.prototype, method);
  }
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('application selection state', () => {
  it('opens Trip Studio and restores the collection without recreating the canvas', async () => {
    localStorage.setItem(
      tripStorage.key,
      JSON.stringify({
        version: tripStorage.version,
        trips: [
          {
            ...emptyTripDetails,
            id: 'studio',
            name: 'France trip',
            countryIds: [CountryList.France],
          },
        ],
      }),
    );
    await act(async () => root.render(<App />));
    const canvas = host.querySelector('canvas');
    const tripsBefore = localStorage.getItem(tripStorage.key);
    await click('button[aria-label="Open France trip"]');
    expect(host.querySelector('section[aria-label="Trip Studio"]')).not.toBeNull();
    expect(host.querySelector('section[aria-label="Trip details"]')).toBeNull();
    expect(host.textContent).not.toContain('Open Trip Studio');
    expect(host.querySelector('aside[aria-label="Upcoming trips"] section')).toBeNull();
    expect(canvas?.closest('[hidden]')).not.toBeNull();
    await click('section[aria-label="Trip Studio"] button');
    expect(host.querySelector('section[aria-label="Trip Studio"]')).toBeNull();
    expect(host.querySelector('canvas')).toBe(canvas);
    expect(canvas?.closest('[hidden]')).toBeNull();
    expect(host.querySelector('aside[aria-label="Upcoming trips"] ol')).not.toBeNull();
    expect(host.querySelector('aside[aria-label="Upcoming trips"] section')).toBeNull();
    expect(startPlayground).toHaveBeenCalledOnce();
    expect(localStorage.getItem(tripStorage.key)).toBe(tripsBefore);
  });
  it('opens one mobile sheet at a time and preserves a trip draft after switching and closing', async () => {
    vi.stubGlobal('innerWidth', 390);
    await act(async () => root.render(<App />));
    const shell = host.querySelector('dialog');
    expect(shell?.getAttribute('data-active')).toBe('');
    await click('nav button:nth-child(2)');
    expect(shell?.getAttribute('data-active')).toBe('trips');
    await click('button[aria-label="New trip"]');
    const input = host.querySelector('form input');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Missing trip name');
    }
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(
        input,
        'Summer plans',
      );
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await click('nav button:first-child');
    expect(shell?.getAttribute('data-active')).toBe('countries');
    expect(host.querySelector('.country-checklist')).not.toBeNull();
    await click('nav button:nth-child(2)');
    expect(input.value).toBe('Summer plans');
    await click('button[aria-label="Close sheet"]');
    expect(shell?.getAttribute('data-active')).toBe('');
    await click('nav button:nth-child(2)');
    expect(host.querySelector('form input')).toBe(input);
    expect(input.value).toBe('Summer plans');
    expect(startPlayground).toHaveBeenCalledOnce();
  });

  it('keeps trip planning independent of the renderer and selected jellies', async () => {
    await act(async () => root.render(<App />));
    const initialCalls = setCountries.mock.calls.length;
    const initialSelection = localStorage.getItem(selectionStorage.key);
    const tripPanel = host.querySelector('aside[aria-label="Upcoming trips"]');
    const newTrip = [...(tripPanel?.querySelectorAll('button') ?? [])].find(
      (button) => button.getAttribute('aria-label') === 'New trip',
    );
    if (!newTrip) {
      throw new Error('Missing new trip action');
    }
    await act(async () => newTrip.click());
    expect(tripPanel?.querySelector('form')).not.toBeNull();
    expect(startPlayground).toHaveBeenCalledOnce();
    expect(setCountries.mock.calls).toHaveLength(initialCalls);
    expect(localStorage.getItem(selectionStorage.key)).toBe(initialSelection);
  });
  it('restores an intentionally empty selection before reconciling the scene', async () => {
    localStorage.setItem(
      selectionStorage.key,
      JSON.stringify({
        version: selectionStorage.version,
        selectedCountryIds: [],
      }),
    );
    await act(async () => root.render(<App />));
    expect(setCountries).toHaveBeenCalledOnce();
    expect(setCountries).toHaveBeenLastCalledWith([]);
  });
  it('restores saved IDs and persists checkbox changes', async () => {
    localStorage.setItem(
      selectionStorage.key,
      JSON.stringify({
        version: selectionStorage.version,
        selectedCountryIds: [CountryList.France],
      }),
    );
    await act(async () => root.render(<App />));
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.France]);
    await click('button');
    await click(`input[value="${CountryList.France}"]`);
    expect(
      JSON.parse(localStorage.getItem(selectionStorage.key) ?? '{}').selectedCountryIds,
    ).toEqual([]);
  });
  it('updates the diagnostic token without recreating the scene', async () => {
    await act(async () => root.render(<App />));
    await act(async () =>
      vi.mocked(startPlayground).mock.calls[0][1]?.onFrameReading?.({
        fps: 24,
        frameMs: 1000 / 24,
        status: FrameStatus.Bad,
      }),
    );
    expect(host.querySelector('.fps-token')?.textContent).toContain('24');
    expect(host.querySelector('.fps-token')?.textContent).toContain('Potato mode');
    expect(startPlayground).toHaveBeenCalledOnce();
  });
  it('reconciles the enum array without reinitializing the scene and retains failed selections for retry', async () => {
    await act(async () => root.render(<App />));
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.Indonesia]);
    await click('button');
    await click(`input[value="${CountryList.France}"]`);
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.Indonesia, CountryList.France]);
    expect(startPlayground).toHaveBeenCalledOnce();
    await act(async () =>
      vi
        .mocked(startPlayground)
        .mock.calls[0][1]?.onCountryStatus?.(CountryList.France, CountryStatus.Error),
    );
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.Indonesia, CountryList.France]);
    expect(host.textContent).toContain('Could not load. Untick and tick to retry.');
    await click(`input[value="${CountryList.France}"]`);
    await click(`input[value="${CountryList.France}"]`);
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.Indonesia, CountryList.France]);
  });
  it('ignores callbacks from the disposed Strict Mode scene', async () => {
    await act(async () =>
      root.render(
        <StrictMode>
          <App />
        </StrictMode>,
      ),
    );
    expect(startPlayground).toHaveBeenCalledTimes(2);
    expect(dispose).toHaveBeenCalledOnce();
    await act(async () =>
      vi
        .mocked(startPlayground)
        .mock.calls[0][1]?.onCountryStatus?.(CountryList.Indonesia, CountryStatus.Error),
    );
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.Indonesia]);
  });
});
