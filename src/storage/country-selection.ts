import { countryIds, defaultCountries } from '../data/countries';
import type { CountryList } from '../types/country';

export const selectionStorage = { key: 'semesta.country-selection', version: 1 };

export interface ICountrySelectionRepository {
  load: () => Promise<CountryList[]>;
  save: (countries: readonly CountryList[]) => Promise<void>;
}

export const normalizeCountrySelection = (values: readonly unknown[]): CountryList[] => {
  const selected = new Set(values);
  return countryIds.filter((country) => selected.has(country));
};

export const decodeCountrySelection = (raw: string | null): CountryList[] => {
  if (raw === null) {
    return [...defaultCountries];
  }
  try {
    const record: unknown = JSON.parse(raw);
    if (
      typeof record === 'object' &&
      record !== null &&
      'version' in record &&
      record.version === selectionStorage.version &&
      'selectedCountryIds' in record &&
      Array.isArray(record.selectedCountryIds)
    ) {
      return normalizeCountrySelection(record.selectedCountryIds);
    }
  } catch {
    // Corrupt or obsolete storage must not prevent the scene from opening.
  }
  return [...defaultCountries];
};

// The browser adapter is the only code that knows about localStorage. An API adapter
// can implement the same asynchronous contract when accounts are introduced.
export const createLocalCountrySelectionRepository = (
  getStorage: () => Pick<Storage, 'getItem' | 'setItem'> = () => window.localStorage,
): ICountrySelectionRepository => {
  let memory = [...defaultCountries];
  return {
    load: async () => {
      try {
        memory = decodeCountrySelection(getStorage().getItem(selectionStorage.key));
      } catch {
        // Private browsing or disabled storage: retain selections for this session.
      }
      return [...memory];
    },
    save: async (countries) => {
      memory = normalizeCountrySelection(countries);
      try {
        getStorage().setItem(
          selectionStorage.key,
          JSON.stringify({
            version: selectionStorage.version,
            selectedCountryIds: memory,
          }),
        );
      } catch {
        // Quota/security errors leave the live selection usable in memory.
      }
    },
  };
};
