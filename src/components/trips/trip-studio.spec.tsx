// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TripStudio } from './trip-studio';
import { emptyTripDetails } from '../../types/trip';
import type { ITrip } from '../../types/trip';
import { CountryList } from '../../types/country';
import { tripStorage } from '../../storage/trips';
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
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
describe('Trip Studio planning', () => {
  it('confirms suggested flights in one click without creating placeholders or invented details', async () => {
    const trip = {
      ...emptyTripDetails,
      id: 'lisbon-quick',
      name: 'Lisbon',
      startDate: '2027-11-19',
      endDate: '2027-11-22',
    };
    localStorage.setItem(tripStorage.key, JSON.stringify({ version: 1, trips: [trip] }));
    await act(async () => root.render(<TripStudio trip={trip} onBack={vi.fn()} />));
    const plans = host.querySelector('section[aria-label="Your plans"]');
    expect(plans?.textContent).toContain('Outbound flight19 Nov');
    expect(plans?.textContent).toContain('Return flight22 Nov');
    expect(plans?.textContent).toContain('Your stay19–22 Nov');
    expect(
      JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0].planning,
    ).toBeUndefined();
    expect(host.querySelector('dialog[open]')).toBeNull();

    const outbound = plans?.querySelector('button[aria-label="Mark outbound flight booked"]');
    if (!(outbound instanceof HTMLButtonElement)) {
      throw new Error('Missing outbound flight action');
    }
    await act(async () => outbound.click());
    const saved = JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0];
    expect(saved.planning).toHaveLength(1);
    expect(saved.planning[0]).toMatchObject({
      templateId: 'outbound-flight',
      category: 'transportation',
      name: 'Outbound flight',
      details: '',
      status: 'booked',
      completed: true,
    });
    expect(saved.planning[0].dateTime).toBeUndefined();
    expect(saved.planning[0].bookingReference).toBeUndefined();
    expect(saved.activePlanningCategories).toEqual(['transportation']);
    expect(host.textContent).toContain('1 of 1 items booked or ready · 100%');
    expect(plans?.querySelector('[data-confirmed="true"]')?.textContent).toContain('Booked');
    expect(host.querySelector('dialog[open]')).toBeNull();

    const returnAction = plans?.querySelector('button[aria-label="Mark return flight booked"]');
    if (!(returnAction instanceof HTMLButtonElement)) {
      throw new Error('Missing return flight action');
    }
    await act(async () => returnAction.click());
    const savedAfterReturn = JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0];
    expect(savedAfterReturn.planning).toHaveLength(2);
    expect(savedAfterReturn.planning[1].templateId).toBe('return-flight');
    expect(host.textContent).toContain('2 of 2 items booked or ready · 100%');
  });
  it('reuses existing bookings, activates a hidden category, and supports undo after reload', async () => {
    const trip: ITrip = {
      ...emptyTripDetails,
      id: 'existing-quick',
      name: 'Lisbon',
      startDate: '2027-11-19',
      endDate: '2027-11-22',
      activePlanningCategories: ['transportation'],
      planning: [
        {
          id: 'train',
          category: 'transportation',
          name: 'Airport train',
          details: 'Keep this transfer',
          completed: false,
        },
        {
          id: 'outbound',
          category: 'transportation',
          name: 'Outbound flight',
          details: 'Seat chosen',
          completed: false,
        },
        {
          id: 'hotel',
          category: 'accommodation',
          name: 'Hotel',
          details: 'Keep this address',
          completed: false,
        },
      ],
    };
    localStorage.setItem(tripStorage.key, JSON.stringify({ version: 1, trips: [trip] }));
    await act(async () => root.render(<TripStudio trip={trip} onBack={vi.fn()} />));
    const clickPlan = async (label: string) => {
      const button = host.querySelector(
        `section[aria-label="Your plans"] button[aria-label="${label}"]`,
      );
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error(`Missing ${label}`);
      }
      await act(async () => button.click());
    };
    await clickPlan('Mark outbound flight booked');
    await clickPlan('Mark your stay booked');
    const saved = JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0];
    expect(saved.planning).toHaveLength(3);
    expect(saved.planning[0]).toMatchObject({
      id: 'train',
      details: 'Keep this transfer',
      completed: false,
    });
    expect(saved.planning[1]).toMatchObject({
      id: 'outbound',
      templateId: 'outbound-flight',
      details: 'Seat chosen',
      status: 'booked',
      completed: true,
    });
    expect(saved.planning[2]).toMatchObject({
      id: 'hotel',
      templateId: 'stay',
      name: 'Hotel',
      details: 'Keep this address',
      status: 'booked',
      completed: true,
    });
    expect(saved.activePlanningCategories).toEqual(['transportation', 'accommodation']);
    expect(host.textContent).toContain('2 of 3 items booked or ready · 67%');

    await act(async () => root.unmount());
    root = createRoot(host);
    await act(async () => root.render(<TripStudio trip={trip} onBack={vi.fn()} />));
    await clickPlan('Undo Your stay booking');
    const undone = JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0];
    expect(undone.planning).toHaveLength(3);
    expect(undone.planning[2]).toMatchObject({
      id: 'hotel',
      templateId: 'stay',
      status: 'to-book',
      completed: false,
    });
    expect(host.textContent).toContain('1 of 3 items booked or ready · 33%');
    await clickPlan('Mark your stay booked');
    expect(
      JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0].planning,
    ).toHaveLength(3);
  });
  it('edits metadata without replacing bookings, and requires confirmation before deletion', async () => {
    const trip = {
      ...emptyTripDetails,
      id: 'lisbon',
      name: 'Lisbon',
      notes: 'Remember the train',
      planning: [
        {
          id: 'train',
          category: 'transportation',
          name: 'Train',
          details: 'Keep this',
          completed: true,
        },
      ],
      participants: [{ id: 'person', name: 'Taylor' }],
    };
    localStorage.setItem(tripStorage.key, JSON.stringify({ version: 1, trips: [trip] }));
    const onBack = vi.fn();
    await act(async () =>
      root.render(
        <TripStudio trip={{ ...emptyTripDetails, id: trip.id, name: trip.name }} onBack={onBack} />,
      ),
    );
    const click = async (name: string) => {
      const button = [...host.querySelectorAll('button')].find(
        (element) => element.textContent === name,
      );
      if (!button) {
        throw new Error(`Missing ${name}`);
      }
      await act(async () => button.click());
    };
    await click('Edit trip');
    const input = host.querySelector('dialog[aria-label="Edit trip"] input');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Missing metadata editor');
    }
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(
        input,
        'Lisbon summer',
      );
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await click('Save trip');
    const saved = JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0];
    expect(saved).toMatchObject({
      id: 'lisbon',
      name: 'Lisbon summer',
      notes: trip.notes,
      participants: trip.participants,
    });
    expect(saved.planning[0]).toMatchObject({
      id: 'train',
      name: 'Train',
      completed: true,
      status: 'booked',
    });
    await click('Delete trip');
    await click('Keep trip');
    expect(JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips).toHaveLength(1);
    await click('Delete trip');
    const confirm = [...host.querySelectorAll('dialog[aria-label="Delete trip"] button')].find(
      (button) => button.textContent === 'Delete trip',
    );
    if (!(confirm instanceof HTMLButtonElement)) {
      throw new Error('Missing confirmation');
    }
    await act(async () => confirm.click());
    expect(JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips).toEqual([]);
    expect(onBack).toHaveBeenCalledOnce();
  });
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
    expect(host.querySelector('form')).toBeNull();
    expect(
      host.querySelectorAll(
        'section[aria-label="Trip Studio planning"] > div:last-of-type > details[open]',
      ),
    ).toHaveLength(0);
    const choose = [...host.querySelectorAll('button')].find(
      (button) => button.textContent === 'Choose optional categories',
    );
    if (!choose) {
      throw new Error('Missing category action');
    }
    await act(async () => choose.click());
    const choices = host.querySelectorAll('dialog input');
    const accommodation = choices[1];
    if (!(accommodation instanceof HTMLInputElement)) {
      throw new Error('Missing accommodation choice');
    }
    await act(async () => accommodation.click());
    expect(host.textContent).toContain('100%');
    expect(host.querySelector('ul[aria-label="Accommodation bookings"]')).toBeNull();
    const stored = JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0];
    expect(stored.planning).toHaveLength(2);
    expect(stored.planning[0]).toMatchObject({ id: 'train', status: 'booked', completed: true });
    await act(async () => accommodation.click());
    expect(host.querySelector('ul[aria-label="Accommodation bookings"]')?.textContent).toContain(
      'Hotel',
    );
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
