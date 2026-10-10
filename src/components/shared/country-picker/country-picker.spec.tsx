// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountryPicker, CountryPickerMode } from './country-picker';
import { CountryList } from '../../../types/country';

const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
const renderPicker = (mode: (typeof CountryPickerMode)[keyof typeof CountryPickerMode]) =>
  root.render(
    <CountryPicker mode={mode} selectedCountries={[CountryList.Indonesia]} onToggle={vi.fn()} />,
  );
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
});

describe('shared country picker', () => {
  it('shares name and country-code search across grouped checklist countries', async () => {
    await act(async () => renderPicker(CountryPickerMode.Checklist));
    expect(host.textContent).toContain('1/48');
    expect(host.textContent).toContain('0/48');
    const search = host.querySelector('input[type="search"]');
    if (!(search instanceof HTMLInputElement)) {
      throw new Error('Missing country search');
    }
    await searchFor(search, 'kaz');
    expect(host.textContent).toContain('Kazakhstan');
    expect(host.textContent).not.toContain('Indonesia');
    await searchFor(search, CountryList.France);
    expect(host.textContent).toContain('France');
  });

  it('shows only searched, unselected countries as add actions for trip destinations', async () => {
    await act(async () => renderPicker(CountryPickerMode.Add));
    expect(host.textContent).toContain('Search for a country');
    expect(host.querySelectorAll('button')).toHaveLength(0);
    const search = host.querySelector('input[type="search"]');
    if (!(search instanceof HTMLInputElement)) {
      throw new Error('Missing country search');
    }
    await searchFor(search, 'indonesia');
    expect(host.querySelectorAll('button')).toHaveLength(0);
    await searchFor(search, 'france');
    const add = host.querySelector('button');
    expect(add?.textContent).toBe('France');
  });
});
