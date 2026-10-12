import { countryGroups } from '../../data/countries';
import type { TContinentId } from '../../types/continent';
import { jellyParameters } from '../jelly-flags/jelly-parameters';
import { glassParameters } from './glass-parameters';

// Shared allowance keeps cocktail bowl volumes proportional to catalogue counts.
export const cocktailPackingFraction = 0.25;
export const getCountryCapacity = (continent: TContinentId) =>
  countryGroups.find(({ id }) => id === continent)!.countries.length;
export const getCocktailBowlVolume = (capacity: number) => {
  const { width, height, depth } = jellyParameters.surface;
  const jellyVolume = width * height * depth * glassParameters.jellyScale ** 3;
  return (
    (capacity * jellyVolume) / (cocktailPackingFraction * (1 - glassParameters.topBufferFraction))
  );
};
