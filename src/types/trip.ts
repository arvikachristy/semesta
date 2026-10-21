import type { CountryList } from './country';
import type { ITripPlanningItem, TPlanningCategory } from './trip-planning';
import { isBookingLink } from './trip-planning';

export interface ITripParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
}
export const isTripParticipant = (value: unknown): value is ITripParticipant =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string' &&
  value.id.length > 0 &&
  'name' in value &&
  typeof value.name === 'string' &&
  value.name.trim().length > 0 &&
  (!('avatarUrl' in value) || isBookingLink(value.avatarUrl));

export interface ITrip {
  id: string;
  name: string;
  countryIds: CountryList[];
  visitedCountryIds?: CountryList[];
  startDate: string;
  endDate: string;
  notes: string;
  planning?: ITripPlanningItem[];
  dismissedPlanningIds?: string[];
  activePlanningCategories?: TPlanningCategory[];
  participants?: ITripParticipant[];
  destination?: string;
  durationDays?: number;
  stops?: ITripStop[];
}

export interface ITripStop {
  id: string;
  name: string;
  nights: number;
}

export const isTripStop = (value: unknown): value is ITripStop =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string' &&
  value.id.length > 0 &&
  'name' in value &&
  typeof value.name === 'string' &&
  value.name.trim().length > 0 &&
  'nights' in value &&
  typeof value.nights === 'number' &&
  Number.isInteger(value.nights) &&
  value.nights >= 0 &&
  value.nights <= 364;

export type TTripDetails = Omit<ITrip, 'id'>;

export const emptyTripDetails: TTripDetails = {
  name: '',
  countryIds: [],
  startDate: '',
  endDate: '',
  notes: '',
};

export const isTripDate = (value: unknown): value is string => {
  if (value === '') {
    return true;
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
