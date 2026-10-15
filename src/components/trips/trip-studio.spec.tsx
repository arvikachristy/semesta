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
  it('starts with one plan board and no invented readiness or bookings', async () => {
    const trip = {
      ...emptyTripDetails,
      id: 'draft',
      name: 'Peru trip',
      countryIds: [CountryList.Peru],
    };
    localStorage.setItem(tripStorage.key, JSON.stringify({ version: 1, trips: [trip] }));
    await act(async () => root.render(<TripStudio trip={trip} onBack={vi.fn()} />));
    expect(host.querySelector('section[aria-label="Your plans"]')).toBeNull();
    expect(host.querySelector('section[aria-label="Trip readiness"]')).toBeNull();
    expect(host.textContent).toContain('Your trip plan');
    expect(host.textContent).toContain('Things to do');
    expect(host.textContent).not.toContain('0%');
    expect(host.querySelector('form')).toBeNull();
    const add = [...host.querySelectorAll('button')].find(
      (button) => button.textContent === 'Add activities',
    );
    if (!add) {
      throw new Error('Missing idea action');
    }
    await act(async () => add.click());
    const input = host.querySelector('input[name="name"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Missing idea name');
    }
    input.value = 'Walk through Cusco';
    const form = host.querySelector('form');
    if (!form) {
      throw new Error('Missing editor');
    }
    await act(async () =>
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    );
    expect(host.querySelectorAll('li[data-confirmed]')).toHaveLength(1);
    expect(host.querySelector('li[data-confirmed]')?.closest('details')?.open).toBe(true);
    expect(
      JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0].planning[0],
    ).toMatchObject({ name: 'Walk through Cusco', category: 'activities', status: 'idea' });
  });
  it('edits metadata without replacing bookings, and requires confirmation before deletion', async () => {
    const trip = {
      ...emptyTripDetails,
      id: 'lisbon',
      name: 'Lisbon',
      notes: 'Remember the train',
      countryIds: [CountryList.Portugal, CountryList.France],
      visitedCountryIds: [CountryList.Portugal, CountryList.France],
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
    const remove = host.querySelector('button[aria-label="Remove France"]');
    if (!(remove instanceof HTMLButtonElement)) {
      throw new Error('Missing destination removal');
    }
    await act(async () => remove.click());
    await click('Save trip');
    const saved = JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0];
    expect(saved).toMatchObject({
      id: 'lisbon',
      name: 'Lisbon summer',
      notes: trip.notes,
      participants: trip.participants,
      countryIds: [CountryList.Portugal],
      visitedCountryIds: [CountryList.Portugal],
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
    ).toHaveLength(2);
    const choose = [...host.querySelectorAll('button')].find(
      (button) => button.textContent === 'Choose categories',
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
    expect(host.querySelector('ul[aria-label="Your stay bookings"]')).toBeNull();
    const stored = JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0];
    expect(stored.planning).toHaveLength(2);
    expect(stored.planning[0]).toMatchObject({ id: 'train', status: 'booked', completed: true });
    await act(async () => accommodation.click());
    expect(host.querySelector('ul[aria-label="Your stay bookings"]')?.textContent).toContain(
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
