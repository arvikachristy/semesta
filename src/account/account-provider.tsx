import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AccountContext, guestRepositories } from './account-context';
import type { IAccountContext } from './account-context';
import { accountClient } from './client';
import { accountConfig, BackupStatus } from './account-config';
import { accountCache } from './device-storage';
import { createCloudWorkspace } from './cloud-workspace';
import { createBackupSession } from './backup-session';
import type { TBackupSession } from './backup-session';
import { emptyWorkspace, mergeWorkspaces } from './workspace';
import type { IWorkspaceRecord } from './workspace';

const loadGuest = async () => ({
  countries: await guestRepositories.countries.load(),
  wishlistCountryIds: await guestRepositories.wishlist.load(),
  trips: await guestRepositories.trips.load(),
});

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<IAccountContext>({
    configured: Boolean(accountClient),
    userId: accountConfig.guestId,
    email: null,
    status: BackupStatus.Local,
    ...guestRepositories,
    hasTrips: false,
  });
  const backup = useRef<TBackupSession | null>(null);
  useEffect(() => {
    const client = accountClient;
    let active = true;
    let generation = 0;
    let currentUser: string | null | undefined;
    const showGuest = () => {
      const trips = {
        load: async () => {
          const result = await guestRepositories.trips.load();
          if (active && !currentUser) {
            setState((current) => ({ ...current, hasTrips: result.length > 0 }));
          }
          return result;
        },
        save: async (value: Parameters<typeof guestRepositories.trips.save>[0]) => {
          await guestRepositories.trips.save(value);
          if (active && !currentUser) {
            setState((current) => ({ ...current, hasTrips: value.length > 0 }));
          }
        },
      };
      setState({
        configured: Boolean(client),
        userId: accountConfig.guestId,
        email: null,
        status: BackupStatus.Local,
        countries: guestRepositories.countries,
        wishlist: guestRepositories.wishlist,
        trips,
        hasTrips: false,
      });
    };
    const openAccount = async (id: string | null, email: string | null, discardLocal = false) => {
      currentUser = id;
      const request = ++generation;
      backup.current?.dispose();
      backup.current = null;
      if (!id || !client) {
        showGuest();
        return;
      }
      const signOut = async () => {
        const { error } = await client.auth.signOut({ scope: accountConfig.signOutScope });
        if (error) {
          throw error;
        }
        try {
          accountCache.remove(id);
        } catch {
          /* Session is still signed out. */
        }
      };
      const valid = () => active && request === generation;
      // Freeze edits during account hydration, without remounting the Three.js scene.
      const blocked = { load: (): Promise<never> => new Promise(() => {}), save: async () => {} };
      setState({
        configured: true,
        userId: id,
        email,
        status: BackupStatus.Loading,
        signOut,
        countries: blocked,
        wishlist: blocked,
        trips: blocked,
        hasTrips: false,
      });
      const cloud = createCloudWorkspace(client, id);
      let cached: IWorkspaceRecord | null = null;
      try {
        cached = accountCache.read(id);
      } catch {
        /* Cloud can recover a damaged cache. */
      }
      try {
        let remote;
        try {
          remote = await cloud.load();
        } catch (error) {
          if (!cached || discardLocal) {
            throw error;
          }
          remote = undefined;
        }
        if (!valid()) {
          return;
        }
        const conflict = Boolean(
          !discardLocal && cached?.dirty && remote && cached.revision !== remote.revision,
        );
        let record: IWorkspaceRecord;
        if (cached && !discardLocal && (cached.dirty || remote === undefined)) {
          record = { ...cached, dirty: true };
        } else if (remote) {
          record = {
            version: accountConfig.version,
            workspace: remote.workspace,
            revision: remote.revision,
            dirty: false,
          };
        } else {
          record = {
            version: accountConfig.version,
            workspace: discardLocal ? emptyWorkspace() : await loadGuest(),
            revision: 0,
            dirty: true,
          };
        }
        if (!valid()) {
          return;
        }
        const session = createBackupSession({
          record,
          cloud,
          conflict,
          persist: (value) => accountCache.write(id, value),
          onStatus: (status) => {
            if (valid()) {
              setState((current) => ({ ...current, status }));
            }
          },
        });
        backup.current = session;
        setState({
          configured: true,
          userId: id,
          email,
          status: BackupStatus.Loading,
          countries: session.countries,
          wishlist: session.wishlist,
          trips: session.trips,
          hasTrips: record.workspace.trips.length > 0,
          retry: session.flush,
          reloadCloud: () => openAccount(id, email, true),
          importGuest: async () => {
            const guest = await loadGuest();
            if (!valid()) {
              return;
            }
            session.update(mergeWorkspaces(session.snapshot(), guest));
            // Refresh repository identities so both existing hooks hydrate the imported data.
            setState((current) => ({
              ...current,
              countries: { ...session.countries },
              wishlist: { ...session.wishlist },
              trips: { ...session.trips },
            }));
          },
          signOut,
          deleteAccount: async () => {
            const { error } = await client.rpc(accountConfig.deleteFunction);
            if (error) {
              throw error;
            }
            try {
              accountCache.remove(id);
            } catch {
              /* Remote deletion succeeded. */
            }
            await client.auth.signOut({ scope: accountConfig.signOutScope });
            if (valid()) {
              await openAccount(null, null);
            }
          },
        });
        session.start();
      } catch {
        if (valid()) {
          setState((current) => ({
            ...current,
            status: BackupStatus.Unavailable,
            retry: () => openAccount(id, email),
            signOut,
          }));
        }
      }
    };
    if (!client) {
      showGuest();
      return () => {
        active = false;
      };
    }
    // Keep Supabase calls out of the auth callback to avoid its session lock.
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      if (id !== currentUser) {
        currentUser = id;
        queueMicrotask(() => {
          if (active) {
            void openAccount(id, session?.user.email ?? null);
          }
        });
      }
    });
    const retry = () => {
      void backup.current?.flush();
    };
    window.addEventListener(accountConfig.events.online, retry);
    return () => {
      active = false;
      generation += 1;
      data.subscription.unsubscribe();
      backup.current?.dispose();
      window.removeEventListener(accountConfig.events.online, retry);
    };
  }, []);
  return <AccountContext value={state}>{children}</AccountContext>;
};
