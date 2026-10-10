// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountProvider } from './account-provider';
import { useAccount } from './account-context';
import { useTrips } from '../hooks/use-trips';
import { useCountrySelection } from '../hooks/use-country-selection';
import { tripStorage } from '../storage/trips';
import { selectionStorage } from '../storage/country-selection';
import { emptyTripDetails } from '../types/trip';
import { CountryList } from '../types/country';
import { accountConfig, BackupStatus } from './account-config';
import { accountCache } from './device-storage';
import type { IWorkspace } from './workspace';
import type * as CloudModule from './cloud-workspace';

const auth = vi.hoisted(() => {
  interface ISession {
    user: { id: string; email: string };
  }
  let listener: (event: string, session: ISession | null) => void = () => {};
  return {
    emit: (id: string | null) =>
      listener('SIGNED_IN', id ? { user: { id, email: `${id}@example.com` } } : null),
    onAuthStateChange: vi.fn((next: typeof listener) => {
      listener = next;
      queueMicrotask(() => listener('INITIAL_SESSION', null));
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    signOut: vi.fn(async () => {
      listener('SIGNED_OUT', null);
      return { error: null };
    }),
  };
});
const cloud = vi.hoisted(() => ({
  load: vi.fn<() => Promise<{ workspace: IWorkspace; revision: number } | null>>(),
  save: vi.fn(async () => 2),
}));
vi.mock('./client', () => ({ accountClient: { auth, rpc: vi.fn(async () => ({ error: null })) } }));
vi.mock('./cloud-workspace', async (original) => ({
  ...(await original<typeof CloudModule>()),
  createCloudWorkspace: () => cloud,
}));
const guestTrip = { ...emptyTripDetails, id: 'guest-trip', name: 'Local trip' };
const cloudTrip = { ...emptyTripDetails, id: 'cloud-trip', name: 'Cloud trip' };
const remote = { workspace: { countries: [CountryList.France], trips: [cloudTrip] }, revision: 4 };
let current: ReturnType<typeof useAccount>;
const Probe = () => {
  current = useAccount();
  const trips = useTrips(current.trips);
  const countries = useCountrySelection(current.countries);
  return (
    <div data-ready={trips.ready && countries.ready}>
      {JSON.stringify({ trips: trips.trips, countries: countries.showedCountries })}
    </div>
  );
};
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  localStorage.clear();
  localStorage.setItem(tripStorage.key, JSON.stringify({ version: 1, trips: [guestTrip] }));
  localStorage.setItem(
    selectionStorage.key,
    JSON.stringify({ version: 1, selectedCountryIds: [CountryList.Indonesia] }),
  );
  cloud.load.mockResolvedValue(remote);
  cloud.save.mockClear();
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const mount = async () => {
  await act(async () => {
    root.render(
      <AccountProvider>
        <Probe />
      </AccountProvider>,
    );
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
};
const login = async (id = 'user-1') => {
  await act(async () => {
    auth.emit(id);
    await vi.advanceTimersByTimeAsync(0);
  });
};
describe('account lifecycle', () => {
  it('restores cloud data without uploading guest data, and sign-out restores the separate guest workspace', async () => {
    await mount();
    expect(host.textContent).toContain(guestTrip.name);
    await login();
    expect(host.textContent).toContain(cloudTrip.name);
    expect(host.textContent).not.toContain(guestTrip.name);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(accountConfig.saveDelay);
    });
    expect(cloud.save).not.toHaveBeenCalled();
    expect(current.status).toBe(BackupStatus.Saved);
    await act(async () => {
      await current.signOut?.();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(host.textContent).toContain(guestTrip.name);
    expect(host.textContent).not.toContain(cloudTrip.name);
    expect(accountCache.read('user-1')).toBeNull();
  });
  it('migrates a new account once and keeps its guest copy intact', async () => {
    cloud.load.mockResolvedValue(null);
    await mount();
    await login();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(accountConfig.saveDelay);
    });
    expect(cloud.save).toHaveBeenCalledExactlyOnceWith(
      { countries: [CountryList.Indonesia], trips: [guestTrip] },
      0,
    );
    expect(JSON.parse(localStorage.getItem(tripStorage.key) ?? '{}').trips).toEqual([guestTrip]);
  });
  it('imports existing guest plans only when requested and without duplicate trips', async () => {
    await mount();
    await login();
    await act(async () => {
      await current.importGuest?.();
    });
    await act(async () => {
      await current.importGuest?.();
    });
    expect(host.textContent).toContain(cloudTrip.name);
    expect(host.textContent).toContain(guestTrip.name);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(accountConfig.saveDelay);
    });
    expect(cloud.save).toHaveBeenCalledTimes(1);
    expect(cloud.save.mock.calls[0]).toEqual([
      {
        countries: expect.arrayContaining([CountryList.France, CountryList.Indonesia]),
        trips: [cloudTrip, guestTrip],
      },
      4,
    ]);
  });
  it('keeps a cached pending edit when offline and blocks stale writes when a newer revision exists', async () => {
    accountCache.write('user-1', {
      version: 1,
      revision: 2,
      dirty: true,
      workspace: { countries: [], trips: [guestTrip] },
    });
    await mount();
    await login();
    expect(current.status).toBe(BackupStatus.Conflict);
    expect(host.textContent).toContain(guestTrip.name);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(accountConfig.saveDelay);
    });
    expect(cloud.save).not.toHaveBeenCalled();
    await act(async () => {
      await current.reloadCloud?.();
    });
    expect(host.textContent).toContain(cloudTrip.name);
    expect(current.status).toBe(BackupStatus.Saved);
  });
  it('does not expose a failed account load as an empty writable workspace', async () => {
    cloud.load.mockRejectedValue(new Error('offline'));
    await mount();
    await login();
    expect(current.status).toBe(BackupStatus.Unavailable);
    expect(host.querySelector('[data-ready]')?.getAttribute('data-ready')).toBe('false');
    expect(cloud.save).not.toHaveBeenCalled();
    expect(current.signOut).toBeDefined();
  });
});
