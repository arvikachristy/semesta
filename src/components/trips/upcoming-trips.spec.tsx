// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UpcomingTrips } from './upcoming-trips';
import { tripStorage } from '../../storage/trips';
import { selectionStorage } from '../../storage/country-selection';
import { emptyTripDetails } from '../../types/trip';
import { CountryList } from '../../types/country';

const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
const click = async (text: string) => {
  const button = [...host.querySelectorAll('button')].find(
    (element) =>
      element.textContent?.trim() === text || element.getAttribute('aria-label') === text,
  );
  if (!button) {
    throw new Error(`Missing button: ${text}`);
  }
  await act(async () => button.click());
};
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  localStorage.clear();
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe('upcoming trips panel', () => {
  it('shows at most six country flags in equal radial slices', async () => {
    const countryIds = [
      CountryList.Indonesia,
      CountryList.France,
      CountryList.Germany,
      CountryList.Poland,
      CountryList.Nepal,
      CountryList.Brunei,
      CountryList.Kazakhstan,
    ];
    localStorage.setItem(
      tripStorage.key,
      JSON.stringify({
        version: tripStorage.version,
        trips: [{ ...emptyTripDetails, id: 'multi', name: 'World trip', countryIds }],
      }),
    );
    await act(async () => root.render(<UpcomingTrips />));
    const flags = [...host.querySelectorAll('ol img')];
    expect(flags).toHaveLength(6);
    flags.forEach((flag, index) => {
      expect(flag.getAttribute('style')).toContain(
        `conic-gradient(from ${index * 60}deg, black 0deg 60deg, transparent 60deg 360deg)`,
      );
    });
    expect(flags.some((flag) => flag.getAttribute('src')?.includes('KZ'))).toBe(false);
  });

  it('restores trips, cancels deletion, then removes only the chosen trip', async () => {
    const first = {
      ...emptyTripDetails,
      id: 'first',
      name: 'Indonesia summer',
      countryIds: [CountryList.Indonesia],
    };
    const second = {
      ...emptyTripDetails,
      id: 'second',
      name: 'France autumn',
      countryIds: [CountryList.France],
    };
    localStorage.setItem(
      tripStorage.key,
      JSON.stringify({ version: tripStorage.version, trips: [first, second] }),
    );
    localStorage.setItem(selectionStorage.key, 'unchanged-cups');
    await act(async () => root.render(<UpcomingTrips />));
    expect(host.querySelectorAll('ol li')).toHaveLength(2);
    expect(host.querySelector('h3')).toBeNull();
    await click(`Open ${first.name}`);
    expect(host.querySelector('h3')?.textContent).toBe(first.name);
    await click('Delete trip');
    await click('Keep trip');
    expect(host.querySelector('h3')?.textContent).toBe(first.name);
    await click('Delete trip');
    await click('Delete trip');
    expect(host.querySelectorAll('ol li')).toHaveLength(1);
    await click(`Open ${second.name}`);
    expect(host.querySelector('h3')?.textContent).toBe(second.name);
    expect(JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips).toEqual([second]);
    expect(localStorage.getItem(selectionStorage.key)).toBe('unchanged-cups');
  });
  it('opens an empty editor and cancels without saving a phantom trip', async () => {
    await act(async () => root.render(<UpcomingTrips />));
    await click('New trip');
    expect(host.querySelector('form')).not.toBeNull();
    await click('Cancel');
    expect(host.querySelector('form')).toBeNull();
    expect(localStorage.getItem(tripStorage.key)).toBeNull();
  });
});
