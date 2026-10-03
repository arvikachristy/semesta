import { FlagPatternType, StripeOrientation } from '../types/flag-pattern';
import { CountryList } from '../types/country';
import { ContinentId, continentDefinitions } from '../types/continent';
import type { TContinentId } from '../types/continent';
import type { TFlagPattern } from '../types/flag-pattern';

export interface IFlagSize {
  // Relative dimensions, expressed as width : height.
  width: number;
  height: number;
}

export interface ICountryDefinition {
  code: CountryList;
  name: string;
  continent: TContinentId;
  pattern: TFlagPattern;
  size: IFlagSize;
  edgeColor: string;
  // Points use artwork coordinates: (0, 0) is bottom-left; (1, 1) is top-right.
  outline: ReadonlyArray<readonly [number, number]>;
}

const rectangularOutline: ICountryDefinition['outline'] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

// Palette references and specification limits are documented in README.md.
export const countries: Record<CountryList, ICountryDefinition> = {
  [CountryList.Indonesia]: {
    code: CountryList.Indonesia,
    name: 'Indonesia',
    continent: ContinentId.Asia,
    pattern: {
      type: FlagPatternType.Stripes,
      orientation: StripeOrientation.Horizontal,
      colors: ['#ff0000', '#ffffff'],
    },
    size: { width: 3, height: 2 },
    edgeColor: '#ff0000',
    outline: rectangularOutline,
  },
  [CountryList.France]: {
    code: CountryList.France,
    name: 'France',
    continent: ContinentId.Europe,
    pattern: {
      type: FlagPatternType.Stripes,
      orientation: StripeOrientation.Vertical,
      colors: ['#051440', '#ffffff', '#EC1920'],
    },
    size: { width: 3, height: 2 },
    edgeColor: '#051440',
    outline: rectangularOutline,
  },
  [CountryList.Nepal]: {
    code: CountryList.Nepal,
    name: 'Nepal',
    continent: ContinentId.Asia,
    pattern: {
      type: FlagPatternType.Svg,
      src: 'https://cdn.jsdelivr.net/gh/hampusborgos/country-flags@main/svg/np.svg',
      background: '#f7b8cb',
      inset: 0.0390625,
    },
    size: { width: 363.94, height: 467.82 },
    edgeColor: '#003893',
    outline: [
      [0, 0],
      [0.976, 0],
      [0.337, 0.504],
      [1, 0.503],
      [0, 1],
    ],
  },
  [CountryList.Germany]: {
    code: CountryList.Germany,
    name: 'Germany',
    continent: ContinentId.Europe,
    size: { width: 5, height: 3 },
    edgeColor: '#000000',
    pattern: {
      type: FlagPatternType.Stripes,
      orientation: StripeOrientation.Horizontal,
      colors: ['#000000', '#ff0000', '#ffcc00'],
    },
    outline: rectangularOutline,
  },
  [CountryList.Poland]: {
    code: CountryList.Poland,
    name: 'Poland',
    continent: ContinentId.Europe,
    size: { width: 8, height: 5 },
    edgeColor: '#dc143c',
    pattern: {
      type: FlagPatternType.Stripes,
      orientation: StripeOrientation.Horizontal,
      colors: ['#ffffff', '#dc143c'],
    },
    outline: rectangularOutline,
  },
  [CountryList.Kazakhstan]: {
    code: CountryList.Kazakhstan,
    name: 'Kazakhstan',
    continent: ContinentId.Asia,
    size: { width: 2, height: 1 },
    edgeColor: '#00afca',
    pattern: {
      type: FlagPatternType.Svg,
      src: 'https://cdn.jsdelivr.net/gh/hampusborgos/country-flags@main/svg/kz.svg',
      background: '#00afca',
      inset: 0,
    },
    outline: rectangularOutline,
  },
  [CountryList.Brunei]: {
    code: CountryList.Brunei,
    name: 'Brunei',
    continent: ContinentId.Asia,
    size: { width: 2, height: 1 },
    edgeColor: '#f7e017',
    pattern: {
      type: FlagPatternType.Svg,
      src: 'https://cdn.jsdelivr.net/gh/hampusborgos/country-flags@main/svg/bn.svg',
      background: '#f7e017',
      inset: 0,
    },
    outline: rectangularOutline,
  },
};

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
