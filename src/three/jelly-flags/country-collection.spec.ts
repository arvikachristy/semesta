// @vitest-environment jsdom
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createCountryCollection } from './country-collection';
import type { IFlagBlockOptions } from './flag-block';
import { createSoftBody } from './jelly-soft-body';
import { createGlassSet } from '../glasses/glass-set';
import { CountryList } from '../../types/country';
import { CountryStatus } from '../../types/country-status';
import { ContinentId } from '../../types/continent';

const setup = () => {
  const glasses = createGlassSet();
  const pending: Array<{
    resolve: () => void;
    reject: () => void;
    block: ReturnType<typeof createBlock>;
  }> = [];
  const createBlock = ({ container }: IFlagBlockOptions = {}) => {
    const object = new THREE.Group();
    const body = createSoftBody(
      0.594,
      0.396,
      0.3,
      [],
      container ? { ...container, origin: object.position } : undefined,
    );
    let resolve = () => {};
    let reject = () => {};
    const promise = new Promise<void>((done, fail) => {
      resolve = done;
      reject = () => fail(new Error('Artwork failed'));
    });
    const block = {
      object,
      setCountry: vi.fn(() => promise),
      getBody: () => body,
      setBounds: vi.fn(),
      update: vi.fn(),
      syncSurface: vi.fn(),
      dispose: vi.fn(),
      beginGrab: vi.fn(),
      moveGrab: vi.fn(),
      endGrab: vi.fn(),
    };
    pending.push({ resolve, reject, block });
    return block;
  };
  const onStatus = vi.fn();
  const onRemove = vi.fn();
  const collection = createCountryCollection({ glasses, createBlock, onStatus, onRemove });
  const dispose = () => {
    collection.dispose();
    glasses.dispose();
  };
  return { glasses, collection, pending, onStatus, onRemove, dispose };
};

describe('country collection reconciliation', () => {
  it('inserts selected countries into their continent and preserves existing bodies on additions', async () => {
    const s = setup();
    const first = s.collection.setCountries([CountryList.Indonesia]);
    s.pending[0].resolve();
    await first;
    s.collection.update(0);
    const indonesia = s.pending[0].block;
    expect(indonesia.object.parent).toBe(s.glasses.containers.get(ContinentId.Asia));
    const next = s.collection.setCountries([CountryList.Indonesia, CountryList.France]);
    s.pending[1].resolve();
    await next;
    s.collection.update(0);
    expect(s.pending).toHaveLength(2);
    expect(s.collection.blocks).toContain(indonesia);
    expect(s.pending[1].block.object.parent).toBe(s.glasses.containers.get(ContinentId.Europe));
    expect(s.onStatus).toHaveBeenCalledWith(CountryList.France, CountryStatus.Ready);
    await s.collection.setCountries([CountryList.France]);
    expect(s.onRemove).toHaveBeenCalledWith(indonesia);
    expect(indonesia.dispose).toHaveBeenCalledOnce();
    expect(indonesia.object.parent).toBeNull();
    expect(s.collection.blocks).toEqual([s.pending[1].block]);
    s.dispose();
  });
  it('ignores a stale load after uncheck and recheck of the same country', async () => {
    const s = setup();
    const old = s.collection.setCountries([CountryList.Nepal]);
    await s.collection.setCountries([]);
    const latest = s.collection.setCountries([CountryList.Nepal]);
    s.pending[0].resolve();
    await old;
    s.collection.update(0);
    expect(s.collection.blocks).toHaveLength(0);
    s.pending[1].resolve();
    await latest;
    s.collection.update(0);
    expect(s.collection.blocks).toEqual([s.pending[1].block]);
    expect(s.pending[0].block.dispose).toHaveBeenCalledOnce();
    s.dispose();
  });
  it('reports load failures and permits retry without resurrecting a disposed collection', async () => {
    const s = setup();
    const failed = s.collection.setCountries([CountryList.Kazakhstan]);
    s.pending[0].reject();
    await failed;
    expect(s.onStatus).toHaveBeenCalledWith(CountryList.Kazakhstan, CountryStatus.Error);
    const retry = s.collection.setCountries([CountryList.Kazakhstan]);
    s.dispose();
    s.pending[1].resolve();
    await retry;
    s.collection.update(0);
    expect(s.collection.blocks).toHaveLength(0);
    expect(s.pending[1].block.dispose).toHaveBeenCalledOnce();
  });
  it('staggers drops into one glass and cancels an unticked queued country', async () => {
    const s = setup();
    const ready = s.collection.setCountries([CountryList.Indonesia, CountryList.Nepal]);
    s.pending.forEach((entry) => entry.resolve());
    await ready;
    s.collection.update(0);
    expect(s.collection.blocks).toEqual([s.pending[0].block]);
    await s.collection.setCountries([CountryList.Indonesia]);
    s.collection.update(0.3);
    expect(s.collection.blocks).toEqual([s.pending[0].block]);
    expect(s.pending[1].block.dispose).toHaveBeenCalledOnce();
    s.dispose();
  });
});
