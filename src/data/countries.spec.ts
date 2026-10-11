import { describe, expect, it } from 'vitest';
import { countries, countryGroups, countryIds, defaultCountries, toggleCountry } from './countries';
import { CountryList } from '../types/country';
import { ContinentId } from '../types/continent';
import { existsSync, readFileSync } from 'node:fs';
import { glassParameters } from '../three/glasses/glass-parameters';

describe('country registry and selection', () => {
  it('replaces the UK picker entry with its four constituent nations', () => {
    expect(countryIds).toHaveLength(198);
    expect(new Set(countryIds).size).toBe(198);
    for (const code of countryIds) {
      const file = new URL(`../../public/flags/${code.toLowerCase()}.svg`, import.meta.url);
      expect(existsSync(file), code).toBe(true);
      expect(readFileSync(file, 'utf8')).toContain('<svg');
      expect(countries[code].size.width).toBeGreaterThan(0);
      expect(countries[code].size.height).toBeGreaterThan(0);
    }
    expect(countryGroups.map((group) => group.countries.length)).toEqual([
      47, 48, 54, 14, 0, 12, 23,
    ]);
    expect(countryGroups.every((group) => group.countries.length <= glassParameters.capacity)).toBe(
      true,
    );
    expect(countryIds).toContain(CountryList.HolySee);
    expect(countryIds).toContain(CountryList.Palestine);
    expect(countryIds).not.toContain(CountryList.UnitedKingdom);
    expect(countryIds).toContain(CountryList.England);
    expect(countryIds).toContain(CountryList.Scotland);
    expect(countryIds).toContain(CountryList.Wales);
    expect(countryIds).toContain(CountryList.NorthernIreland);
  });
  it('derives each checkbox and flag from the same enum-keyed record', () => {
    expect(Object.keys(countries).sort()).toEqual(
      [...countryIds, CountryList.UnitedKingdom].sort(),
    );
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
    expect(countries[CountryList.England].continent).toBe(ContinentId.Europe);
    expect(countries[CountryList.NorthernIreland].continent).toBe(ContinentId.Europe);
    expect(countries[CountryList.Scotland].continent).toBe(ContinentId.Europe);
    expect(countries[CountryList.Wales].continent).toBe(ContinentId.Europe);
    expect(countries[CountryList.UnitedKingdom].code).not.toBe(countries[CountryList.England].code);
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
