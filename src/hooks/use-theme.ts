import { useSyncExternalStore } from 'react';
import { getTheme, subscribeTheme } from '../styles/theme';

export const useTheme = () => useSyncExternalStore(subscribeTheme, getTheme);
