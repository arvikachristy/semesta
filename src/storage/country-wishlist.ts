import type { CountryList } from '../types/country';
import type { ICountrySelectionRepository } from './country-selection';
import { normalizeCountrySelection } from './country-selection';

export const wishlistStorage = { key: 'semesta.country-wishlist', version: 1 };
export const emptyWishlist: CountryList[] = [];

export const decodeWishlist = (raw: string | null): CountryList[] => {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (
      typeof value === 'object' &&
      value !== null &&
      'version' in value &&
      value.version === wishlistStorage.version &&
      'countryIds' in value &&
      Array.isArray(value.countryIds)
    ) {
      return normalizeCountrySelection(value.countryIds);
    }
  } catch {
    // A damaged wishlist must never change the visited collection.
  }
  return [];
};

export const createLocalWishlistRepository = (
  getStorage: () => Pick<Storage, 'getItem' | 'setItem'> = () => window.localStorage,
): ICountrySelectionRepository => {
  let memory: CountryList[] = [];
  return {
    load: async () => {
      try {
        memory = decodeWishlist(getStorage().getItem(wishlistStorage.key));
      } catch {
        // Keep the session usable when storage is unavailable.
      }
      return [...memory];
    },
    save: async (ids) => {
      memory = normalizeCountrySelection(ids);
      try {
        getStorage().setItem(
          wishlistStorage.key,
          JSON.stringify({ version: wishlistStorage.version, countryIds: memory }),
        );
      } catch {
        // Wishes remain in memory until the tab closes.
      }
    },
  };
};
