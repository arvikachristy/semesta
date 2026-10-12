// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TripStudio } from './trip-studio';
import { emptyTripDetails } from '../../types/trip';
import { CountryList } from '../../types/country';
import { tripStorage } from '../../storage/trips';
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
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
describe('Trip Studio planning', () => {
  it('uses saved legacy bookings and keeps inactive category items through editing and reload', async () => {
    const trip = {
      ...emptyTripDetails,
      id: 'trip',
      name: 'Paris with friends',
      countryIds: [CountryList.France],
      planning: [
        {
          id: 'train',
          category: 'transportation',
          name: 'Night train',
          details: 'Keep this',
          completed: true,
        },
        { id: 'stay', category: 'accommodation', name: 'Hotel', details: '', completed: false },
      ],
    };
    localStorage.setItem(tripStorage.key, JSON.stringify({ version: 1, trips: [trip] }));
    const onBack = vi.fn();
    await act(async () =>
      root.render(
        <TripStudio
          trip={{ ...emptyTripDetails, id: 'trip', name: trip.name, countryIds: trip.countryIds }}
          onBack={onBack}
        />,
      ),
    );
    expect(host.textContent).toContain('France');
    expect(host.textContent).toContain('Night train');
    expect(host.textContent).toContain('50%');
    const choices = host.querySelectorAll(
      'section[aria-label="Trip Studio planning"] > details input',
    );
    const accommodation = choices[1];
    if (!(accommodation instanceof HTMLInputElement)) {
      throw new Error('Missing accommodation choice');
    }
    await act(async () => accommodation.click());
    expect(host.textContent).toContain('100%');
    expect(host.textContent).not.toContain('Hotel');
    const stored = JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0];
    expect(stored.planning).toHaveLength(2);
    expect(stored.planning[0]).toMatchObject({ id: 'train', status: 'booked', completed: true });
    await act(async () => accommodation.click());
    expect(host.textContent).toContain('Hotel');
    expect(host.textContent).toContain('50%');
    const select = host.querySelector('select');
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error('Missing booking status');
    }
    await act(async () => {
      select.value = 'idea';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(host.textContent).toContain('0%');
    expect(
      JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0].planning[0],
    ).toMatchObject({ id: 'train', status: 'idea', completed: false });
    const back = host.querySelector('button');
    if (!back) {
      throw new Error('Missing back action');
    }
    await act(async () => back.click());
    expect(onBack).toHaveBeenCalledOnce();
  });
});
