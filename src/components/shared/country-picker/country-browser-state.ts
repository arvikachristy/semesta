import type { CountryList } from '../../../types/country';
import type { TContinentId } from '../../../types/continent';

export const CountryFilter = { All: 'all', Visited: 'visited', Wishlist: 'wishlist' } as const;
export type TCountryFilter = (typeof CountryFilter)[keyof typeof CountryFilter];
export interface ICountryBrowserState {
  continent: TContinentId | null;
  filter: TCountryFilter;
  query: string;
  selected: CountryList | null;
}
export const initialCountryBrowser: ICountryBrowserState = {
  continent: null,
  filter: CountryFilter.All,
  query: '',
  selected: null,
};
