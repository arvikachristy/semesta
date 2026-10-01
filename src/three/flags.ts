import { CountryCode, type TCountryCode } from '../types/country';
import type { TFlagPattern } from '../types/flag-pattern';

export { CountryCode, type TCountryCode } from '../types/country';

export interface IFlagSize {
  // Relative dimensions, expressed as width : height.
  width: number;
  height: number;
}

export interface IFlagDefinition {
  code: TCountryCode;
  name: string;
  pattern: TFlagPattern;
  size: IFlagSize;
  edgeColor: string;
  // Points use artwork coordinates: (0, 0) is bottom-left; (1, 1) is top-right.
  outline: ReadonlyArray<readonly [number, number]>;
}

const rectangularOutline: IFlagDefinition['outline'] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

// Palette references and specification limits are documented in README.md.
export const flags: Record<TCountryCode, IFlagDefinition> = {
  [CountryCode.ID]: {
    code: CountryCode.ID,
    name: 'Indonesia',
    pattern: { type: 'stripes', orientation: 'horizontal', colors: ['#ff0000', '#ffffff'] },
    size: { width: 3, height: 2 },
    edgeColor: '#ff0000',
    outline: rectangularOutline,
  },
  [CountryCode.FR]: {
    code: CountryCode.FR,
    name: 'France',
    pattern: {
      type: 'stripes',
      orientation: 'vertical',
      colors: ['#051440', '#ffffff', '#EC1920'],
    },
    size: { width: 3, height: 2 },
    edgeColor: '#051440',
    outline: rectangularOutline,
  },
  [CountryCode.NP]: {
    code: CountryCode.NP,
    name: 'Nepal',
    pattern: {
      type: 'svg',
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
  [CountryCode.DE]: {
    code: CountryCode.DE,
    name: 'Germany',
    size: { width: 5, height: 3 },
    edgeColor: '#000000',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      colors: ['#000000', '#ff0000', '#ffcc00'],
    },
    outline: rectangularOutline,
  },
  [CountryCode.PL]: {
    code: CountryCode.PL,
    name: 'Poland',
    size: { width: 8, height: 5 },
    edgeColor: '#dc143c',
    pattern: { type: 'stripes', orientation: 'horizontal', colors: ['#ffffff', '#dc143c'] },
    outline: rectangularOutline,
  },
  [CountryCode.KZ]: {
    code: CountryCode.KZ,
    name: 'Kazakhstan',
    size: { width: 2, height: 1 },
    edgeColor: '#00afca',
    pattern: {
      type: 'svg',
      src: 'https://cdn.jsdelivr.net/gh/hampusborgos/country-flags@main/svg/kz.svg',
      background: '#00afca',
      inset: 0,
    },
    outline: rectangularOutline,
  },
  [CountryCode.BN]: {
    code: CountryCode.BN,
    name: 'Brunei',
    size: { width: 2, height: 1 },
    edgeColor: '#f7e017',
    pattern: {
      type: 'svg',
      src: 'https://cdn.jsdelivr.net/gh/hampusborgos/country-flags@main/svg/bn.svg',
      background: '#f7e017',
      inset: 0,
    },
    outline: rectangularOutline,
  },
};
