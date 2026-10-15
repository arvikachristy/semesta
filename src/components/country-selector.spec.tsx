// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountrySelector } from './country-selector';
import { defaultCountries, toggleCountry } from '../data/countries';
import { CountryList } from '../types/country';
import { initialCountryBrowser } from './shared/country-picker/country-browser-state';
const onPlan = vi.fn();
const Harness = () => {
  const [visited, setVisited] = useState([...defaultCountries]);
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
  it('selects without changing visits, saves a wish, and plans with that country', async () => {
    await click('Explore Peru');
    expect(host.textContent).toContain('1 country visited');
    await click('Save to bucket list');
    expect(host.textContent).toContain('On your bucket list');
    expect(host.textContent).toContain('1 country visited');
    await click('Plan a trip');
    expect(onPlan).toHaveBeenCalledExactlyOnceWith(CountryList.Peru);
    await click('Bucket list');
    expect(host.querySelectorAll('button[aria-label^="Explore "]')).toHaveLength(1);
    await click('Explore Peru');
    await click('Remove wish');
    expect(host.textContent).toContain('Your next adventure starts here');
  });
  it('supports explicit visited edits and repeat-visit wishes', async () => {
    await click('Explore Indonesia');
    await click('Save to bucket list');
    expect(host.textContent).toContain('Been to · On your bucket list');
    await click('Remove visit');
    expect(host.textContent).toContain('0 countries visited');
    expect(host.textContent).toContain('Not visited · On your bucket list');
    await click('Mark visited');
    expect(host.textContent).toContain('1 country visited');
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
