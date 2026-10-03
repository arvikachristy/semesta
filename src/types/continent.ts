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
export const continentDefinitions = [
  { id: ContinentId.Europe, name: 'Europe' },
  { id: ContinentId.Asia, name: 'Asia' },
  { id: ContinentId.Africa, name: 'Africa' },
  { id: ContinentId.Oceania, name: 'Oceania' },
  { id: ContinentId.Antarctica, name: 'Antarctica' },
  { id: ContinentId.SouthAmerica, name: 'South America' },
  { id: ContinentId.NorthAmerica, name: 'North America' },
];
