import { describe, expect, it } from 'vitest';
import { createTripDetails } from './trip-itinerary';
import { getJourneyMap } from './journey-map-model';
import { addJourneyBlock, blockRange, moveJourneyBlock } from './journey-blocks';
import { decodeTrips, tripStorage } from '../../storage/trips';

const trip = { ...createTripDetails('Japan', 8), id: 'trip' };
describe('calendar block scheduling', () => {
  it('keeps movement and resize within the trip and preserves at least one night', () => {
    expect(blockRange(2, 5, 100, 'move', 8)).toEqual({ start: 5, end: 8 });
    expect(blockRange(2, 5, -100, 'move', 8)).toEqual({ start: 1, end: 4 });
    expect(blockRange(2, 5, 100, 'start', 8)).toEqual({ start: 4, end: 5 });
    expect(blockRange(2, 5, -100, 'end', 8)).toEqual({ start: 2, end: 3 });
    expect(blockRange(8, 8, 1, 'move', 8)).toEqual({ start: 8, end: 8 });
  });
  it('creates a split in one action, fills gaps first and survives persistence', () => {
    const split = addJourneyBlock(trip, 'accommodation');
    const stays = getJourneyMap(split).filter((entry) => entry.item.category === 'accommodation');
    expect(stays.map((entry) => [entry.day, entry.endDay])).toEqual([
      [1, 5],
      [5, 8],
    ]);
    const shortened = moveJourneyBlock(split, stays[0], 1, 3);
    const filled = addJourneyBlock(shortened, 'accommodation');
    expect(
      getJourneyMap(filled)
        .filter((entry) => entry.item.category === 'accommodation')
        .map((entry) => [entry.day, entry.endDay]),
    ).toContainEqual([3, 5]);
    expect(
      decodeTrips(JSON.stringify({ version: tripStorage.version, trips: [filled] }))[0],
    ).toEqual(filled);
  });
  it('adjusts adjacent nights but refuses to erase another stay', () => {
    const split = addJourneyBlock(trip, 'accommodation');
    const first = getJourneyMap(split).find((entry) => entry.item.category === 'accommodation');
    if (!first) {
      throw new Error('Missing stay');
    }
    const resized = moveJourneyBlock(split, first, 1, 6);
    expect(
      getJourneyMap(resized)
        .filter((entry) => entry.item.category === 'accommodation')
        .map((entry) => [entry.day, entry.endDay]),
    ).toEqual([
      [1, 6],
      [6, 8],
    ]);
    expect(moveJourneyBlock(split, first, 1, 8)).toBe(split);
  });
  it('moves dated transport while preserving its time, reference and booked status', () => {
    const dated = {
      ...trip,
      startDate: '2026-10-24',
      endDate: '2026-10-31',
      planning: [
        {
          id: 'arrival',
          category: 'transportation' as const,
          name: 'Flight',
          details: 'Seat 2A',
          completed: true,
          dateTime: '2026-10-24T18:30',
          bookingReference: 'ABC',
        },
      ],
    };
    const entry = getJourneyMap(dated).find((item) => item.item.id === 'arrival');
    if (!entry) {
      throw new Error('Missing arrival');
    }
    const moved = moveJourneyBlock(dated, entry, 3, 3);
    expect(moved.planning?.[0]).toMatchObject({
      dateTime: '2026-10-26T18:30',
      dayNumber: 3,
      completed: true,
      bookingReference: 'ABC',
      details: 'Seat 2A',
    });
    expect(getJourneyMap(moved).find((item) => item.item.id === 'arrival')?.day).toBe(3);
  });
  it('does not add zero-night or overlapping stays when all nights have a block', () => {
    const dayTrip = { ...createTripDetails('Japan', 1), id: 'one' };
    expect(addJourneyBlock(dayTrip, 'accommodation')).toBe(dayTrip);
    const twoDays = { ...createTripDetails('Japan', 2), id: 'two' };
    expect(addJourneyBlock(twoDays, 'accommodation')).toBe(twoDays);
  });
  it('keeps one legacy stay after moving its explicit range away from Day 1', () => {
    const legacy = {
      ...trip,
      planning: [
        {
          id: 'hotel',
          category: 'accommodation' as const,
          name: 'Hotel',
          details: 'Keep',
          completed: true,
        },
      ],
    };
    const entry = getJourneyMap(legacy).find((item) => item.item.id === 'hotel');
    if (!entry) {
      throw new Error('Missing hotel');
    }
    const moved = moveJourneyBlock(legacy, entry, 2, 5);
    expect(
      getJourneyMap(moved).filter((item) => item.item.category === 'accommodation'),
    ).toHaveLength(1);
    expect(moved.planning?.[0]).toMatchObject({
      name: 'Hotel',
      completed: true,
      dayNumber: 2,
      endDayNumber: 5,
    });
  });
});
