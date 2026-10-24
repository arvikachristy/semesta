import { useAppSelector } from '../../redux/hooks';
import type { CanaryID } from './canary-registry';
import { selectCanaryEnabled } from '../../redux/canary/selectors';
import { useDevMode } from './use-dev-mode';

export const useCanary = (id: CanaryID) => {
  const devMode = useDevMode();
  return useAppSelector((state) => selectCanaryEnabled(state, id, devMode));
};
