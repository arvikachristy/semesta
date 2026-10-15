import type { ICountrySelectionRepository } from '../storage/country-selection';
import type { ITripRepository } from '../storage/trips';
import { accountConfig, BackupStatus } from './account-config';
import type { TBackupStatus } from './account-config';
import { BackupConflict } from './cloud-workspace';
import type { ICloudWorkspace } from './cloud-workspace';
import type { IWorkspace, IWorkspaceRecord } from './workspace';

interface IBackupSessionOptions {
  record: IWorkspaceRecord;
  cloud: ICloudWorkspace;
  persist: (record: IWorkspaceRecord) => void;
  onStatus: (status: TBackupStatus) => void;
  conflict?: boolean;
}

// One account, one ordered writer. Hydration never writes; only edits/imports do.
export const createBackupSession = ({
  record: initial,
  cloud,
  persist,
  onStatus,
  conflict = false,
}: IBackupSessionOptions) => {
  let record = initial;
  let active = true;
  let saving = false;
  let blocked = conflict;
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cache = () => {
    try {
      persist(record);
      return true;
    } catch {
      onStatus(BackupStatus.StorageError);
      return false;
    }
  };
  const schedule = (delay: number) => {
    clearTimeout(timer);
    if (active && !blocked) {
      timer = setTimeout(() => {
        void flush();
      }, delay);
    }
  };
  const flush = async () => {
    if (!active || saving || blocked || !record.dirty) {
      return;
    }
    saving = true;
    const sentGeneration = generation;
    const sent = record;
    onStatus(BackupStatus.Saving);
    try {
      const revision = await cloud.save(sent.workspace, sent.revision);
      if (!active) {
        return;
      }
      record = { ...record, revision, dirty: generation !== sentGeneration };
      const durable = cache();
      onStatus(
        record.dirty
          ? durable
            ? BackupStatus.Pending
            : BackupStatus.StorageError
          : BackupStatus.Saved,
      );
      if (record.dirty) {
        schedule(accountConfig.saveDelay);
      }
    } catch (error) {
      if (!active) {
        return;
      }
      blocked = error instanceof BackupConflict;
      onStatus(blocked ? BackupStatus.Conflict : BackupStatus.Pending);
      if (!blocked) {
        schedule(accountConfig.retryDelay);
      }
    } finally {
      saving = false;
    }
  };
  const update = (workspace: IWorkspace) => {
    if (!active) {
      return;
    }
    if (JSON.stringify(workspace) === JSON.stringify(record.workspace)) {
      return;
    }
    record = { ...record, workspace, dirty: true };
    generation += 1;
    const durable = cache();
    onStatus(
      blocked ? BackupStatus.Conflict : durable ? BackupStatus.Pending : BackupStatus.StorageError,
    );
    schedule(accountConfig.saveDelay);
  };
  const countries: ICountrySelectionRepository = {
    load: async () => [...record.workspace.countries],
    save: async (countries) => update({ ...record.workspace, countries: [...countries] }),
  };
  const trips: ITripRepository = {
    load: async () => [...record.workspace.trips],
    save: async (trips) => update({ ...record.workspace, trips: [...trips] }),
  };
  const wishlist: ICountrySelectionRepository = {
    load: async () => [...(record.workspace.wishlistCountryIds ?? [])],
    save: async (ids) => update({ ...record.workspace, wishlistCountryIds: [...ids] }),
  };
  return {
    wishlist,
    countries,
    trips,
    flush,
    update,
    snapshot: () => record.workspace,
    start: () => {
      const durable = cache();
      onStatus(
        blocked
          ? BackupStatus.Conflict
          : record.dirty
            ? durable
              ? BackupStatus.Pending
              : BackupStatus.StorageError
            : BackupStatus.Saved,
      );
      if (record.dirty) {
        schedule(accountConfig.saveDelay);
      }
    },
    dispose: () => {
      active = false;
      clearTimeout(timer);
    },
  };
};
export type TBackupSession = ReturnType<typeof createBackupSession>;
