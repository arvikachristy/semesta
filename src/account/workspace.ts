import { defaultCountries } from '../data/countries';
import type { CountryList } from '../types/country';
import type { ITrip } from '../types/trip';
import { isTripRecord } from '../storage/trips';
import { normalizeCountrySelection } from '../storage/country-selection';
import { accountConfig } from './account-config';

export interface IWorkspace {
  countries: CountryList[];
  trips: ITrip[];
}
export interface IWorkspaceRecord {
  version: number;
  revision: number;
  dirty: boolean;
  workspace: IWorkspace;
}
export const emptyWorkspace = (): IWorkspace => ({ countries: [...defaultCountries], trips: [] });
export const isWorkspace = (value: unknown): value is IWorkspace => {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('countries' in value) ||
    !('trips' in value)
  ) {
    return false;
  }
  return (
    Array.isArray(value.countries) &&
    value.countries.every((id: unknown) => normalizeCountrySelection([id]).length === 1) &&
    Array.isArray(value.trips) &&
    value.trips.every(isTripRecord)
  );
};
export const decodeWorkspaceRecord = (value: unknown): IWorkspaceRecord => {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('version' in value) ||
    value.version !== accountConfig.version ||
    !('revision' in value) ||
    typeof value.revision !== 'number' ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 0 ||
    !('dirty' in value) ||
    typeof value.dirty !== 'boolean' ||
    !('workspace' in value) ||
    !isWorkspace(value.workspace)
  ) {
    throw new Error('Unsupported backup data');
  }
  return {
    version: value.version,
    revision: value.revision,
    dirty: value.dirty,
    workspace: value.workspace,
  };
};
// Existing account trips win on an ID collision. Importing twice is idempotent.
export const mergeWorkspaces = (account: IWorkspace, guest: IWorkspace): IWorkspace => ({
  countries: normalizeCountrySelection([...account.countries, ...guest.countries]),
  trips: [
    ...account.trips,
    ...guest.trips.filter((trip) => !account.trips.some(({ id }) => id === trip.id)),
  ],
});
