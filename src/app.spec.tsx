// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Provider } from 'react-redux';
import { createAppStore } from './redux/store';
import { setCanary } from './redux/canary/slice';
import { CanaryIDs } from './features/canary/canary-registry';
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
import { ThemeId } from './styles/theme';
import { setTheme } from './redux/theme/slice';
vi.mock('./three/playground', () => ({ startPlayground: vi.fn() }));
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
let store: ReturnType<typeof createAppStore>;
const setCountries = vi.fn(async () => {});
const dispose = vi.fn();
const setSceneTheme = vi.fn();
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
const renderApp = async () =>
  act(async () =>
    root.render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>,
    ),
  );
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
  sessionStorage.clear();
  window.history.replaceState({}, '', '/?devmode=true');
  store = createAppStore();
  store.dispatch(setCanary({ id: CanaryIDs.TRIP_STUDIO, enabled: true }));
  vi.stubGlobal('innerWidth', 1280);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  document.documentElement.removeAttribute('data-theme');
  vi.mocked(startPlayground).mockReturnValue({ setCountries, dispose, setTheme: setSceneTheme });
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  document.documentElement.removeAttribute('data-theme');
  for (const method of ['show', 'showModal', 'close']) {
    Reflect.deleteProperty(HTMLDialogElement.prototype, method);
  }
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('theme switcher', () => {
  it('switches the current page between Rose and Midnight without rebuilding Three.js', async () => {
    await renderApp();
    const canvas = host.querySelector('canvas');
    expect(document.documentElement.dataset.theme).toBe('rose');
    expect(store.getState().theme.current).toBe(ThemeId.Rose);
    await click(
      'nav[aria-label="Desktop navigation"] button[aria-label="Switch to Midnight Navy"]',
    );
    expect(document.documentElement.dataset.theme).toBe('midnight');
    expect(store.getState().theme.current).toBe(ThemeId.Midnight);
    expect(localStorage.getItem('semesta.theme.v1')).toBe('midnight');
    expect(setSceneTheme).toHaveBeenCalledOnce();
    expect(startPlayground).toHaveBeenCalledOnce();
    expect(host.querySelector('canvas')).toBe(canvas);
    await click('nav[aria-label="Desktop navigation"] button[aria-label="Switch to Rose"]');
    expect(document.documentElement.dataset.theme).toBe('rose');
    expect(store.getState().theme.current).toBe(ThemeId.Rose);
    expect(startPlayground).toHaveBeenCalledOnce();
    expect(setSceneTheme).toHaveBeenCalledTimes(2);
  });

  it('applies a theme dispatched elsewhere without recreating the scene', async () => {
    await renderApp();
    await act(async () => store.dispatch(setTheme(ThemeId.Midnight)));
    expect(document.documentElement.dataset.theme).toBe(ThemeId.Midnight);
    expect(setSceneTheme).toHaveBeenCalledOnce();
    expect(startPlayground).toHaveBeenCalledOnce();
  });
});

