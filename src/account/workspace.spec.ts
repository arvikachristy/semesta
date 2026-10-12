import { describe, expect, it } from 'vitest';
import { CountryList } from '../types/country';
import { emptyTripDetails } from '../types/trip';
import { decodeWorkspaceRecord, emptyWorkspace, mergeWorkspaces } from './workspace';
import { accountConfig } from './account-config';

const trip = { ...emptyTripDetails, id: 'trip-1', name: 'Lisbon' };
describe('account workspace migration', () => {
  it('validates participant data in cloud backups without requiring it on old trips', () => {
    const record = {
      version: accountConfig.version,
      revision: 1,
      dirty: false,
      workspace: {
        countries: [],
        trips: [{ ...trip, participants: [{ id: 'person', name: 'Taylor' }] }],
      },
    };
    expect(decodeWorkspaceRecord(JSON.parse(JSON.stringify(record)))).toEqual(record);
    expect(() =>
      decodeWorkspaceRecord({
        ...record,
        workspace: {
          countries: [],
          trips: [
            { ...trip, participants: [{ id: 'person', name: 'Taylor', avatarUrl: 'data:unsafe' }] },
          ],
        },
      }),
    ).toThrow();
  });
  it('normalizes legacy planning and validates enriched cloud backups with inactive items preserved', () => {
    const legacyItem = {
      id: 'train',
      category: 'transportation',
      name: 'Train',
      details: 'Night train',
      completed: true,
    };
    const record = {
      version: accountConfig.version,
      revision: 2,
      dirty: false,
      workspace: {
        countries: [],
        trips: [{ ...trip, planning: [legacyItem], activePlanningCategories: [] }],
      },
    };
    const decoded = decodeWorkspaceRecord(record);
    expect(decoded.workspace.trips[0].planning).toEqual([{ ...legacyItem, status: 'booked' }]);
    expect(decoded.workspace.trips[0].activePlanningCategories).toEqual([]);
    expect(decodeWorkspaceRecord(JSON.parse(JSON.stringify(decoded)))).toEqual(decoded);
    for (const invalid of [
      { status: 'bad' },
      { link: 'data:text/html,unsafe' },
      { dateTime: 'bad' },
    ]) {
      expect(() =>
        decodeWorkspaceRecord({
          ...record,
          workspace: {
            countries: [],
            trips: [{ ...trip, planning: [{ ...legacyItem, ...invalid }] }],
          },
        }),
      ).toThrow();
    }
    expect(() =>
      decodeWorkspaceRecord({
        ...record,
        workspace: { countries: [], trips: [{ ...trip, activePlanningCategories: ['flights'] }] },
      }),
    ).toThrow();
  });
  it('imports guest data idempotently and preserves account edits on matching trip IDs', () => {
    const account = { countries: [CountryList.France], trips: [trip] };
    const guest = {
      countries: [CountryList.Indonesia],
      trips: [
        { ...trip, name: 'Old Lisbon' },
        { ...trip, id: 'trip-2' },
      ],
    };
    const result = mergeWorkspaces(account, guest);
    expect(result.countries).toEqual(
      expect.arrayContaining([...account.countries, ...guest.countries]),
    );
    expect(result.trips).toEqual([trip, guest.trips[1]]);
    expect(mergeWorkspaces(result, guest)).toEqual(result);
  });
  it('rejects invalid versions, unknown countries and malformed trips instead of uploading partial data', () => {
    const record = {
      version: accountConfig.version,
      revision: 2,
      dirty: true,
      workspace: emptyWorkspace(),
    };
    expect(decodeWorkspaceRecord(record)).toEqual(record);
    for (const invalid of [
      null,
      { ...record, version: 999 },
      { ...record, revision: -1 },
      { ...record, workspace: { countries: ['XX'], trips: [] } },
      { ...record, workspace: { countries: [], trips: [{ id: 'bad' }] } },
    ]) {
      expect(() => decodeWorkspaceRecord(invalid)).toThrow();
    }
    expect(
      decodeWorkspaceRecord({ ...record, workspace: { countries: [], trips: [] } }).workspace
        .countries,
    ).toEqual([]);
  });
});
