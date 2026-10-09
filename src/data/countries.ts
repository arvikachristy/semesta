import { CountryList } from '../types/country';
import { continentDefinitions } from '../types/continent';
import { countryCatalogue as countries } from './country-catalogue';
export { countries };
export type { ICountryDefinition } from './flag-definitions';

export const countryIds = Object.values(CountryList);
export const countryGroups = continentDefinitions
  .map((continent) => ({
    ...continent,
    countries: countryIds
      .map((id) => countries[id])
      .filter((country) => country.continent === continent.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }))
  .filter((group) => group.countries.length > 0);
export const defaultCountries: CountryList[] = [CountryList.Indonesia];

export const toggleCountry = (
  current: readonly CountryList[],
  country: CountryList,
  checked: boolean,
  limit: number,
) => {
  if (
    checked &&
    !current.includes(country) &&
    current.filter((id) => countries[id].continent === countries[country].continent).length >= limit
  ) {
    return [...current];
  }
  const selected = new Set(current);
  if (checked) {
    selected.add(country);
  } else {
    selected.delete(country);
  }
  return countryIds.filter((id) => selected.has(id));
};
