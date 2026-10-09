import { describe, expect, it } from 'vitest';
import { emptyTripDetails } from '../../types/trip';
import { getTripDates, sortTrips } from './trip-presentation';

const trip = { ...emptyTripDetails, id: 'one', name: 'A trip' };

describe('trip timeline presentation', () => {
  it('sorts dated trips chronologically before undated trips without mutating storage order', () => {
    const later = { ...trip, id: 'later', startDate: '2027-01-02' };
    const earlier = { ...trip, id: 'earlier', startDate: '2026-11-19' };
    const input = [trip, later, earlier];
    expect(sortTrips(input).map(({ id }) => id)).toEqual(['earlier', 'later', 'one']);
    expect(input).toEqual([trip, later, earlier]);
  });
  it('formats compact date ranges and preserves both years when crossing into a new year', () => {
    expect(getTripDates({ ...trip, startDate: '2026-11-19', endDate: '2026-11-22' })).toEqual({
      month: 'Nov',
      days: '19 – 22',
      range: '19 – 22 Nov 2026',
    });
    expect(getTripDates({ ...trip, startDate: '2026-12-29', endDate: '2027-01-02' }).range).toBe(
      '29 Dec 2026 – 2 Jan 2027',
    );
  });
  it('handles undecided dates, a single day and an end-only date', () => {
    expect(getTripDates(trip).range).toBe('Dates to decide');
    expect(getTripDates({ ...trip, startDate: '2027-01-02', endDate: '2027-01-02' }).range).toBe(
      '2 Jan 2027',
    );
    expect(getTripDates({ ...trip, endDate: '2027-01-02' }).range).toBe('Until 2 Jan 2027');
  });
});