describe('visited world, wishes and trips', () => {
  it('keeps the desktop country sidebar beside the live scene', async () => {
    await renderApp();
    const canvas = host.querySelector('canvas');
    expect(host.querySelector('nav[aria-label="Desktop navigation"]')).not.toBeNull();
    expect(host.querySelector('dialog[aria-label="All countries"]')).toBeNull();
    expect(host.querySelector('[data-country-open="true"]')).toBeNull();

    await click('nav[aria-label="Desktop navigation"] button[aria-label="Countries"]');
    const sidebar = host.querySelector('dialog[aria-label="All countries"]');
    expect(sidebar?.getAttribute('aria-modal')).toBeNull();
    expect(sidebar?.querySelector('[data-country-sidebar]')).not.toBeNull();
    expect(host.querySelector('[data-country-open="true"]')).not.toBeNull();

    await click('button[aria-label="Mark Peru visited"]');
    expect(setCountries).toHaveBeenLastCalledWith(
      expect.arrayContaining([CountryList.Peru]),
      false,
    );
    expect(host.querySelector('canvas')).toBe(canvas);
    expect(startPlayground).toHaveBeenCalledOnce();

    await click('button[aria-label="Close countries"]');
    expect(host.querySelector('[data-country-open="true"]')).toBeNull();
    expect(host.querySelector('canvas')).toBe(canvas);
  });
  it('opens account and countries from the desktop icon rail and retains mobile navigation on resize', async () => {
    await renderApp();
    const rail = host.querySelector('nav[aria-label="Desktop navigation"]');
    expect([...(rail?.querySelectorAll('button') ?? [])].map((button) => button.ariaLabel)).toEqual(
      ['Countries', 'Trips', 'Switch to Midnight Navy', 'Account'],
    );
    expect(host.querySelector('.country-selector')?.hasAttribute('hidden')).toBe(true);
    await click('nav[aria-label="Desktop navigation"] button[aria-label="Account"]');
    const accountDialog = host.querySelector('dialog[aria-label="Account backup"]');
    expect(accountDialog?.hasAttribute('open')).toBe(true);
    await clickText('Close');
    expect(accountDialog?.hasAttribute('open')).toBe(false);
    await click('nav[aria-label="Desktop navigation"] button[aria-label="Countries"]');
    expect(host.querySelector('dialog[aria-label="All countries"]')).not.toBeNull();
    await click('button[aria-label="Close countries"]');
    await click('nav[aria-label="Desktop navigation"] button[aria-label="Trips"]');
    expect(host.querySelector('aside[aria-label="Upcoming trips"]')?.hasAttribute('hidden')).toBe(
      false,
    );
    await click('button[aria-label="Close trips"]');
    expect(host.querySelector('aside[aria-label="Upcoming trips"]')?.hasAttribute('hidden')).toBe(
      true,
    );
    await act(async () => {
      vi.stubGlobal('innerWidth', 390);
      window.dispatchEvent(new Event('resize'));
    });
    expect(host.querySelector('nav[aria-label="Desktop navigation"]')).toBeNull();
    expect(
      host.querySelector('button[data-studio-open="false"][aria-label="Switch to Midnight Navy"]'),
    ).not.toBeNull();
    const mobileBar = host.querySelector('nav[aria-label="Explore and plan"]');
    expect(mobileBar?.hasAttribute('hidden')).toBe(false);
    expect(mobileBar?.textContent).toContain('Account');
  });
  it('opens a saved trip directly from its Studio URL', async () => {
    const trip = { ...emptyTripDetails, id: 'deep-link-trip', name: 'Lisbon' };
    localStorage.setItem(tripStorage.key, JSON.stringify({ version: 1, trips: [trip] }));
    window.history.replaceState({}, '', `/trips/${trip.id}?devmode=true`);

    await renderApp();

    expect(host.querySelector('section[aria-label="Trip Studio"] h1')?.textContent).toBe('Lisbon');
    expect(window.location.pathname).toBe(`/trips/${trip.id}`);
    await clickText('‹ Back to trips');
    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('?devmode=true');
    expect(host.textContent).toContain('Upcoming trips');
  });
  it('serves the full-page Trip Studio route without starting the WebGL scene', async () => {
    const trip = { ...emptyTripDetails, id: 'accessible-trip', name: 'Lisbon' };
    localStorage.setItem(tripStorage.key, JSON.stringify({ version: 1, trips: [trip] }));
    window.history.replaceState({}, '', '/tripstudio?devmode=true');

    await renderApp();

    expect(startPlayground).not.toHaveBeenCalled();
    expect(host.querySelector('canvas')).toBeNull();
    expect(
      host.querySelector('aside[aria-label="Upcoming trips"][data-full-page="true"]'),
    ).not.toBe(null);
    await click('button[aria-label="Open Lisbon"]');
    expect(window.location.pathname).toBe(`/tripstudio/${trip.id}`);
    expect(window.location.search).toBe('?devmode=true');
    expect(host.querySelector('section[aria-label="Trip Studio"] h1')?.textContent).toBe('Lisbon');
    expect(startPlayground).not.toHaveBeenCalled();
    await clickText('‹ Back to trips');
    expect(window.location.pathname).toBe('/tripstudio');
  });
  it('keeps legacy visits intact while a wish becomes a minimal trip and restores country context', async () => {
    localStorage.setItem(
      selectionStorage.key,
      JSON.stringify({ version: 1, selectedCountryIds: [CountryList.France] }),
    );
    await renderApp();
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
    expect(trips[0].id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(window.location.pathname).toBe(`/trips/${trips[0].id}`);
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
    await renderApp();
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
    await renderApp();
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
    await renderApp();
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
    await renderApp();
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
    await click('button[aria-label="Back to trips"]');
    expect(shell?.getAttribute('data-active')).toBe('trips');
    expect(host.querySelector('aside[aria-label="Upcoming trips"] form')).toBeNull();
    await click('button[aria-label="Close sheet"]');
    expect(shell?.getAttribute('data-active')).toBe('');
    await click('nav button:nth-child(2)');
    expect(host.querySelector('aside[aria-label="Upcoming trips"] form')).toBeNull();
    expect(host.querySelector('button[aria-label="New trip"]')).not.toBeNull();
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
    await renderApp();
    expect(setCountries).toHaveBeenLastCalledWith([], false);
  });
  it('ignores callbacks from the disposed Strict Mode scene', async () => {
    await act(async () =>
      root.render(
        <StrictMode>
          <Provider store={store}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </Provider>
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

describe('Canary route and navigation protection', () => {
  it('hides Trip Studio navigation, country actions and Lab controls for visitors', async () => {
    window.history.replaceState({}, '', '/');
    await renderApp();
    expect(host.querySelector('button[aria-label="Open Canary features"]')).toBeNull();
    expect(host.textContent).not.toContain('Upcoming trips');
    await act(async () =>
      vi.mocked(startPlayground).mock.calls[0][1]?.onCountrySelect?.(CountryList.Indonesia),
    );
    expect(host.textContent).not.toContain('Plan trip');
  });

  it('does not expose Labs when a previous developer session exists without the URL flag', async () => {
    sessionStorage.setItem('semesta.devmode', 'true');
    store.dispatch(setCanary({ id: CanaryIDs.TRIP_STUDIO, enabled: true }));
    window.history.replaceState({}, '', '/');
    await renderApp();
    expect(host.querySelector('button[aria-label="Open Canary features"]')).toBeNull();
    expect(host.textContent).not.toContain('Upcoming trips');
  });

  it('removes Labs and Trip Studio when the developer query is removed within the app', async () => {
    await renderApp();
    expect(host.querySelector('button[aria-label="Open Canary features"]')).not.toBeNull();
    expect(host.textContent).toContain('Upcoming trips');
    await act(async () => {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(host.querySelector('button[aria-label="Open Canary features"]')).toBeNull();
    expect(host.textContent).not.toContain('Upcoming trips');
  });

  it('redirects a direct Trip Studio URL while disabled without losing saved trips', async () => {
    const trip = { ...emptyTripDetails, id: 'protected-trip', name: 'Saved itinerary' };
    localStorage.setItem(tripStorage.key, JSON.stringify({ version: 1, trips: [trip] }));
    window.history.replaceState({}, '', '/tripstudio/protected-trip');
    await renderApp();
    expect(window.location.pathname).toBe('/');
    expect(host.querySelector('section[aria-label="Trip Studio"]')).toBeNull();
    expect(JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0].id).toBe(trip.id);
  });

  it('shows the Labs control in developer mode and enables the Studio only when checked', async () => {
    store.dispatch(setCanary({ id: CanaryIDs.TRIP_STUDIO, enabled: false }));
    await renderApp();
    await click('button[aria-label="Open Canary features"]');
    const checkbox = host.querySelector(
      'aside[aria-label="Canary features"] input[type="checkbox"]',
    );
    expect(checkbox).not.toBeNull();
    if (!(checkbox instanceof HTMLInputElement)) {
      throw new Error('Missing Canary feature checkbox');
    }
    await act(async () => checkbox.click());
    expect(host.textContent).toContain('Upcoming trips');
    expect(checkbox.checked).toBe(true);
  });
});
