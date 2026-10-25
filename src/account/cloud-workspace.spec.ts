import { createClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { accountConfig, BackupStatus } from './account-config';
import { BackupConflict, createCloudWorkspace } from './cloud-workspace';
import { createBackupSession } from './backup-session';
import { emptyWorkspace } from './workspace';
import { CountryList } from '../types/country';

const createHttpCloud = (code: string) => {
  const fetch = vi.fn(
    async () =>
      new Response(
        JSON.stringify({ code, message: 'Backup revision conflict', details: null, hint: null }),
        {
          status: code === accountConfig.errorCodes.revisionConflict ? 409 : 500,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
  );
  const client = createClient('https://database.example', 'test-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch },
  });
  return { fetch, cloud: createCloudWorkspace(client, 'user-id') };
};

afterEach(() => vi.useRealTimers());

describe('workspace conflict responses', () => {
  it.each([
    accountConfig.errorCodes.revisionConflict,
    accountConfig.errorCodes.legacyRevisionConflict,
  ])('recognizes %s as a backup conflict during staged deployment', async (code) => {
    const { fetch, cloud } = createHttpCloud(code);
    await expect(cloud.save(emptyWorkspace(), 1)).rejects.toBeInstanceOf(BackupConflict);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('blocks retries and keeps local edits after an actual PT409 HTTP response', async () => {
    vi.useFakeTimers();
    const { fetch, cloud } = createHttpCloud(accountConfig.errorCodes.revisionConflict);
    const onStatus = vi.fn();
    const session = createBackupSession({
      record: {
        version: accountConfig.version,
        revision: 1,
        dirty: true,
        workspace: emptyWorkspace(),
      },
      cloud,
      persist: vi.fn(),
      onStatus,
    });
    await session.flush();
    await session.countries.save([CountryList.France]);
    await vi.advanceTimersByTimeAsync(accountConfig.retryDelay * 3);
    await session.flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenLastCalledWith(BackupStatus.Conflict);
    expect(session.snapshot()).toEqual({ ...emptyWorkspace(), countries: [CountryList.France] });
    session.dispose();
  });

  it('does not mistake unrelated server errors for revision conflicts', async () => {
    const { cloud } = createHttpCloud('42501');
    await expect(cloud.save(emptyWorkspace(), 1)).rejects.toMatchObject({ code: '42501' });
  });
});
