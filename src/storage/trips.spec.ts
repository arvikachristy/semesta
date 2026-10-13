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
  it('round-trips a confirmed suggestion identifier without changing the storage version', async () => {
    const suggested = {
      ...trip,
      planning: [
        {
          id: 'outbound',
          category: 'transportation' as const,
          name: 'Outbound flight',
          details: '',
          completed: true,
          status: 'booked' as const,
          templateId: 'outbound-flight' as const,
        },
      ],
      activePlanningCategories: ['transportation' as const],
    };
    const storage = new Map<string, string>();
    const repository = createLocalTripRepository(() => ({
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
    }));
    await repository.save([suggested]);
    expect(await repository.load()).toEqual([suggested]);
    expect(JSON.parse(storage.get(tripStorage.key) ?? '{}').version).toBe(1);
    expect(
      decodeTrips(
        encode([{ ...suggested, planning: [{ ...suggested.planning[0], templateId: 'wrong' }] }]),
      ),
    ).toEqual([]);
  });
  it('round-trips real travellers while keeping legacy trips without participants readable', async () => {
    const participants = [
      { id: 'person', name: 'Taylor Reed' },
      { id: 'avatar', name: 'Morgan', avatarUrl: 'https://example.com/avatar.png' },
    ];
    const withTravellers = { ...trip, participants };
    expect(decodeTrips(encode([withTravellers]))).toEqual([withTravellers]);
    expect(decodeTrips(encode([trip]))[0].participants).toBeUndefined();
    for (const invalid of [
      [{ id: '', name: 'Bad' }],
      [{ id: 'person', name: ' ' }],
      [{ id: 'person', name: 'Bad', avatarUrl: 'javascript:alert(1)' }],
      [participants[0], participants[0]],
    ]) {
      expect(decodeTrips(encode([{ ...trip, participants: invalid }]))).toEqual([]);
    }
    const storage = new Map<string, string>();
    const repository = createLocalTripRepository(() => ({
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
    }));
    await repository.save([withTravellers]);
    expect(await repository.load()).toEqual([withTravellers]);
  });
  it('migrates both legacy booleans and round-trips inactive items and enriched fields without losing IDs', async () => {
    const planning = [
      {
        id: 'train',
        category: 'transportation',
        name: 'Train',
        details: 'Keep me',
        completed: true,
      },
      {
        id: 'transfer',
        category: 'transportation',
        name: 'Transfer',
        details: '',
        completed: false,
      },
    ];
    const records = new Map([[tripStorage.key, encode([{ ...trip, planning }])]]);
    const repository = createLocalTripRepository(() => ({
      getItem: (key) => records.get(key) ?? null,
      setItem: (key, value) => {
        records.set(key, value);
      },
    }));
    const migrated = await repository.load();
    expect(migrated[0].planning).toEqual([
      { ...planning[0], status: 'booked' },
      { ...planning[1], status: 'to-book' },
    ]);
    const enriched = {
      ...migrated[0],
      activePlanningCategories: [],
      planning: migrated[0].planning?.map((item) => ({
        ...item,
        dateTime: '2027-05-12T14:30',
        bookingReference: 'ABC',
        link: 'https://example.com/booking',
      })),
    };
    await repository.save([enriched]);
    expect(await repository.load()).toEqual([enriched]);
    expect(JSON.parse(records.get(tripStorage.key) ?? '{}').version).toBe(1);
    for (const invalid of [
      { status: 'invalid' },
      { dateTime: '2027-02-30T12:30' },
      { link: 'javascript:alert(1)' },
    ]) {
      expect(
        decodeTrips(encode([{ ...enriched, planning: [{ ...planning[0], ...invalid }] }])),
      ).toEqual([]);
    }
  });
  it('keeps old trips readable and validates saved planning items', () => {
    const planning = [
      {
        id: 'flight',
        category: 'transportation',
        name: 'Flight',
        details: 'Ref ABC · 12 May',
        completed: true,
      },
    ];
    const plannedTrip = { ...trip, planning };
    expect(decodeTrips(encode([trip]))).toEqual([trip]);
    expect(decodeTrips(encode([plannedTrip]))).toEqual([
      { ...plannedTrip, planning: [{ ...planning[0], status: 'booked' }] },
    ]);
    expect(
      decodeTrips(encode([{ ...trip, planning: [{ ...planning[0], category: 'invalid' }] }])),
    ).toEqual([]);
    expect(
      decodeTrips(encode([{ ...trip, planning: [{ ...planning[0], completed: 'yes' }] }])),
    ).toEqual([]);
    expect(decodeTrips(encode([{ ...trip, planning: [planning[0], planning[0]] }]))).toEqual([]);
  });
  it('preserves saved UK trips without guessing a constituent nation', () => {
    const legacyTrip = { ...trip, countryIds: [CountryList.UnitedKingdom] };
    expect(decodeTrips(encode([legacyTrip]))).toEqual([legacyTrip]);
  });
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
