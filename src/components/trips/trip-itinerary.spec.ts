import { describe, expect, it } from 'vitest';
import {
  createTripDetails,
  getDurationDays,
  getEssentialSlots,
  splitLastStop,
  updateTripStop,
} from './trip-itinerary';
import { decodeTrips, tripStorage } from '../../storage/trips';
describe('itinerary allocation and persistence', () => {
  it('keeps the night total fixed and rejects invalid stop splits', () => {
    const trip = { ...createTripDetails('Japan', 10), id: 'trip' };
    for (const nights of [0, -1, 9, 10, 1.5, NaN]) {
      expect(splitLastStop(trip, 'Kyoto', nights)).toBeNull();
    }
    expect(splitLastStop(trip, ' ', 4)).toBeNull();
    const stops = splitLastStop(trip, 'Kyoto', 4);
    expect(stops?.map((stop) => stop.nights)).toEqual([5, 4]);
    expect(trip.stops?.[0].nights).toBe(9);
  });
  it('keeps booking details intact when a route is split', () => {
    const trip = {
      ...createTripDetails('Japan', 10),
      id: 'trip',
      planning: [
        {
          id: 'hotel',
          category: 'accommodation' as const,
          name: 'Existing hotel',
          details: '9 nights booked',
          completed: true,
        },
      ],
    };
    const next = { ...trip, stops: splitLastStop(trip, 'Kyoto', 4) ?? [] };
    expect(
      getEssentialSlots(next).filter((slot) => slot.category === 'accommodation'),
    ).toHaveLength(1);
    expect(next.planning).toEqual(trip.planning);
  });
  it('keeps the arrival slot when the connecting journey is saved first', () => {
    const initial = { ...createTripDetails('Japan', 10), id: 'trip' };
    const trip = { ...initial, stops: splitLastStop(initial, 'Kyoto', 4) ?? [] };
    const connection = getEssentialSlots(trip).find((slot) => slot.id.startsWith('journey-'));
    if (!connection) {
      throw new Error('Missing connecting journey');
    }
    expect(
      getEssentialSlots({ ...trip, planning: [connection] }).some((slot) => slot.id === 'arrival'),
    ).toBe(true);
  });
  it('persists flexible dates, stops and day allocations and validates new optional fields', () => {
    const trip = {
      ...createTripDetails('Japan', 10),
      id: 'trip',
      planning: [
        {
          id: 'day',
          category: 'activities' as const,
          name: 'Market',
          details: '',
          completed: false,
          dayNumber: 2,
        },
      ],
    };
    const encode = (trips: unknown[]) => JSON.stringify({ version: tripStorage.version, trips });
    expect(decodeTrips(encode([trip]))[0]).toMatchObject(trip);
    expect(
      decodeTrips(
        encode([
          { ...trip, durationDays: 0 },
          { ...trip, stops: [{ id: 'x', name: 'Kyoto', nights: -1 }] },
          { ...trip, planning: [{ ...trip.planning[0], dayNumber: 0 }] },
        ]),
      ),
    ).toEqual([]);
    expect(getDurationDays({ ...trip, startDate: '2026-12-17', endDate: '2026-12-26' })).toBe(10);
  });
  it('renames the first city and redistributes nights without changing the trip length', () => {
    const initial = { ...createTripDetails('Japan', 10), id: 'trip' };
    const trip = { ...initial, stops: splitLastStop(initial, 'Kyoto', 4) ?? [] };
    const first = trip.stops[0];
    expect(
      updateTripStop(trip, first.id, 'Tokyo', 6)?.map((stop) => [stop.name, stop.nights]),
    ).toEqual([
      ['Tokyo', 6],
      ['Kyoto', 3],
    ]);
    expect(updateTripStop(trip, first.id, 'Tokyo', 9)).toBeNull();
  });
});
