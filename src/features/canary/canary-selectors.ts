import type { RootState } from '../../app/store';
import { canary_registry } from './canary-registry';
import type { CanaryID } from './canary-registry';

export const selectCanaryEnabled = (state: RootState, id: CanaryID, devMode: boolean) =>
  devMode
    ? (state.canary.overrides[id] ?? canary_registry[id].isEnabled)
    : canary_registry[id].isEnabled;
