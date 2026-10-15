import { describe, expect, it } from 'vitest';
import { createLocalWishlistRepository, decodeWishlist, wishlistStorage } from './country-wishlist';
import { CountryList } from '../types/country';
import { decodeWorkspaceRecord, mergeWorkspaces } from '../account/workspace';
import { accountConfig } from '../account/account-config';

describe('wishlist storage and migration', () => {
  it('starts empty and normalizes IDs without changing visited storage', async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const repository = createLocalWishlistRepository(() => storage);
    expect(await repository.load()).toEqual([]);
    await repository.save([CountryList.Peru, CountryList.Peru]);
    expect(await repository.load()).toEqual([CountryList.Peru]);
    expect([...values.keys()]).toEqual([wishlistStorage.key]);
    expect(decodeWishlist('{broken')).toEqual([]);
    expect(
      decodeWishlist(JSON.stringify({ version: 1, countryIds: ['invalid', CountryList.Peru] })),
    ).toEqual([CountryList.Peru]);
  });
  it('reads a legacy account as visited history with no wishes and validates optional wishes', () => {
    const record = {
      version: accountConfig.version,
      revision: 1,
      dirty: false,
      workspace: { countries: [CountryList.France], trips: [] },
    };
    expect(decodeWorkspaceRecord(record).workspace).toEqual({
      ...record.workspace,
      wishlistCountryIds: [],
    });
    expect(() =>
      decodeWorkspaceRecord({
        ...record,
        workspace: { ...record.workspace, wishlistCountryIds: ['invalid'] },
      }),
    ).toThrow();
    const guest = {
      countries: [CountryList.Indonesia],
      trips: [],
      wishlistCountryIds: [CountryList.France, CountryList.Peru],
    };
    const account = { ...record.workspace, wishlistCountryIds: [CountryList.Iceland] };
    const merged = mergeWorkspaces(account, guest);
    expect(merged.wishlistCountryIds).toEqual(
      expect.arrayContaining([CountryList.France, CountryList.Peru, CountryList.Iceland]),
    );
    expect(merged.countries).not.toContain(CountryList.Peru);
    expect(mergeWorkspaces(merged, guest)).toEqual(merged);
  });
});
