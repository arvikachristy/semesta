import type { RootState } from '../store';
import { canary_registry } from '../../features/canary/canary-registry';
import type { CanaryID } from '../../features/canary/canary-registry';

export const selectCanaryEnabled = (state: RootState, id: CanaryID, devMode: boolean) =>
  devMode
    ? (state.canary.overrides[id] ?? canary_registry[id].isEnabled)
    : canary_registry[id].isEnabled;
