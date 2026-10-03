import europe from './assets/europe.svg';
import asia from './assets/asia.svg';
import africa from './assets/africa.svg';
import oceania from './assets/oceania.svg';
import antarctica from './assets/antarctica.svg';
import southAmerica from './assets/south-america.svg';
import northAmerica from './assets/north-america.svg';

import { continentDefinitions, ContinentId } from '../../types/continent';
import type { TContinentId } from '../../types/continent';
export { ContinentId } from '../../types/continent';
export type { TContinentId } from '../../types/continent';
export interface IContinent {
  id: TContinentId;
  name: string;
  artwork: string;
}
const artwork: Record<TContinentId, string> = {
  [ContinentId.Europe]: europe,
  [ContinentId.Asia]: asia,
  [ContinentId.Africa]: africa,
  [ContinentId.Oceania]: oceania,
  [ContinentId.Antarctica]: antarctica,
  [ContinentId.SouthAmerica]: southAmerica,
  [ContinentId.NorthAmerica]: northAmerica,
};
export const continents: readonly IContinent[] = continentDefinitions.map((continent) => ({
  ...continent,
  artwork: artwork[continent.id],
}));
