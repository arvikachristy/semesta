import { normalizeCountrySelection } from './country-selection';
import type { ITrip } from '../types/trip';
import { isTripDate } from '../types/trip';

export const tripStorage = { key: 'semesta.upcoming-trips', version: 1 };

export interface ITripRepository {
  load: () => Promise<ITrip[]>;
  save: (trips: readonly ITrip[]) => Promise<void>;
}

const isTripRecord = (value: unknown): value is ITrip => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return (
    'id' in value &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    'name' in value &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    'startDate' in value &&
    isTripDate(value.startDate) &&
    'endDate' in value &&
    isTripDate(value.endDate) &&
    (!value.startDate || !value.endDate || value.startDate <= value.endDate) &&
    'notes' in value &&
    typeof value.notes === 'string' &&
    'countryIds' in value &&
    Array.isArray(value.countryIds) &&
    value.countryIds.every((id: unknown) => normalizeCountrySelection([id]).length === 1)
  );
};

export const decodeTrips = (raw: string | null): ITrip[] => {
  if (raw === null) {
    return [];
  }
  const record: unknown = JSON.parse(raw);
  if (
    typeof record !== 'object' ||
    record === null ||
    !('version' in record) ||
    record.version !== tripStorage.version ||
    !('trips' in record) ||
    !Array.isArray(record.trips)
  ) {
    throw new Error('Unsupported trip data');
  }
  const ids = new Set<string>();
  return record.trips
    .filter(isTripRecord)
    .filter((trip) => {
      if (ids.has(trip.id)) {
        return false;
      }
      ids.add(trip.id);
      return true;
    })
    .map((trip) => ({ ...trip, countryIds: normalizeCountrySelection(trip.countryIds) }));
};

// Only this adapter knows about browser storage; an account adapter can replace it later.
export const createLocalTripRepository = (
  getStorage: () => Pick<Storage, 'getItem' | 'setItem'> = () => window.localStorage,
): ITripRepository => ({
  load: async () => decodeTrips(getStorage().getItem(tripStorage.key)),
  save: async (trips) => {
    getStorage().setItem(tripStorage.key, JSON.stringify({ version: tripStorage.version, trips }));
  },
});
