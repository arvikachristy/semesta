import { countries, countryIds } from '../../data/countries';
import type { CountryList } from '../../types/country';
import { getGlassDefinition } from '../glasses/glass-definitions';
import type { TContinentId } from '../../types/continent';
import type { createGlassSet } from '../glasses/glass-set';
import { glassParameters } from '../glasses/glass-parameters';
import { createFlagBlock } from './flag-block';
import { createJellyPile, pileParameters } from './jelly-pile';
import { jellyParameters } from './jelly-parameters';
import { CountryStatus } from '../../types/country-status';
import { createLoadQueue } from './load-queue';
import { jellyPerformance } from './jelly-performance';
import { createJellyBatches } from './jelly-batches';
import { getInitialJellyPosition } from './initial-jelly-position';

interface IEntry {
  block: ReturnType<typeof createFlagBlock>;
  continent: TContinentId;
  readyAt: number;
  inserted: boolean;
  initial: boolean;
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
  let initialSelectionPending = true;
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
  const setCountries = async (selected: readonly CountryList[], hydrate = false) => {
    if (disposed) {
      return;
    }
    const initialSelection = initialSelectionPending || hydrate;
    initialSelectionPending = false;
    if (hydrate && entries.size > 0) {
      // A new account workspace replaces the old pile. Do not wake every old
      // neighbour while clearing it, or let old positions overlap the new stack.
      piles.forEach((pile) => pile.dispose());
      piles.clear();
      for (const country of [...entries.keys()]) {
        remove(country);
      }
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
      const definition = getGlassDefinition(continent);
      const { floor, ceiling, wallAt } = definition;
      const innerRadius = wallAt
        ? wallAt(ceiling - jellyParameters.surface.height * glassParameters.jellyScale).radius
        : definition.innerRadius;
      if (count >= definition.capacity) {
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
          ...(wallAt
            ? {
                wallAt: (height: number) => {
                  const wall = wallAt(height);
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
      if (initialSelection) {
        const position = getInitialJellyPosition(count, definition);
        block.object.position.set(position.x, position.y, position.z);
      } else {
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
      }
      const entry: IEntry = {
        block,
        continent,
        inserted: false,
        initial: initialSelection,
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
          if (entry.initial) {
            entry.readyAt = elapsed;
          } else {
            entry.readyAt = Math.max(elapsed, nextDrop.get(continent) ?? elapsed);
            nextDrop.set(continent, entry.readyAt + pileParameters.dropInterval);
          }
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
        !entry.initial &&
        awake >= jellyPerformance.maxAwakeAcrossGlasses &&
        elapsed - lastDropTime < jellyPerformance.maxDropPause
      ) {
        return;
      }
      if (
        !entry.initial &&
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
      if (entry.initial) {
        body.sleep();
      }
      let pile = piles.get(entry.continent);
      if (!pile) {
        pile = createJellyPile();
        piles.set(entry.continent, pile);
      }
      pile.add(body);
      if (!entry.initial) {
        awake++;
        lastDropTime = elapsed;
        lastInsertion.set(entry.continent, elapsed);
      }
      parent.add(entry.block.object);
      blocks.push(entry.block);
      entry.inserted = true;
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
    countryForBlock: (block: ReturnType<typeof createFlagBlock>) => {
      for (const [country, entry] of entries) {
        if (entry.block === block) {
          return country;
        }
      }
      return null;
    },
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
