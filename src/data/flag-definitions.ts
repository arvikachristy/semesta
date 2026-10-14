import { CountryList } from '../types/country';
import type { TContinentId } from '../types/continent';
import { FlagPatternType, StripeOrientation } from '../types/flag-pattern';
import type { TFlagPattern } from '../types/flag-pattern';

export const flagArtwork = {
  directory: `${import.meta.env.BASE_URL}flags/`,
  extension: '.svg',
  surround: '#f7b8cb',
  white: '#ffffff',
  red: '#ff0000',
};

interface ICountryMetadata {
  name: string;
  aliases?: readonly string[];
  continent: TContinentId;
  size: { width: number; height: number };
}

export interface ICountryDefinition extends ICountryMetadata {
  code: CountryList;
  pattern: TFlagPattern;
}

// Preserve the established palettes; every other flag uses the same SVG path.
const patternOverrides: Partial<Record<CountryList, TFlagPattern>> = {
  [CountryList.Indonesia]: {
    type: FlagPatternType.Stripes,
    orientation: StripeOrientation.Horizontal,
    colors: [flagArtwork.red, flagArtwork.white],
  },
  [CountryList.France]: {
    type: FlagPatternType.Stripes,
    orientation: StripeOrientation.Vertical,
    colors: ['#051440', flagArtwork.white, '#EC1920'],
  },
  [CountryList.Germany]: {
    type: FlagPatternType.Stripes,
    orientation: StripeOrientation.Horizontal,
    colors: ['#000000', flagArtwork.red, '#ffcc00'],
  },
  [CountryList.Poland]: {
    type: FlagPatternType.Stripes,
    orientation: StripeOrientation.Horizontal,
    colors: [flagArtwork.white, '#dc143c'],
  },
};

const backgrounds: Partial<Record<CountryList, string>> = {
  [CountryList.Kazakhstan]: '#00afca',
  [CountryList.Brunei]: '#f7e017',
};

export const flagAssetPath = (country: CountryList) =>
  `${flagArtwork.directory}${country.toLowerCase()}${flagArtwork.extension}`;

export const createCountryDefinition = (
  code: CountryList,
  metadata: ICountryMetadata,
): ICountryDefinition => ({
  ...metadata,
  code,
  pattern: patternOverrides[code] ?? {
    type: FlagPatternType.Svg,
    src: flagAssetPath(code),
    background: backgrounds[code] ?? flagArtwork.surround,
    inset: code === CountryList.Nepal ? 0.0390625 : 0,
  },
});
