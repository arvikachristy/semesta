import { normalizeCountrySelection } from './country-selection';
import type { ITrip } from '../types/trip';
import { isTripDate, isTripParticipant } from '../types/trip';
import {
  isTripPlanningItem,
  isPlanningCategory,
  normalizePlanningItem,
} from '../types/trip-planning';

export const tripStorage = { key: 'semesta.upcoming-trips', version: 1 };

export interface ITripRepository {
  load: () => Promise<ITrip[]>;
  save: (trips: readonly ITrip[]) => Promise<void>;
}

export const isTripRecord = (value: unknown): value is ITrip => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const destinationIds =
    'countryIds' in value && Array.isArray(value.countryIds) ? value.countryIds : [];
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
    value.countryIds.every((id: unknown) => normalizeCountrySelection([id]).length === 1) &&
    (!('visitedCountryIds' in value) ||
      (Array.isArray(value.visitedCountryIds) &&
        value.visitedCountryIds.every(
          (id: unknown) =>
            normalizeCountrySelection([id]).length === 1 && destinationIds.includes(id),
        ) &&
        new Set(value.visitedCountryIds).size === value.visitedCountryIds.length)) &&
    (!('planning' in value) ||
      (Array.isArray(value.planning) &&
        value.planning.every(isTripPlanningItem) &&
        new Set(value.planning.map((item) => item.id)).size === value.planning.length)) &&
    (!('activePlanningCategories' in value) ||
      (Array.isArray(value.activePlanningCategories) &&
        value.activePlanningCategories.every(isPlanningCategory) &&
        new Set(value.activePlanningCategories).size === value.activePlanningCategories.length)) &&
    (!('participants' in value) ||
      (Array.isArray(value.participants) &&
        value.participants.every(isTripParticipant) &&
        new Set(value.participants.map((participant) => participant.id)).size ===
          value.participants.length))
  );
};

export const normalizeTripPlanning = (trip: ITrip): ITrip =>
  trip.planning ? { ...trip, planning: trip.planning.map(normalizePlanningItem) } : trip;

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
    .map((trip) =>
      normalizeTripPlanning({ ...trip, countryIds: normalizeCountrySelection(trip.countryIds) }),
    );
};

// Only this adapter knows about browser storage; an account adapter can replace it later.
export const createLocalTripRepository = (
  getStorage: () => Pick<Storage, 'getItem' | 'setItem'> = () => window.localStorage,
): ITripRepository => ({
  load: async () => decodeTrips(getStorage().getItem(tripStorage.key)),
  save: async (trips) => {
    getStorage().setItem(
      tripStorage.key,
      JSON.stringify({ version: tripStorage.version, trips: trips.map(normalizeTripPlanning) }),
    );
  },
});
