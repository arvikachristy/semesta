import { countries, countryIds } from '../../data/countries';
import type { CountryList } from '../../types/country';
import { ContinentId } from '../../types/continent';
import { oceaniaCoupe, coupeWallAt } from '../glasses/oceania-coupe';
import type { TContinentId } from '../../types/continent';
import type { createGlassSet } from '../glasses/glass-set';
import { glassDimensions, glassParameters } from '../glasses/glass-parameters';
import { createFlagBlock } from './flag-block';
import { createJellyPile, pileParameters } from './jelly-pile';
import { jellyParameters } from './jelly-parameters';
import { CountryStatus } from '../../types/country-status';
import { createLoadQueue } from './load-queue';
import { jellyPerformance } from './jelly-performance';
import { createJellyBatches } from './jelly-batches';

interface IEntry {
  block: ReturnType<typeof createFlagBlock>;
  continent: TContinentId;
  readyAt: number;
  inserted: boolean;
  ready: Promise<void>;
}
interface ICollectionOptions {
  glasses: ReturnType<typeof createGlassSet>;
  onRemove?: (block: ReturnType<typeof createFlagBlock>) => void;
  onStatus?: (country: CountryList, status: CountryStatus) => void;
  createBlock?: typeof createFlagBlock;
}

export const createCountryCollection = ({
  glasses,
  onRemove,
  onStatus,
  createBlock = createFlagBlock,
}: ICollectionOptions) => {
  const entries = new Map<CountryList, IEntry>();
  const loadQueue = createLoadQueue(jellyPerformance.concurrentLoads);
  const batches = createJellyBatches();
  const piles = new Map<TContinentId, ReturnType<typeof createJellyPile>>();
  const nextDrop = new Map<TContinentId, number>();
  const lastInsertion = new Map<TContinentId, number>();
  // Stable array shared with pointer handling; reconciliation changes its contents in place.
  const blocks: ReturnType<typeof createFlagBlock>[] = [];
  let elapsed = 0;
  let lastDropTime = 0;
  let disposed = false;
  let membershipChanged = false;
  const remove = (country: CountryList) => {
    const entry = entries.get(country);
    if (!entry) {
      return;
    }
    entries.delete(country);
    membershipChanged = true;
    onRemove?.(entry.block);
    const body = entry.block.getBody();
    if (body) {
      piles.get(entry.continent)?.remove(body);
    }
    const index = blocks.indexOf(entry.block);
    if (index >= 0) {
      blocks.splice(index, 1);
    }
    entry.block.object.removeFromParent();
    entry.block.dispose();
    if (![...entries.values()].some((remaining) => remaining.continent === entry.continent)) {
      nextDrop.delete(entry.continent);
      lastInsertion.delete(entry.continent);
    }
  };
  const setCountries = async (selected: readonly CountryList[]) => {
    if (disposed) {
      return;
    }
    const wanted = new Set(selected);
    for (const country of entries.keys()) {
      if (!wanted.has(country)) {
        remove(country);
      }
    }
    const counts = new Map<TContinentId, number>();
    for (const country of countryIds.filter((id) => wanted.has(id))) {
      const continent = countries[country].continent;
      const count = counts.get(continent) ?? 0;
      counts.set(continent, count + 1);
      const isCoupe = continent === ContinentId.Oceania;
      const floor = isCoupe ? oceaniaCoupe.floor : glassParameters.baseThickness;
      const ceiling = isCoupe
        ? oceaniaCoupe.ceiling
        : glassParameters.baseThickness +
          glassDimensions.interiorHeight -
          glassDimensions.topBuffer;
      const innerRadius = isCoupe
        ? coupeWallAt(ceiling - jellyParameters.surface.height * glassParameters.jellyScale).radius
        : glassDimensions.interiorDiameter / 2;
      if (count >= (isCoupe ? oceaniaCoupe.capacity : glassParameters.capacity)) {
        throw new Error('Continent country limit exceeded');
      }
      if (entries.has(country)) {
        continue;
      }
      const block = createBlock({
        scale: glassParameters.jellyScale,
        container: {
          radius: innerRadius - pileParameters.wallClearance,
          floor,
          ceiling,
          ...(isCoupe
            ? {
                wallAt: (height: number) => {
                  const wall = coupeWallAt(height);
                  return {
                    radius: Math.max(0, wall.radius - pileParameters.wallClearance),
                    slope: wall.slope,
                  };
                },
              }
            : {}),
        },
      });
      block.object.name = country;
      const angle = count * pileParameters.dropAngle;
      const radius =
        Math.max(
          0,
          innerRadius -
            (Math.hypot(jellyParameters.surface.width, jellyParameters.surface.depth) *
              glassParameters.jellyScale) /
              2 -
            pileParameters.wallClearance,
        ) * Math.sqrt((count * pileParameters.dropRadiusStep) % 1);
      block.object.position.set(
        Math.sin(angle) * radius,
        ceiling - (jellyParameters.surface.height * glassParameters.jellyScale) / 2 - 0.02,
        Math.cos(angle) * radius,
      );
      const entry: IEntry = {
        block,
        continent,
        inserted: false,
        readyAt: Infinity,
        ready: Promise.resolve(),
      };
      entries.set(country, entry);
      onStatus?.(country, CountryStatus.Loading);
      entry.ready = loadQueue
        .run(async () => {
          if (!disposed && entries.get(country) === entry) {
            await block.setCountry(country);
          }
        })
        .then(() => {
          if (disposed || entries.get(country) !== entry) {
            return;
          }
          entry.readyAt = Math.max(elapsed, nextDrop.get(continent) ?? elapsed);
          nextDrop.set(continent, entry.readyAt + pileParameters.dropInterval);
        })
        .catch(() => {
          if (disposed || entries.get(country) !== entry) {
            return;
          }
          remove(country);
          onStatus?.(country, CountryStatus.Error);
        });
    }
    await Promise.all([...entries.values()].map((entry) => entry.ready));
  };
  const update = (delta: number) => {
    let changed = membershipChanged;
    membershipChanged = false;
    elapsed += delta;
    let awake = 0;
    piles.forEach((pile) => {
      awake += pile.getAwakeCount();
    });
    entries.forEach((entry, country) => {
      if (entry.inserted || elapsed < entry.readyAt) {
        return;
      }
      if (
        awake >= jellyPerformance.maxAwakeAcrossGlasses &&
        elapsed - lastDropTime < jellyPerformance.maxDropPause
      ) {
        return;
      }
      if (
        (piles.get(entry.continent)?.getAwakeCount() ?? 0) >= jellyPerformance.maxAwakeBeforeDrop &&
        elapsed - (lastInsertion.get(entry.continent) ?? 0) < jellyPerformance.maxDropPause
      ) {
        return;
      }
      const body = entry.block.getBody();
      const parent = glasses.containers.get(entry.continent);
      if (!body || !parent) {
        return;
      }
      let pile = piles.get(entry.continent);
      if (!pile) {
        pile = createJellyPile();
        piles.set(entry.continent, pile);
      }
      pile.add(body);
      awake++;
      lastDropTime = elapsed;
      parent.add(entry.block.object);
      blocks.push(entry.block);
      entry.inserted = true;
      lastInsertion.set(entry.continent, elapsed);
      changed = true;
      onStatus?.(country, CountryStatus.Ready);
    });
    piles.forEach((pile) => pile.update(delta));
    blocks.forEach((block) => {
      changed = block.syncSurface() || changed;
    });
    batches.update(blocks);
    return changed;
  };
  return {
    blocks,
    setCountries,
    update,
    dispose: () => {
      disposed = true;
      loadQueue.dispose();
      batches.dispose();
      for (const country of entries.keys()) {
        remove(country);
      }
      piles.forEach((pile) => pile.dispose());
      piles.clear();
      nextDrop.clear();
      lastInsertion.clear();
    },
  };
};
