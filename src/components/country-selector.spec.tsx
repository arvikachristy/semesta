// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountrySelector } from './country-selector';
import { countries, defaultCountries, toggleCountry } from '../data/countries';
import { CountryList } from '../types/country';
import { initialCountryBrowser } from './shared/country-picker/country-browser-state';
const onPlan = vi.fn();
interface ICountrySelectorHarnessProps {
  initialVisited?: readonly CountryList[];
}
const Harness = ({ initialVisited = defaultCountries }: ICountrySelectorHarnessProps) => {
  const [visited, setVisited] = useState([...initialVisited]);
  const [wishlist, setWishlist] = useState<CountryList[]>([]);
  const [state, setState] = useState(initialCountryBrowser);
  const [open, setOpen] = useState(false);
  return (
    <CountrySelector
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      state={state}
      onStateChange={setState}
      visitedCountryIds={visited}
      wishlistCountryIds={wishlist}
      trips={[]}
      statuses={{}}
      disabled={false}
      allowPlanning
      onVisited={(id, checked) =>
        setVisited((current) => toggleCountry(current, id, checked, Infinity))
      }
      onWishlist={(id, checked) =>
        setWishlist((current) => toggleCountry(current, id, checked, Infinity))
      }
      onPlan={onPlan}
      onOpenTrip={vi.fn()}
    />
  );
};
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
const click = async (label: string) => {
  const button = [...host.querySelectorAll('button')].find(
    (item) => item.getAttribute('aria-label') === label || item.textContent?.trim() === label,
  );
  if (!button) {
    throw new Error(`Missing ${label}`);
  }
  await act(async () => button.click());
};
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  for (const [method, open] of [
    ['showModal', true],
    ['close', false],
  ] as const) {
    Object.defineProperty(HTMLDialogElement.prototype, method, {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = open;
      },
    });
  }
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Harness />));
  const trigger = host.querySelector('.country-trigger');
  if (!(trigger instanceof HTMLButtonElement)) {
    throw new Error('Missing trigger');
  }
  trigger.focus();
  await act(async () => trigger.click());
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});
describe('visual country modal', () => {
  it('applies search and continent filters to unvisited bucket-list options', async () => {
    await click('Bucket list');
    const search = host.querySelector('input[type="search"]');
    const continent = host.querySelector('select[aria-label="Continent"]');
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (
      !(search instanceof HTMLInputElement) ||
      !(continent instanceof HTMLSelectElement) ||
      !setValue
    ) {
      throw new Error('Missing country filters');
    }
    const query = async (value: string) => {
      await act(async () => {
        setValue.call(search, value);
        search.dispatchEvent(new Event('input', { bubbles: true }));
      });
    };
    await query('Indonesia');
    expect(host.querySelector('button[aria-label="Save Indonesia to bucket list"]')).toBeNull();
    expect(host.textContent).toContain('No unvisited countries match your search.');
    await query('Peru');
    expect(host.querySelector('button[aria-label="Save Peru to bucket list"]')).not.toBeNull();
    await query('');
    await act(async () => {
      continent.value = 'asia';
      continent.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(host.querySelector('button[aria-label="Save Indonesia to bucket list"]')).toBeNull();
    expect(host.querySelector('button[aria-label="Save Japan to bucket list"]')).not.toBeNull();
    expect(host.querySelector('button[aria-label="Save Peru to bucket list"]')).toBeNull();
    await click('Been to');
    expect(host.querySelector('button[aria-label="Remove Indonesia from Been to"]')).not.toBeNull();
  });
  it('pins selected bucket-list countries at the top across continents, without duplicates', async () => {
    await click('Bucket list');
    expect(host.querySelector('section[aria-label="Pinned bucket-list countries"]')).toBeNull();

    await click('Save Peru to bucket list');
    await click('Save Japan to bucket list');

    const sections = [
      ...host.querySelectorAll('section[aria-label="Country collection"] section[aria-label]'),
    ];
    expect(sections[0]?.getAttribute('aria-label')).toBe('Pinned bucket-list countries');
    const pinned = host.querySelector('section[aria-label="Pinned bucket-list countries"]');
    expect(
      [...(pinned?.querySelectorAll('button[aria-label]') ?? [])].map((item) =>
        item.getAttribute('aria-label'),
      ),
    ).toEqual(['Remove Japan from bucket list', 'Remove Peru from bucket list']);
    expect(host.querySelectorAll('button[aria-label="Remove Peru from bucket list"]')).toHaveLength(
      1,
    );
    expect(
      host.querySelectorAll('button[aria-label="Remove Japan from bucket list"]'),
    ).toHaveLength(1);
    expect(host.querySelector('button[aria-label="Save Indonesia to bucket list"]')).toBeNull();

    await click('Remove Peru from bucket list');
    expect(
      host.querySelector('section[aria-label="Pinned bucket-list countries"]')?.textContent,
    ).toContain('Japan');
    expect(
      host.querySelector('section[aria-label="Pinned bucket-list countries"]')?.textContent,
    ).not.toContain('Peru');
    expect(host.querySelector('section[aria-label="South America"]')?.textContent).toContain(
      'Peru',
    );

    await click('Remove Japan from bucket list');
    expect(host.querySelector('section[aria-label="Pinned bucket-list countries"]')).toBeNull();
    expect(host.querySelectorAll('button[aria-label="Save Japan to bucket list"]')).toHaveLength(1);
  });

  it('keeps pinned and unselected destinations subject to search and continent filters', async () => {
    await click('Bucket list');
    await click('Save Peru to bucket list');
    await click('Save Japan to bucket list');

    const search = host.querySelector('input[type="search"]');
    const continent = host.querySelector('select[aria-label="Continent"]');
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (
      !(search instanceof HTMLInputElement) ||
      !(continent instanceof HTMLSelectElement) ||
      !setValue
    ) {
      throw new Error('Missing country filters');
    }

    await act(async () => {
      setValue.call(search, 'Peru');
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(
      host.querySelector('section[aria-label="Pinned bucket-list countries"]')?.textContent,
    ).toContain('Peru');
    expect(host.querySelector('button[aria-label="Remove Japan from bucket list"]')).toBeNull();

    await act(async () => {
      setValue.call(search, '');
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      continent.value = 'asia';
      continent.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(
      host.querySelector('section[aria-label="Pinned bucket-list countries"]')?.textContent,
    ).toContain('Japan');
    expect(host.querySelector('button[aria-label="Remove Peru from bucket list"]')).toBeNull();
    expect(host.querySelector('button[aria-label="Save Indonesia to bucket list"]')).toBeNull();
  });

  it('shows a useful empty state when every country has been visited', async () => {
    await act(async () =>
      root.render(
        <Harness
          key="all-visited"
          initialVisited={Object.values(countries).map((country) => country.code)}
        />,
      ),
    );
    const trigger = host.querySelector('.country-trigger');
    if (!(trigger instanceof HTMLButtonElement)) {
      throw new Error('Missing trigger');
    }
    await act(async () => trigger.click());
    await click('Bucket list');
    expect(host.textContent).toContain('You’ve visited every country in this selection.');
    expect(host.querySelector('button[aria-label^="Save "]')).toBeNull();
    await click('Been to');
    expect(host.querySelector('button[aria-label="Remove Indonesia from Been to"]')).not.toBeNull();
  });
  it('dismisses search focus when a country is toggled', async () => {
    const search = host.querySelector('input[type="search"]');
    if (!(search instanceof HTMLInputElement)) {
      throw new Error('Missing country search');
    }
    search.focus();
    expect(document.activeElement).toBe(search);
    const tile = host.querySelector('button[aria-label="Mark Peru visited"]');
    if (!(tile instanceof HTMLButtonElement)) {
      throw new Error('Missing Peru tile');
    }
    const pointerDown = new Event('pointerdown', { bubbles: true, cancelable: true });
    await act(async () => tile.dispatchEvent(pointerDown));
    expect(pointerDown.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(search);
    await click('Mark Peru visited');
    expect(document.activeElement).not.toBe(search);
    expect(host.textContent).toContain('Peru added to Been to.');
  });
  it('saves and removes wishes in one tap without changing visits or hiding countries', async () => {
    await click('Bucket list');
    const tiles = host.querySelectorAll('button[aria-pressed]').length;
    await click('Save Peru to bucket list');
    expect(host.textContent).toContain('Peru saved to your bucket list.');
    expect(host.textContent).toContain('1 country visited');
    expect(host.querySelectorAll('button[aria-pressed]')).toHaveLength(tiles);
    await click('Plan trip');
    expect(onPlan).toHaveBeenCalledExactlyOnceWith(CountryList.Peru);
    await click('Remove Peru from bucket list');
    expect(host.textContent).toContain('Peru removed from your bucket list.');
    await click('Undo');
    expect(
      host
        .querySelector('button[aria-label="Remove Peru from bucket list"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });
  it('toggles visits directly and keeps country positions stable', async () => {
    const labels = () =>
      [...host.querySelectorAll('button[aria-label]')].map((item) => item.textContent);
    const before = labels();
    await click('Mark Peru visited');
    expect(host.textContent).toContain('2 countries visited');
    expect(
      host
        .querySelector('button[aria-label="Remove Peru from Been to"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
    await click('Remove Peru from Been to');
    expect(host.textContent).toContain('1 country visited');
    expect(labels()).toEqual(before);
  });
  it('excludes visited countries from bucket-list options and updates when visits change', async () => {
    await click('Bucket list');
    expect(host.querySelector('button[aria-label="Save Indonesia to bucket list"]')).toBeNull();
    expect(host.querySelector('button[aria-label="Save Peru to bucket list"]')).not.toBeNull();
    await click('Been to');
    await click('Remove Indonesia from Been to');
    await click('Bucket list');
    await click('Save Indonesia to bucket list');
    expect(
      host.querySelector('button[aria-label="Remove Indonesia from bucket list"]'),
    ).not.toBeNull();
    await click('Been to');
    await click('Mark Indonesia visited');
    await click('Undo');
    expect(host.textContent).toContain('0 countries visited');
    await click('Bucket list');
    expect(
      host
        .querySelector('button[aria-label="Remove Indonesia from bucket list"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
    await click('Been to');
    await click('Mark Indonesia visited');
    await click('Bucket list');
    expect(host.querySelector('button[aria-label="Remove Indonesia from bucket list"]')).toBeNull();
    expect(host.querySelector('[aria-label="Country actions"]')).toBeNull();
  });
  it('dismisses the native modal and restores the opener focus', async () => {
    const dialog = host.querySelector('dialog');
    if (!dialog) {
      throw new Error('Missing modal');
    }
    await act(async () => dialog.dispatchEvent(new Event('cancel', { cancelable: true })));
    expect(host.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(host.querySelector('.country-trigger'));
  });
});
