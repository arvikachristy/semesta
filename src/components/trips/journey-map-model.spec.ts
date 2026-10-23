import { describe, expect, it } from 'vitest';
import type { ITripPlanningItem } from '../../types/trip-planning';
import { BookingTemplateId } from '../../types/trip-planning';
import { createTripDetails, splitLastStop } from './trip-itinerary';
import { getJourneyMap } from './journey-map-model';

const booking = (id: string, fields: Partial<ITripPlanningItem> = {}): ITripPlanningItem => ({
  id,
  category: 'transportation',
  name: id,
  completed: false,
  details: '',
  ...fields,
});
const trip = { ...createTripDetails('Spain', 8), id: 'trip' };
describe('journey map allocation', () => {
  it('aligns checkout, next stay and transfer on the same day without duplicating nights', () => {
    const split = { ...trip, stops: splitLastStop(trip, 'Mogán', 4) ?? [] };
    const entries = getJourneyMap(split);
    expect(
      entries
        .filter((entry) => entry.item.category === 'accommodation')
        .map((entry) => [entry.day, entry.endDay]),
    ).toEqual([
      [1, 4],
      [4, 8],
    ]);
    expect(entries.find((entry) => entry.label === 'Transfer')?.day).toBe(4);
    expect(entries.find((entry) => entry.label === 'Depart')?.day).toBe(8);
    expect(split.planning).toBeUndefined();
  });
  it('keeps arrival when return is saved first and reuses legacy flight templates', () => {
    const entries = getJourneyMap({
      ...trip,
      planning: [booking('return', { templateId: BookingTemplateId.ReturnFlight })],
    });
    expect(entries.filter((entry) => entry.label === 'Depart')).toHaveLength(1);
    expect(entries.find((entry) => entry.label === 'Arrive')?.saved).toBe(false);
  });
  it('does not let extra journeys or later hotels replace the first route slots', () => {
    const entries = getJourneyMap({
      ...trip,
      planning: [
        booking('taxi', { dayNumber: 4 }),
        booking('extra-hotel', { category: 'accommodation', dayNumber: 5 }),
      ],
    });
    expect(entries.find((entry) => entry.item.id === 'arrival')).toBeDefined();
    expect(entries.find((entry) => entry.item.id === 'extra-hotel')?.stopId).toBeUndefined();
    expect(entries.filter((entry) => entry.stopId)).toHaveLength(1);
    expect(entries.find((entry) => entry.item.id === 'taxi')).toMatchObject({
      day: 4,
      label: 'Travel',
    });
  });
  it('uses calendar days across DST and keeps out-of-range bookings unscheduled', () => {
    const entries = getJourneyMap({
      ...trip,
      startDate: '2026-10-24',
      endDate: '2026-10-31',
      planning: [
        booking('taxi', { dayNumber: 2, dateTime: '2026-10-27T23:30' }),
        booking('late', { dateTime: '2026-11-01T10:00' }),
      ],
    });
    expect(entries.find((entry) => entry.item.id === 'taxi')?.day).toBe(4);
    expect(entries.find((entry) => entry.item.id === 'late')?.day).toBeUndefined();
  });
  it('supports a one-day trip without inventing a night', () => {
    const entries = getJourneyMap({ ...createTripDetails('London', 1), id: 'day-trip' });
    expect(entries.map((entry) => entry.day)).toEqual([1, 1]);
    expect(entries.every((entry) => entry.item.category === 'transportation')).toBe(true);
  });
  it('reuses the existing first stay without changing its saved booking details', () => {
    const hotel = booking('hotel', {
      category: 'accommodation',
      completed: true,
      bookingReference: 'ABC',
    });
    const entries = getJourneyMap({ ...trip, planning: [hotel] });
    expect(entries.filter((entry) => entry.item.category === 'accommodation')).toHaveLength(1);
    expect(entries.find((entry) => entry.item.id === 'hotel')).toMatchObject({
      item: hotel,
      day: 1,
      endDay: 8,
      saved: true,
    });
  });
});
