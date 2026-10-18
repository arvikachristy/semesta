// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UpcomingTrips } from './upcoming-trips';
import { TripList } from './trip-list';
import { tripStorage } from '../../storage/trips';
import { emptyTripDetails } from '../../types/trip';
import type { ITrip } from '../../types/trip';
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
describe('compact upcoming trip launcher', () => {
  it('returns from mobile creation to saved trips without closing the Trips tab', async () => {
    const trip = { ...emptyTripDetails, id: 'saved', name: 'Japan' };
    localStorage.setItem(
      tripStorage.key,
      JSON.stringify({ version: tripStorage.version, trips: [trip] }),
    );
    const onClose = vi.fn();
    const onOpenStudio = vi.fn();
    await act(async () =>
      root.render(
        <UpcomingTrips mobilePanel={{ open: true, onClose }} onOpenStudio={onOpenStudio} />,
      ),
    );
    await click('New trip');
    expect(host.querySelector('form')).not.toBeNull();
    await click('Back to trips');
    expect(host.querySelector('form')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips).toEqual([trip]);
    await click('Open Japan');
    expect(onOpenStudio).toHaveBeenCalledExactlyOnceWith(trip);
  });
  it('opens a trip with one click while keeping only the chronological list in the panel', async () => {
    const later = { ...emptyTripDetails, id: 'later', name: 'Autumn', startDate: '2027-10-01' };
    const lisbon = { ...emptyTripDetails, id: 'lisbon', name: 'Lisbon', startDate: '2027-05-01' };
    localStorage.setItem(
      tripStorage.key,
      JSON.stringify({ version: tripStorage.version, trips: [later, lisbon] }),
    );
    const onOpenStudio = vi.fn();
    await act(async () => root.render(<UpcomingTrips onOpenStudio={onOpenStudio} />));
    expect(
      [...host.querySelectorAll('ol button')].map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Open Lisbon', 'Open Autumn']);
    await click('Open Lisbon');
    expect(onOpenStudio).toHaveBeenCalledExactlyOnceWith(lisbon);
    expect(host.querySelectorAll('ol li')).toHaveLength(2);
    expect(host.querySelector('section[aria-label="Trip details"]')).toBeNull();
    expect(host.querySelector('section[aria-label="Trip Studio planning"]')).toBeNull();
    expect(host.textContent).not.toContain('Open Trip Studio');
  });
  it('shows planning guidance without a readiness score when no bookings are tracked', async () => {
    const trip = { ...emptyTripDetails, id: 'empty', name: 'Lisbon' };
    await act(async () => root.render(<TripList trips={[trip]} onSelect={vi.fn()} />));
    expect(host.textContent).toContain('Start planning');
    expect(host.textContent).not.toContain('0%');
    expect(host.querySelector('progress')?.getAttribute('aria-label')).toBe(
      'Lisbon has no tracked bookings',
    );
    expect(host.querySelector('progress')).not.toBeNull();
  });
  it('counts only enabled categories and uses saved categories for legacy trips', async () => {
    const trip: ITrip = {
      ...emptyTripDetails,
      id: 'partial',
      name: 'Lisbon',
      planning: [
        {
          id: 'activity-booked',
          category: 'activities',
          name: 'Museum',
          details: '',
          completed: true,
        },
        {
          id: 'activity-open',
          category: 'activities',
          name: 'Walking tour',
          details: '',
          completed: false,
        },
        {
          id: 'hotel-open',
          category: 'accommodation',
          name: 'Hotel',
          details: '',
          completed: false,
        },
      ],
      activePlanningCategories: ['activities'],
    };
    await act(async () => root.render(<TripList trips={[trip]} onSelect={vi.fn()} />));
    expect(host.textContent).toContain('1 thing left to book');
    expect(host.textContent).toContain('50%');

    const legacyTrip = { ...trip, id: 'legacy', activePlanningCategories: undefined };
    await act(async () => root.render(<TripList trips={[legacyTrip]} onSelect={vi.fn()} />));
    expect(host.textContent).toContain('2 things left to book');
    expect(host.textContent).toContain('33%');
  });
  it('shows all tracked bookings confirmed and reflects updated booking props immediately', async () => {
    const trip = {
      ...emptyTripDetails,
      id: 'complete',
      name: 'Lisbon',
      planning: [
        {
          id: 'hotel',
          category: 'accommodation' as const,
          name: 'Hotel',
          details: '',
          completed: false,
        },
        {
          id: 'train',
          category: 'transportation' as const,
          name: 'Train',
          details: '',
          completed: true,
        },
      ],
    };
    await act(async () => root.render(<TripList trips={[trip]} onSelect={vi.fn()} />));
    expect(host.textContent).toContain('1 thing left to book');
    const updatedTrip = {
      ...trip,
      planning: trip.planning.map((item) => ({ ...item, completed: true })),
    };
    await act(async () => root.render(<TripList trips={[updatedTrip]} onSelect={vi.fn()} />));
    expect(host.textContent).toContain('All tracked bookings confirmed');
    expect(host.textContent).toContain('100%');
  });
  it('creates a trip and immediately opens its Studio after saving', async () => {
    const onOpenStudio = vi.fn();
    await act(async () => root.render(<UpcomingTrips onOpenStudio={onOpenStudio} />));
    await click('New trip');
    const input = host.querySelector('form input');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Missing trip name');
    }
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(
        input,
        'Lisbon',
      );
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await click('Create trip →');
    expect(onOpenStudio).toHaveBeenCalledOnce();
    const saved = JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips[0];
    expect(onOpenStudio).toHaveBeenCalledWith(saved);
    expect(saved.id).toEqual(expect.any(String));
    expect(host.querySelector('form')).toBeNull();
    expect(host.querySelector('section[aria-label="Trip details"]')).toBeNull();
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
    await act(async () => root.render(<UpcomingTrips onOpenStudio={vi.fn()} />));
    const flags = [...host.querySelectorAll('ol img')];
    expect(flags).toHaveLength(6);
    flags.forEach((flag, index) => {
      expect(flag.getAttribute('style')).toContain(
        `conic-gradient(from ${index * 60}deg, black 0deg 60deg, transparent 60deg 360deg)`,
      );
    });
    expect(flags.some((flag) => flag.getAttribute('src')?.includes('KZ'))).toBe(false);
  });
  it('cancels creation without saving a phantom trip or navigating', async () => {
    const onOpenStudio = vi.fn();
    await act(async () => root.render(<UpcomingTrips onOpenStudio={onOpenStudio} />));
    await click('New trip');
    await click('Cancel');
    expect(host.querySelector('form')).toBeNull();
    expect(localStorage.getItem(tripStorage.key)).toBeNull();
    expect(onOpenStudio).not.toHaveBeenCalled();
  });
});
