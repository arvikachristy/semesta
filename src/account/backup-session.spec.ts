import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountryList } from '../types/country';
import { accountConfig, BackupStatus } from './account-config';
import { createBackupSession } from './backup-session';
import { BackupConflict } from './cloud-workspace';
import { emptyWorkspace } from './workspace';

const setup = (dirty = false) => {
  const cloud = { load: vi.fn(), save: vi.fn(async () => 2) };
  const persist = vi.fn();
  const onStatus = vi.fn();
  const session = createBackupSession({
    record: { version: accountConfig.version, revision: 1, dirty, workspace: emptyWorkspace() },
    cloud,
    persist,
    onStatus,
  });
  return { cloud, persist, onStatus, session };
};
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
describe('ordered account backup', () => {
  it('never uploads a hydrated workspace until it is edited', async () => {
    const { session, cloud } = setup();
    session.start();
    await session.countries.save(await session.countries.load());
    await session.trips.save(await session.trips.load());
    await vi.advanceTimersByTimeAsync(accountConfig.saveDelay);
    expect(cloud.save).not.toHaveBeenCalled();
    session.dispose();
  });
  it('saves locally immediately, coalesces edits, and acknowledges only the server response', async () => {
    const { session, cloud, persist, onStatus } = setup();
    await session.countries.save([CountryList.France]);
    await session.countries.save([]);
    expect(persist).toHaveBeenLastCalledWith(
      expect.objectContaining({ dirty: true, workspace: { countries: [], trips: [] } }),
    );
    expect(onStatus).toHaveBeenLastCalledWith(BackupStatus.Pending);
    await vi.advanceTimersByTimeAsync(accountConfig.saveDelay);
    expect(cloud.save).toHaveBeenCalledExactlyOnceWith({ countries: [], trips: [] }, 1);
    expect(onStatus).toHaveBeenLastCalledWith(BackupStatus.Saved);
    session.dispose();
  });
  it('keeps edits made while a request is in flight and sends them with the new revision', async () => {
    const { session, cloud, persist } = setup();
    let acknowledge: (revision: number) => void = () => {};
    cloud.save.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          acknowledge = resolve;
        }),
    );
    await session.countries.save([CountryList.France]);
    const first = session.flush();
    await session.countries.save([]);
    acknowledge(2);
    await first;
    expect(persist).toHaveBeenLastCalledWith(expect.objectContaining({ revision: 2, dirty: true }));
    await vi.advanceTimersByTimeAsync(accountConfig.saveDelay);
    expect(cloud.save).toHaveBeenLastCalledWith({ countries: [], trips: [] }, 2);
    session.dispose();
  });
  it('retains an offline edit and retries without dropping intentional empty selections', async () => {
    const { session, cloud, onStatus } = setup();
    cloud.save.mockRejectedValueOnce(new Error('offline'));
    await session.countries.save([]);
    await session.flush();
    expect(onStatus).toHaveBeenLastCalledWith(BackupStatus.Pending);
    await vi.advanceTimersByTimeAsync(accountConfig.retryDelay);
    expect(cloud.save).toHaveBeenLastCalledWith({ countries: [], trips: [] }, 1);
    expect(onStatus).toHaveBeenLastCalledWith(BackupStatus.Saved);
    session.dispose();
  });
  it('stops automatic writes on revision conflicts instead of overwriting another device', async () => {
    const { session, cloud, onStatus } = setup();
    cloud.save.mockRejectedValue(new BackupConflict());
    await session.countries.save([]);
    await session.flush();
    await session.countries.save([CountryList.France]);
    await vi.advanceTimersByTimeAsync(accountConfig.retryDelay * 2);
    await session.flush();
    expect(cloud.save).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenLastCalledWith(BackupStatus.Conflict);
    session.dispose();
  });
  it('ignores delayed responses and obsolete repository writes after sign-out', async () => {
    const { session, cloud, persist, onStatus } = setup();
    let acknowledge: (revision: number) => void = () => {};
    cloud.save.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          acknowledge = resolve;
        }),
    );
    await session.countries.save([]);
    const saving = session.flush();
    session.dispose();
    persist.mockClear();
    onStatus.mockClear();
    acknowledge(2);
    await saving;
    await session.countries.save([CountryList.France]);
    expect(persist).not.toHaveBeenCalled();
    expect(onStatus).not.toHaveBeenCalled();
  });
  it('reports blocked device storage while continuing the cloud backup', async () => {
    const { session, persist, onStatus } = setup();
    persist.mockImplementation(() => {
      throw new Error('quota');
    });
    await session.countries.save([]);
    expect(onStatus).toHaveBeenLastCalledWith(BackupStatus.StorageError);
    await session.flush();
    expect(onStatus).toHaveBeenLastCalledWith(BackupStatus.Saved);
    session.dispose();
  });
});
