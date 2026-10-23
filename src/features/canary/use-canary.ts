import { useAppSelector } from '../../app/hooks';
import type { CanaryID } from './canary-registry';
import { selectCanaryEnabled } from './canary-selectors';

export const useCanary = (id: CanaryID) =>
  useAppSelector((state) => selectCanaryEnabled(state, id));
