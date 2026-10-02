import europe from './assets/europe.svg';
import asia from './assets/asia.svg';
import africa from './assets/africa.svg';
import oceania from './assets/oceania.svg';
import antarctica from './assets/antarctica.svg';
import southAmerica from './assets/south-america.svg';
import northAmerica from './assets/north-america.svg';

export const ContinentId = {
  Europe: 'europe',
  Asia: 'asia',
  Africa: 'africa',
  Oceania: 'oceania',
  Antarctica: 'antarctica',
  SouthAmerica: 'south-america',
  NorthAmerica: 'north-america',
} as const;
export type TContinentId = (typeof ContinentId)[keyof typeof ContinentId];
export interface IContinent {
  id: TContinentId;
  name: string;
  artwork: string;
}
export const continents: readonly IContinent[] = [
  { id: ContinentId.Europe, name: 'Europe', artwork: europe },
  { id: ContinentId.Asia, name: 'Asia', artwork: asia },
  { id: ContinentId.Africa, name: 'Africa', artwork: africa },
  { id: ContinentId.Oceania, name: 'Oceania', artwork: oceania },
  { id: ContinentId.Antarctica, name: 'Antarctica', artwork: antarctica },
  { id: ContinentId.SouthAmerica, name: 'South America', artwork: southAmerica },
  { id: ContinentId.NorthAmerica, name: 'North America', artwork: northAmerica },
];
