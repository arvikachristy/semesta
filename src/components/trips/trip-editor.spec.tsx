// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountryList } from '../../types/country';
import type { TTripDetails } from '../../types/trip';
import { TripEditor } from './trip-editor';

const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
const saved = vi.fn<(details: TTripDetails) => void>();
const searchFor = async (search: HTMLInputElement, value: string) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(search, value);
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('trip destination country picker', () => {
  it('uses shared country search to add a destination to the trip', async () => {
    await act(async () => root.render(<TripEditor onSave={saved} onCancel={vi.fn()} />));
    const disclosure = host.querySelector('details');
    if (!(disclosure instanceof HTMLDetailsElement)) {
      throw new Error('Missing destination picker');
    }
    await act(async () => {
      disclosure.open = true;
      disclosure.dispatchEvent(new Event('toggle'));
    });
    const search = host.querySelector('input[type="search"]');
    if (!(search instanceof HTMLInputElement)) {
      throw new Error('Missing shared country search');
    }
    await searchFor(search, 'france');
    const result = [...host.querySelectorAll('button')].find(
      (button) => button.textContent === 'France',
    );
    if (!result) {
      throw new Error('Missing France search result');
    }
    await act(async () => result.click());
    expect(host.querySelector('[aria-label="Trip destinations"]')?.textContent).toContain('France');

    const form = host.querySelector('form');
    if (!form) {
      throw new Error('Missing trip editor form');
    }
    await act(async () =>
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    );
    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({ countryIds: [CountryList.France] }),
    );
  });
});
