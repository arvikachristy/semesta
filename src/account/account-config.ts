export const accountConfig = {
  table: 'workspaces',
  saveFunction: 'save_workspace',
  deleteFunction: 'delete_own_account',
  cachePrefix: 'semesta.account.',
  dismissedKey: 'semesta.backup-invitation-dismissed',
  version: 1,
  saveDelay: 600,
  requestTimeout: 15_000,
  signOutScope: 'local',
  retryDelay: 30_000,
  errorCodes: { revisionConflict: 'PT409', legacyRevisionConflict: '40001' },
  resendSeconds: 60,
  guestId: 'guest',
  events: { online: 'online' },
  provider: { google: 'google', email: 'email' },
} as const;

export const BackupStatus = {
  Local: 'Saved on this device',
  Loading: 'Opening your backup…',
  Pending: 'Saved locally · backup pending',
  Saving: 'Backing up…',
  Saved: 'Backed up',
  Conflict: 'A newer backup exists. Your local changes are kept.',
  Unavailable: 'Backup unavailable. Your device data is unchanged.',
  StorageError: 'Device storage unavailable. Keep this tab open until backed up.',
} as const;
export type TBackupStatus = (typeof BackupStatus)[keyof typeof BackupStatus];
