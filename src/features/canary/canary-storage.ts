import { CanaryIDs } from './canary-registry';
import type { CanaryID } from './canary-registry';

export const canaryStorage = {
  key: 'semesta.canary.v1',
  version: 1,
} as const;

export type TCanaryOverrides = Partial<Record<CanaryID, boolean>>;

export const readCanaryOverrides = (): TCanaryOverrides => {
  try {
    const raw = localStorage.getItem(canaryStorage.key);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('version' in parsed) ||
      parsed.version !== canaryStorage.version ||
      !('overrides' in parsed) ||
      typeof parsed.overrides !== 'object' ||
      parsed.overrides === null
    ) {
      return {};
    }
    const overrides: TCanaryOverrides = {};
    for (const id of Object.values(CanaryIDs)) {
      if (id in parsed.overrides) {
        const enabled = Object.getOwnPropertyDescriptor(parsed.overrides, id)?.value;
        if (typeof enabled === 'boolean') {
          overrides[id] = enabled;
        }
      }
    }
    return overrides;
  } catch {
    return {};
  }
};

export const saveCanaryOverrides = (overrides: TCanaryOverrides) => {
  try {
    localStorage.setItem(
      canaryStorage.key,
      JSON.stringify({ version: canaryStorage.version, overrides }),
    );
  } catch {
    // Feature flags fall back to their in-memory values for this tab.
  }
};
