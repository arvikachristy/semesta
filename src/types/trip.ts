import type { CountryList } from './country';
import type { ITripPlanningItem, TPlanningCategory } from './trip-planning';

export interface ITrip {
  id: string;
  name: string;
  countryIds: CountryList[];
  startDate: string;
  endDate: string;
  notes: string;
  planning?: ITripPlanningItem[];
  activePlanningCategories?: TPlanningCategory[];
}

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
