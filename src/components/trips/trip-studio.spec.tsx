// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TripStudio } from './trip-studio';
import { createTripDetails } from './trip-itinerary';
import { tripStorage, decodeTrips } from '../../storage/trips';
import { emptyTripDetails } from '../../types/trip';
import type { ITrip } from '../../types/trip';
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  for (const [method, open] of [
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
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  localStorage.clear();
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});
const click = async (name: string) => {
  const button = [...host.querySelectorAll('button')].find(
    (element) =>
      element.textContent?.trim() === name || element.getAttribute('aria-label') === name,
  );
  if (!button) {
    throw new Error('Missing ' + name);
  }
  await act(async () => button.click());
};
const fill = async (selector: string, value: string) => {
  const input = host.querySelector(selector);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Missing ' + selector);
  }
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
const render = async (trip: ITrip, onBack = vi.fn()) => {
  localStorage.setItem(tripStorage.key, JSON.stringify({ version: 1, trips: [trip] }));
  await act(async () => root.render(<TripStudio trip={trip} onBack={onBack} />));
};
const stored = () => decodeTrips(localStorage.getItem(tripStorage.key))[0];
describe('minimal Trip Studio', () => {
  it('starts with arrival, stay and departure, and saves a name-only booking without duplicate slots', async () => {
    const trip = { ...createTripDetails('Japan', 10), id: 'trip' };
    await render(trip);
    expect(host.querySelectorAll('[data-journey-item]')).toHaveLength(3);
    expect(host.querySelector('progress')).toBeNull();
    expect(host.querySelector('form')).toBeNull();
    expect(stored().planning).toBeUndefined();
    const transport = host.querySelector('[aria-label="Add Transport to Japan"]');
    if (!(transport instanceof HTMLButtonElement)) {
      throw new Error('Missing transport');
    }
    await act(async () => transport.click());
    expect(host.querySelector('dialog details')?.hasAttribute('open')).toBe(false);
    await fill('input[name="name"]', 'Flight to Japan');
    await click('Save plan');
    expect(stored().planning).toHaveLength(1);
    expect(stored().planning?.[0]).toMatchObject({
      id: 'arrival',
      name: 'Flight to Japan',
      category: 'transportation',
      status: 'to-book',
    });
    expect(host.querySelectorAll('[data-journey-item]')).toHaveLength(3);
  });
  it('splits nights, creates connecting slots and persists route and day plans through reload', async () => {
    const trip = { ...createTripDetails('Japan', 10), id: 'trip' };
    await render(trip);
    await click('Add a stop');
    await fill('dialog input[placeholder="Country or city"]', 'Kyoto');
    await fill('dialog input[type="number"]', '4');
    await click('Update trip');
    expect(stored().stops?.map((stop) => stop.nights)).toEqual([5, 4]);
    expect(host.querySelectorAll('[data-journey-item]')).toHaveLength(5);
    expect(host.textContent).toContain('Japan → Kyoto');
    await click('＋ Add a plan');
    await fill('input[name="name"]', 'Food market');
    await click('Save plan');
    expect(stored().planning?.[0]).toMatchObject({ dayNumber: 1, name: 'Food market' });
    await act(async () => root.unmount());
    root = createRoot(host);
    await act(async () => root.render(<TripStudio trip={trip} onBack={vi.fn()} />));
    expect(host.textContent).toContain('Food market');
    expect(stored().stops?.map((stop) => stop.nights)).toEqual([5, 4]);
    expect(host.querySelectorAll('[data-journey-item]')).toHaveLength(5);
  });
  it('keeps legacy bookings, notes, participants and inactive plans while editing metadata', async () => {
    const trip: ITrip = {
      ...emptyTripDetails,
      id: 'legacy',
      name: 'Paris',
      notes: 'Keep notes',
      participants: [{ id: 'p', name: 'Taylor' }],
      activePlanningCategories: ['transportation'],
      planning: [
        {
          id: 'train',
          category: 'transportation',
          name: 'Night train',
          completed: true,
          details: 'Window seat',
          bookingReference: 'REF-123',
          link: 'https://example.com/train',
        },
        { id: 'museum', category: 'activities', name: 'Museum', completed: false, details: '' },
      ],
    };
    await render(trip);
    expect(host.textContent).toContain('Museum');
    await click('Edit trip');
    await fill('input[name="destination"]', 'France');
    await click('Save trip');
    expect(stored()).toMatchObject({ notes: trip.notes, participants: trip.participants });
    expect(stored().planning?.[0]).toMatchObject({
      id: 'train',
      completed: true,
      bookingReference: 'REF-123',
      link: 'https://example.com/train',
    });
    expect(stored().planning).toHaveLength(2);
  });
  it('focuses unfinished bookings and keeps editing and removal available', async () => {
    const trip = { ...createTripDetails('Japan', 7), id: 'trip' };
    await render(trip);
    await click('Add Transport to Japan');
    const checkbox = host.querySelector('dialog input[type="checkbox"]');
    if (!(checkbox instanceof HTMLInputElement)) {
      throw new Error('Missing booked toggle');
    }
    await act(async () => checkbox.click());
    await click('Save plan');
    const focus = host.querySelector('[aria-pressed="false"]');
    if (!(focus instanceof HTMLButtonElement)) {
      throw new Error('Missing booking focus');
    }
    await act(async () => focus.click());
    expect(host.querySelectorAll('[data-muted="true"]')).toHaveLength(1);
    expect(host.textContent).toContain('1 stay · 1 journey');
    await click('Edit Transport to Japan');
    await click('Remove plan');
    expect(stored().planning).toHaveLength(0);
    expect(host.querySelector('[aria-label="Add Transport to Japan"]')).not.toBeNull();
  });
  it('saves an extra travel day and preserves it on reload', async () => {
    const trip = { ...createTripDetails('Japan', 7), id: 'trip' };
    await render(trip);
    await click('Add travel');
    await fill('input[name="name"]', 'Airport transfer');
    const day = host.querySelector('select[name="dayNumber"]');
    if (!(day instanceof HTMLSelectElement)) {
      throw new Error('Missing trip day');
    }
    day.value = '4';
    await click('Save plan');
    expect(stored().planning?.[0]).toMatchObject({ dayNumber: 4, name: 'Airport transfer' });
    await render(stored());
    expect(host.querySelector('[aria-label="Edit Airport transfer"]')?.textContent).toContain(
      'Day 4',
    );
    expect(host.querySelector('[aria-label="Add Transport to Japan"]')).not.toBeNull();
  });
  it('requires confirmation before trip deletion', async () => {
    const onBack = vi.fn();
    await render({ ...createTripDetails('Japan', 10), id: 'trip' }, onBack);
    await click('Delete trip');
    await click('Keep trip');
    expect(stored()).toBeDefined();
    await click('Delete trip');
    const confirm = [...host.querySelectorAll('dialog button')].find(
      (button) => button.textContent === 'Delete trip',
    );
    if (!(confirm instanceof HTMLButtonElement)) {
      throw new Error('Missing confirmation');
    }
    await act(async () => confirm.click());
    expect(decodeTrips(localStorage.getItem(tripStorage.key))).toEqual([]);
    expect(onBack).toHaveBeenCalledOnce();
  });
});
