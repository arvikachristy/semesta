import type { SupabaseClient } from '@supabase/supabase-js';
import { accountConfig } from './account-config';
import { decodeWorkspaceRecord } from './workspace';
import type { IWorkspace } from './workspace';

export class BackupConflict extends Error {}
export interface ICloudWorkspace {
  load: () => Promise<{ workspace: IWorkspace; revision: number } | null>;
  save: (workspace: IWorkspace, revision: number) => Promise<number>;
}
export const createCloudWorkspace = (client: SupabaseClient, userId: string): ICloudWorkspace => ({
  load: async () => {
    const { data, error } = await client
      .from(accountConfig.table)
      .select('payload, revision')
      .eq('user_id', userId)
      .abortSignal(AbortSignal.timeout(accountConfig.requestTimeout))
      .maybeSingle();
    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }
    const record = decodeWorkspaceRecord({
      version: accountConfig.version,
      workspace: data.payload,
      revision: data.revision,
      dirty: false,
    });
    return { workspace: record.workspace, revision: record.revision };
  },
  save: async (workspace, revision) => {
    const { data, error } = await client
      .rpc(accountConfig.saveFunction, {
        expected_revision: revision,
        next_payload: workspace,
      })
      .abortSignal(AbortSignal.timeout(accountConfig.requestTimeout));
    if (
      error?.code === accountConfig.errorCodes.revisionConflict ||
      error?.code === accountConfig.errorCodes.legacyRevisionConflict
    ) {
      throw new BackupConflict();
    }
    if (error) {
      throw error;
    }
    if (typeof data !== 'number') {
      throw new Error('Invalid backup response');
    }
    return data;
  },
});
