import { describe, expect, it } from 'vitest';
import { deletePlanningItem, restorePlanningItem, savePlanningItems } from './trip-planning';
import { decodeTrips, tripStorage } from './trips';
import { createTripDetails } from '../components/trips/trip-itinerary';
import { getJourneyMap } from '../components/trips/journey-map-model';

describe('trip planning CRUD', () => {
  it('updates a single stable ID without duplicates and leaves another trip untouched', () => {
    const trip = { ...createTripDetails('Japan', 8), id: 'one' };
    const other = { ...trip, id: 'two' };
    const item = {
      id: 'hotel',
      category: 'accommodation' as const,
      name: 'Hotel',
      details: '',
      completed: false,
    };
    const created = savePlanningItems(trip, [item]);
    const updated = savePlanningItems(created, [{ ...item, name: 'Renamed hotel' }]);
    expect(updated.planning).toHaveLength(1);
    expect(updated.planning?.[0]).toMatchObject({ id: 'hotel', name: 'Renamed hotel' });
    expect(other.planning).toBeUndefined();
  });
  it('deletes a legacy first stay without recreating its generated slot after reload', () => {
    const trip = { ...createTripDetails('Japan', 8), id: 'one' };
    const item = {
      id: 'legacy',
      category: 'accommodation' as const,
      name: 'Booked hotel',
      details: 'Keep on undo',
      completed: true,
      bookingReference: 'ABC',
    };
    const saved = savePlanningItems(trip, [item]);
    const entry = getJourneyMap(saved).find((entry) => entry.item.id === item.id);
    if (!entry) {
      throw new Error('Missing stay');
    }
    const removed = deletePlanningItem(saved, item.id, entry.slotId);
    const reloaded = decodeTrips(
      JSON.stringify({ version: tripStorage.version, trips: [removed] }),
    )[0];
    expect(getJourneyMap(reloaded).some((entry) => entry.item.category === 'accommodation')).toBe(
      false,
    );
    const restored = restorePlanningItem(reloaded, entry.item, true, entry.slotId);
    expect(restored.planning?.[0]).toMatchObject({ ...item, status: 'booked' });
    expect(
      getJourneyMap(restored).filter((entry) => entry.item.category === 'accommodation'),
    ).toHaveLength(1);
  });
  it('rejects invalid deletion metadata while preserving compatibility with older trips', () => {
    const trip = { ...createTripDetails('Japan', 8), id: 'one' };
    const load = (trips: unknown[]) =>
      decodeTrips(JSON.stringify({ version: tripStorage.version, trips }));
    expect(load([trip])).toHaveLength(1);
    expect(
      load([
        { ...trip, dismissedPlanningIds: [1] },
        { ...trip, dismissedPlanningIds: ['arrival', 'arrival'] },
      ]),
    ).toEqual([]);
  });
});
