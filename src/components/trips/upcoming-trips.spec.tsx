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
  it('adds bookings, updates progress and persists planning when trip details are edited', async () => {
    const trip = { ...emptyTripDetails, id: 'planning', name: 'Summer trip' };
    localStorage.setItem(
      tripStorage.key,
      JSON.stringify({ version: tripStorage.version, trips: [trip] }),
    );
    await act(async () => root.render(<UpcomingTrips />));
    await click('Open Summer trip');
    const category = host.querySelector(
      'section[aria-label="Trip Studio planning"] input[type="checkbox"]',
    );
    if (!(category instanceof HTMLInputElement)) {
      throw new Error('Missing category activation');
    }
    await act(async () => category.click());
    const form = host.querySelector('section[aria-label="Trip Studio planning"] form');
    if (!(form instanceof HTMLFormElement)) {
      throw new Error('Missing transportation form');
    }
    const input = form.querySelector('input');
    const details = form.querySelector('textarea');
    if (!input || !details) {
      throw new Error('Missing booking fields');
    }
    input.value = 'Train to Paris';
    details.value = '12 May · Reference ABC';
    await act(async () => form.requestSubmit());
    const checkbox = host.querySelector(
      'section[aria-label="Trip Studio planning"] li input[type="checkbox"]',
    );
    if (!(checkbox instanceof HTMLInputElement)) {
      throw new Error('Missing booking status');
    }
    await act(async () => checkbox.click());
    expect(host.querySelector('progress')?.value).toBe(1);
    expect(host.querySelector('progress')?.max).toBe(1);
    expect(host.textContent).toContain('100%');
    await click('Edit trip');
    await click('Save trip');
    expect(host.textContent).toContain('Train to Paris');
    expect(host.textContent).toContain('12 May · Reference ABC');
    const saved = JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}');
    expect(saved.trips[0].planning[0]).toMatchObject({
      name: 'Train to Paris',
      completed: true,
      category: 'transportation',
    });
    await click('Remove Train to Paris');
    expect(host.querySelector('progress')?.value).toBe(0);
    expect(host.textContent).toContain('0 of 0');
  });
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
