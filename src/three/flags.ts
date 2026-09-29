import indonesiaArtwork from '../assets/flags/id.svg?url';
import nepalArtwork from '../assets/flags/np.svg?url';

export type TCountryCode = 'ID' | 'NP';

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
  ID: {
    code: 'ID',
    name: 'Indonesia',
    artwork: indonesiaArtwork,
    aspectRatio: 1.5,
    edgeColor: '#ce1126',
    outline: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
  },
  NP: {
    code: 'NP',
    name: 'Nepal',
    artwork: nepalArtwork,
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
