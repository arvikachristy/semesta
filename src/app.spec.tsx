// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { startPlayground } from './three/playground';
import { CountryList } from './types/country';
import { ContinentId } from './types/continent';
import { CountryStatus } from './types/country-status';
import { selectionStorage } from './storage/country-selection';
import { wishlistStorage } from './storage/country-wishlist';
import { tripStorage } from './storage/trips';
import { emptyTripDetails } from './types/trip';
vi.mock('./three/playground', () => ({ startPlayground: vi.fn() }));
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
const setCountries = vi.fn(async () => {});
const dispose = vi.fn();
const click = async (selector: string) => {
  const item = host.querySelector(selector);
  if (!(item instanceof HTMLElement)) {
    throw new Error(`Missing ${selector}`);
  }
  await act(async () => item.click());
};
const clickText = async (text: string) => {
  const button = [...host.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === text,
  );
  if (!button) {
    throw new Error(`Missing ${text}`);
  }
  await act(async () => button.click());
};
beforeEach(() => {
  for (const [method, open] of [
    ['show', true],
    ['showModal', true],
    ['close', false],
  ] as const) {
    Object.defineProperty(HTMLDialogElement.prototype, method, {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = open;
      },
    });
  }
  localStorage.clear();
  vi.stubGlobal('innerWidth', 1280);
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

describe('visited world, wishes and trips', () => {
  it('keeps legacy visits intact while a wish becomes a minimal trip and restores country context', async () => {
    localStorage.setItem(
      selectionStorage.key,
      JSON.stringify({ version: 1, selectedCountryIds: [CountryList.France] }),
    );
    await act(async () => root.render(<App />));
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.France], false);
    await act(async () =>
      vi.mocked(startPlayground).mock.calls[0][1]?.onContinentSelect?.(ContinentId.SouthAmerica),
    );
    await clickText('Bucket list');
    await click('button[aria-label="Save Peru to bucket list"]');
    expect(JSON.parse(localStorage.getItem(wishlistStorage.key) ?? '{}').countryIds).toEqual([
      CountryList.Peru,
    ]);
    expect(
      JSON.parse(localStorage.getItem(selectionStorage.key) ?? '{}').selectedCountryIds,
    ).toEqual([CountryList.France]);
    await clickText('Plan trip');
    expect(host.querySelector('section[aria-label="Trip Studio"] h1')?.textContent).toBe(
      'Peru trip',
    );
    expect(host.querySelector('section[aria-label="Trip Studio"] form')).toBeNull();
    expect(setCountries).toHaveBeenCalledOnce();
    const trips = JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips;
    expect(trips[0]).toMatchObject({ countryIds: [CountryList.Peru], startDate: '', endDate: '' });
    await clickText('‹ Back to South America');
    expect(host.querySelector('section[aria-label="Country actions"]')).toBeNull();
    expect(host.querySelector('footer[aria-label="Country actions"]')?.textContent).toContain(
      'Peru',
    );
    await clickText('Plan a new trip');
    expect(JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips).toHaveLength(2);
    expect(startPlayground).toHaveBeenCalledOnce();
  });
  it('undo restores both a visit and the wish fulfilled by that visit', async () => {
    localStorage.setItem(
      wishlistStorage.key,
      JSON.stringify({ version: 1, countryIds: [CountryList.Peru] }),
    );
    await act(async () => root.render(<App />));
    await act(async () =>
      vi.mocked(startPlayground).mock.calls[0][1]?.onContinentSelect?.(ContinentId.SouthAmerica),
    );
    await click('button[aria-label="Mark Peru visited"]');
    expect(JSON.parse(localStorage.getItem(wishlistStorage.key) ?? '{}').countryIds).toEqual([]);
    await clickText('Undo');
    expect(JSON.parse(localStorage.getItem(wishlistStorage.key) ?? '{}').countryIds).toEqual([
      CountryList.Peru,
    ]);
    expect(
      JSON.parse(localStorage.getItem(selectionStorage.key) ?? '{}').selectedCountryIds,
    ).not.toContain(CountryList.Peru);
  });
  it('confirms only selected destinations, fulfills their wishes and records repeat visits without duplicate jellies', async () => {
    const trip = {
      ...emptyTripDetails,
      id: 'journey',
      name: 'Two countries',
      countryIds: [CountryList.France, CountryList.Peru],
    };
    localStorage.setItem(tripStorage.key, JSON.stringify({ version: 1, trips: [trip] }));
    localStorage.setItem(
      wishlistStorage.key,
      JSON.stringify({ version: 1, countryIds: [CountryList.France, CountryList.Peru] }),
    );
    await act(async () => root.render(<App />));
    await click('button[aria-label="Open Two countries"]');
    await clickText('Mark countries visited');
    await click('dialog[aria-label="Which countries did you visit?"] input');
    await clickText('Confirm visits');
    expect(host.querySelector('section[aria-label="Trip Studio"]')).toBeNull();
    expect(
      JSON.parse(localStorage.getItem(selectionStorage.key) ?? '{}').selectedCountryIds,
    ).toEqual([CountryList.Indonesia, CountryList.Peru]);
    expect(JSON.parse(localStorage.getItem(wishlistStorage.key) ?? '{}').countryIds).toEqual([
      CountryList.France,
    ]);
    expect(
      JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0].visitedCountryIds,
    ).toEqual([CountryList.Peru]);
    await click('button[aria-label="Open Two countries"]');
    await clickText('Mark countries visited');
    await click('dialog[aria-label="Which countries did you visit?"] input');
    await clickText('Confirm visits');
    expect(
      JSON.parse(localStorage.getItem(selectionStorage.key) ?? '{}').selectedCountryIds,
    ).toEqual([CountryList.Indonesia, CountryList.Peru]);
    expect(host.textContent).toContain('Your collection is up to date');
  });
  it('opens a jelly country and preserves the same canvas after Studio', async () => {
    await act(async () => root.render(<App />));
    const canvas = host.querySelector('canvas');
    await act(async () =>
      vi.mocked(startPlayground).mock.calls[0][1]?.onCountrySelect?.(CountryList.Indonesia),
    );
    expect(host.querySelector('footer[aria-label="Country actions"]')?.textContent).toContain(
      'Indonesia',
    );
    await clickText('Plan trip');
    await click('section[aria-label="Trip Studio"] button');
    expect(host.querySelector('canvas')).toBe(canvas);
    expect(startPlayground).toHaveBeenCalledOnce();
  });
  it('keeps one mobile sheet active and preserves an existing trip editor draft across tabs', async () => {
    vi.stubGlobal('innerWidth', 390);
    await act(async () => root.render(<App />));
    const shell = host.querySelector('dialog');
    await click('nav button:nth-child(2)');
    await click('button[aria-label="New trip"]');
    const input = host.querySelector('form input');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Missing name');
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
    await click('nav button:nth-child(2)');
    expect(input.value).toBe('Summer plans');
    await click('button[aria-label="Close sheet"]');
    expect(shell?.getAttribute('data-active')).toBe('');
    await click('nav button:nth-child(2)');
    expect(host.querySelector('form input')).toBe(input);
  });
  it('restores an intentionally empty visited selection without adding wishlist jellies', async () => {
    localStorage.setItem(
      selectionStorage.key,
      JSON.stringify({ version: 1, selectedCountryIds: [] }),
    );
    localStorage.setItem(
      wishlistStorage.key,
      JSON.stringify({ version: 1, countryIds: [CountryList.Peru] }),
    );
    await act(async () => root.render(<App />));
    expect(setCountries).toHaveBeenLastCalledWith([], false);
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
    await act(async () =>
      vi.mocked(startPlayground).mock.calls[0][1]?.onContinentSelect?.(ContinentId.Asia),
    );
    expect(host.querySelector('section[aria-label="Country collection"]')).toBeNull();
  });
});
