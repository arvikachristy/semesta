import type { ICountryDefinition } from '../../../data/countries';

export const normalizeCountryQuery = (query: string) => query.trim().toLocaleLowerCase();
export const matchesCountryQuery = (country: ICountryDefinition, query: string) =>
  [country.name, country.code, ...(country.aliases ?? [])]
    .join(' ')
    .toLocaleLowerCase()
    .includes(normalizeCountryQuery(query));
