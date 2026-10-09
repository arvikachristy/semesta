import { describe, expect, it } from 'vitest';
import { CountryList } from '../types/country';
import { emptyTripDetails } from '../types/trip';
import { createLocalTripRepository, decodeTrips, tripStorage } from './trips';

const trip = {
  ...emptyTripDetails,
  id: 'trip-1',
  name: 'Spring plans',
  countryIds: [CountryList.Indonesia],
  startDate: '2027-04-01',
  endDate: '2027-04-10',
};
const encode = (trips: unknown[]) => JSON.stringify({ version: tripStorage.version, trips });

describe('upcoming trip storage', () => {
  it('starts empty, validates countries and dates, and deduplicates IDs', () => {
    expect(decodeTrips(null)).toEqual([]);
    expect(
      decodeTrips(
        encode([
          trip,
          trip,
          { ...trip, id: 'bad-country', countryIds: ['XX'] },
          { ...trip, id: 'bad-date', startDate: '2027-02-30' },
          { ...trip, id: 'reversed', endDate: '2027-03-01' },
          null,
        ]),
      ),
    ).toEqual([trip]);
    expect(decodeTrips(encode([{ ...trip, startDate: '', endDate: '' }]))).toHaveLength(1);
    expect(() => decodeTrips('{')).toThrow();
    expect(() => decodeTrips('{"version":999,"trips":[]}')).toThrow();
  });
  it('round-trips multiple trips and deletion without touching cup selection', async () => {
    const selectionKey = 'existing-selection';
    const records = new Map([[selectionKey, 'keep-me']]);
    const repository = createLocalTripRepository(() => ({
      getItem: (key) => records.get(key) ?? null,
      setItem: (key, value) => {
        records.set(key, value);
      },
    }));
    const second = { ...trip, id: 'trip-2', name: 'Another adventure' };
    await repository.save([trip, second]);
    expect(await repository.load()).toEqual([trip, second]);
    await repository.save([second]);
    expect(await repository.load()).toEqual([second]);
    await repository.save([]);
    expect(await repository.load()).toEqual([]);
    expect(records.get(selectionKey)).toBe('keep-me');
  });
  it('reports storage failures so the UI can explain session-only changes', async () => {
    const repository = createLocalTripRepository(() => {
      throw new Error('Storage blocked');
    });
    await expect(repository.load()).rejects.toThrow('Storage blocked');
    await expect(repository.save([trip])).rejects.toThrow('Storage blocked');
  });
});
