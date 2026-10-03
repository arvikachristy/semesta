import { describe, expect, it } from 'vitest';
import { countries, countryGroups, countryIds, defaultCountries, toggleCountry } from './countries';
import { CountryList } from '../types/country';
import { ContinentId } from '../types/continent';

describe('country registry and selection', () => {
  it('derives each checkbox and flag from the same enum-keyed record', () => {
    expect(Object.keys(countries).sort()).toEqual([...countryIds].sort());
    const listed = countryGroups.flatMap((group) =>
      group.countries.map((country) => {
        expect(country.continent).toBe(group.id);
        expect(country).toBe(countries[country.code]);
        expect(country.pattern).toBeDefined();
        return country.code;
      }),
    );
    expect(listed.sort()).toEqual([...countryIds].sort());
    expect(countries[CountryList.Kazakhstan].continent).toBe(ContinentId.Asia);
    expect(countries[CountryList.France].continent).toBe(ContinentId.Europe);
  });
  it('starts with Indonesia and supports multiple unique selections or no jellies', () => {
    expect(defaultCountries).toEqual([CountryList.Indonesia]);
    const add = toggleCountry(defaultCountries, CountryList.France, true, 60);
    expect(add).toContain(CountryList.Indonesia);
    expect(add).toContain(CountryList.France);
    expect(toggleCountry(add, CountryList.France, true, 60)).toEqual(add);
    expect(toggleCountry(add, CountryList.Indonesia, false, 60)).toEqual([CountryList.France]);
    expect(toggleCountry(defaultCountries, CountryList.Indonesia, false, 60)).toEqual([]);
    expect(defaultCountries).toEqual([CountryList.Indonesia]);
  });
  it('limits additions by continent and preserves canonical enum order', () => {
    const current = [CountryList.France, CountryList.Indonesia];
    expect(toggleCountry(current, CountryList.Germany, true, 1)).toEqual(current);
    const reordered = toggleCountry([CountryList.France], CountryList.Indonesia, true, 60);
    expect(reordered).toEqual([CountryList.Indonesia, CountryList.France]);
  });
});
