import { useLocation } from 'react-router';

export const isDevMode = (search: string) =>
  new URLSearchParams(search).get('devmode') === 'true';

export const useDevMode = () => isDevMode(useLocation().search);
