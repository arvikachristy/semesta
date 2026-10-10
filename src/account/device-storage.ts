import { accountConfig } from './account-config';
import { decodeWorkspaceRecord } from './workspace';
import type { IWorkspaceRecord } from './workspace';

export const accountCache = {
  read: (userId: string): IWorkspaceRecord | null => {
    const raw = localStorage.getItem(`${accountConfig.cachePrefix}${userId}`);
    return raw ? decodeWorkspaceRecord(JSON.parse(raw)) : null;
  },
  write: (userId: string, value: IWorkspaceRecord) => {
    localStorage.setItem(`${accountConfig.cachePrefix}${userId}`, JSON.stringify(value));
  },
  remove: (userId: string) => localStorage.removeItem(`${accountConfig.cachePrefix}${userId}`),
};
export const backupInvitation = {
  isDismissed: () => {
    try {
      return localStorage.getItem(accountConfig.dismissedKey) === 'true';
    } catch {
      return false;
    }
  },
  dismiss: () => {
    try {
      localStorage.setItem(accountConfig.dismissedKey, 'true');
    } catch {
      /* Dismissal still applies for this session. */
    }
  },
};
