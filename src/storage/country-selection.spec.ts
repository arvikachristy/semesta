import { describe, expect, it } from 'vitest';
import { CountryList } from '../types/country';
import { countryIds, defaultCountries } from '../data/countries';
import {
  createLocalCountrySelectionRepository,
  decodeCountrySelection,
  selectionStorage,
} from './country-selection';

const encode = (selectedCountryIds: unknown[]) =>
  JSON.stringify({
    version: selectionStorage.version,
    selectedCountryIds,
  });

describe('local country selection repository', () => {
  it('defaults only missing, malformed, or unsupported records and preserves an empty selection', () => {
    for (const invalid of [null, '{', '{}', '{"version":999,"selectedCountryIds":[]}']) {
      expect(decodeCountrySelection(invalid)).toEqual(defaultCountries);
    }
    expect(decodeCountrySelection(encode([]))).toEqual([]);
  });
  it('validates IDs without casts and removes duplicates in canonical order', () => {
    expect(
      decodeCountrySelection(
        encode([CountryList.France, null, 'unknown', CountryList.Indonesia, CountryList.France, 1]),
      ),
    ).toEqual([CountryList.Indonesia, CountryList.France]);
  });
  it('round-trips every country through storage with a small payload', async () => {
    const records = new Map<string, string>();
    const repository = createLocalCountrySelectionRepository(() => ({
      getItem: (key) => records.get(key) ?? null,
      setItem: (key, value) => {
        records.set(key, value);
      },
    }));
    await repository.save(countryIds);
    expect(await repository.load()).toEqual(countryIds);
    expect(records.get(selectionStorage.key)?.length).toBeLessThan(1500);
    await repository.save([]);
    expect(await repository.load()).toEqual([]);
  });
  it('remains usable when browser storage access or writes throw', async () => {
    const repository = createLocalCountrySelectionRepository(() => {
      throw new Error('Storage unavailable');
    });
    expect(await repository.load()).toEqual(defaultCountries);
    await repository.save([CountryList.Kazakhstan]);
    expect(await repository.load()).toEqual([CountryList.Kazakhstan]);
  });
});
