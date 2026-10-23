import { CanaryIDs } from './canary-registry';
import type { CanaryID } from './canary-registry';

export const canaryStorage = {
  key: 'semesta.canary.v1',
  sessionKey: 'semesta.devmode',
  version: 1,
} as const;

export type TCanaryOverrides = Partial<Record<CanaryID, boolean>>;

export const readDevMode = () => {
  const query = new URLSearchParams(window.location.search).get('devmode');
  if (query !== null) {
    return query === 'true';
  }
  try {
    return sessionStorage.getItem(canaryStorage.sessionKey) === 'true';
  } catch {
    return false;
  }
};

export const saveDevMode = (enabled: boolean) => {
  try {
    if (enabled) {
      sessionStorage.setItem(canaryStorage.sessionKey, 'true');
    } else {
      sessionStorage.removeItem(canaryStorage.sessionKey);
    }
  } catch {
    // Feature visibility remains safe even when storage is unavailable.
  }
};

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
