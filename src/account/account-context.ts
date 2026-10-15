import { createContext, useContext } from 'react';
import { createLocalCountrySelectionRepository } from '../storage/country-selection';
import type { ICountrySelectionRepository } from '../storage/country-selection';
import { createLocalWishlistRepository } from '../storage/country-wishlist';
import { createLocalTripRepository } from '../storage/trips';
import type { ITripRepository } from '../storage/trips';
import { accountConfig, BackupStatus } from './account-config';
import type { TBackupStatus } from './account-config';

export const guestRepositories = {
  countries: createLocalCountrySelectionRepository(),
  trips: createLocalTripRepository(),
  wishlist: createLocalWishlistRepository(),
};
export interface IAccountContext {
  configured: boolean;
  userId: string;
  email: string | null;
  status: TBackupStatus;
  countries: ICountrySelectionRepository;
  trips: ITripRepository;
  wishlist?: ICountrySelectionRepository;
  importGuest?: () => Promise<void>;
  reloadCloud?: () => Promise<void>;
  retry?: () => Promise<void>;
  signOut?: () => Promise<void>;
  deleteAccount?: () => Promise<void>;
  hasTrips: boolean;
}
export const AccountContext = createContext<IAccountContext>({
  configured: false,
  userId: accountConfig.guestId,
  email: null,
  status: BackupStatus.Local,
  ...guestRepositories,
  hasTrips: false,
});
export const useAccount = () => useContext(AccountContext);
