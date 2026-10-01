import { CountryCode, type TCountryCode } from '../types/country';

export { CountryCode, type TCountryCode } from '../types/country';

export interface IFlagDefinition {
  code: TCountryCode;
  name: string;
  artwork: string;
  aspectRatio: number;
  edgeColor: string;
  // Points use artwork coordinates: (0, 0) is bottom-left; (1, 1) is top-right.
  outline: ReadonlyArray<readonly [number, number]>;
}

export const flags: Record<TCountryCode, IFlagDefinition> = {
  [CountryCode.ID]: {
    code: CountryCode.ID,
    name: 'Indonesia',
    artwork: 'https://cdn.jsdelivr.net/gh/hampusborgos/country-flags@main/svg/id.svg',
    aspectRatio: 1.5,
    edgeColor: '#ce1126',
    outline: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
  },
  [CountryCode.FR]: {
    code: CountryCode.FR,
    name: 'France',
    artwork: 'https://cdn.jsdelivr.net/gh/hampusborgos/country-flags@main/svg/fr.svg',
    aspectRatio: 1.5,
    edgeColor: '#000b69',
    outline: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
  },
  [CountryCode.NP]: {
    code: CountryCode.NP,
    name: 'Nepal',
    artwork: 'https://cdn.jsdelivr.net/gh/hampusborgos/country-flags@main/svg/np.svg',
    aspectRatio: 363.94 / 467.82,
    edgeColor: '#000063',
    outline: [
      [0, 0],
      [0.976, 0],
      [0.337, 0.504],
      [1, 0.503],
      [0, 1],
    ],
  },
};
