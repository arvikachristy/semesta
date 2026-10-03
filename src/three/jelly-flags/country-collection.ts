import { countries, countryIds } from '../../data/countries';
import type { CountryList } from '../../types/country';
import type { TContinentId } from '../../types/continent';
import type { createGlassSet } from '../glasses/glass-set';
import { glassDimensions, glassParameters } from '../glasses/glass-parameters';
import { createFlagBlock } from './flag-block';
import { createJellyPile, pileParameters } from './jelly-pile';
import { jellyParameters } from './jelly-parameters';
import { CountryStatus } from '../../types/country-status';

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
  const piles = new Map<TContinentId, ReturnType<typeof createJellyPile>>();
  const nextDrop = new Map<TContinentId, number>();
  // Stable array shared with pointer handling; reconciliation changes its contents in place.
  const blocks: ReturnType<typeof createFlagBlock>[] = [];
  let elapsed = 0;
  let disposed = false;
  const remove = (country: CountryList) => {
    const entry = entries.get(country);
    if (!entry) {
      return;
    }
    entries.delete(country);
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
      if (count >= glassParameters.capacity) {
        throw new Error('Continent country limit exceeded');
      }
      if (entries.has(country)) {
        continue;
      }
      const block = createBlock({
        scale: glassParameters.jellyScale,
        container: {
          radius: glassDimensions.interiorDiameter / 2 - pileParameters.wallClearance,
          floor: glassParameters.baseThickness,
          ceiling:
            glassParameters.baseThickness +
            glassDimensions.interiorHeight -
            glassDimensions.topBuffer,
        },
      });
      block.object.name = country;
      const angle = countryIds.indexOf(country) * 2.3999632297;
      block.object.position.set(
        Math.sin(angle) * 0.22,
        glassParameters.baseThickness +
          glassDimensions.interiorHeight -
          glassDimensions.topBuffer -
          (jellyParameters.surface.height * glassParameters.jellyScale) / 2 -
          0.02,
        Math.cos(angle) * 0.22,
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
      entry.ready = block
        .setCountry(country)
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
    elapsed += delta;
    entries.forEach((entry, country) => {
      if (entry.inserted || elapsed < entry.readyAt) {
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
      parent.add(entry.block.object);
      blocks.push(entry.block);
      entry.inserted = true;
      onStatus?.(country, CountryStatus.Ready);
    });
    piles.forEach((pile) => pile.update(delta));
    blocks.forEach((block) => block.syncSurface());
  };
  return {
    blocks,
    setCountries,
    update,
    dispose: () => {
      disposed = true;
      for (const country of entries.keys()) {
        remove(country);
      }
      piles.forEach((pile) => pile.dispose());
      piles.clear();
      nextDrop.clear();
    },
  };
};
