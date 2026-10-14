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
    expect(host.textContent).toContain('1/49');
    expect(host.textContent).toContain('0/47');
    expect(host.querySelector(`input[value="${CountryList.UnitedKingdom}"]`)).toBeNull();
    for (const country of [
      CountryList.England,
      CountryList.Scotland,
      CountryList.Wales,
      CountryList.NorthernIreland,
    ]) {
      expect(host.querySelector(`input[value="${country}"]`)).not.toBeNull();
    }
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

  it('finds Hong Kong separately and uses Vatican City for both its common and official names', async () => {
    await act(async () => renderPicker(CountryPickerMode.Checklist));
    const search = host.querySelector('input[type="search"]');
    if (!(search instanceof HTMLInputElement)) {
      throw new Error('Missing country search');
    }
    for (const query of ['Hong Kong', CountryList.HongKong]) {
      await searchFor(search, query);
      expect(
        host.querySelector(`input[type="checkbox"][value="${CountryList.HongKong}"]`),
      ).not.toBeNull();
      expect(host.querySelector(`input[type="checkbox"][value="${CountryList.China}"]`)).toBeNull();
    }
    for (const query of ['Vatican', 'Holy See', CountryList.VaticanCity]) {
      await searchFor(search, query);
      const option = host.querySelector(
        `input[type="checkbox"][value="${CountryList.VaticanCity}"]`,
      );
      expect(option?.parentElement?.textContent).toBe('Vatican City');
    }
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
    await searchFor(search, 'hong kong');
    expect(host.querySelector('button')?.textContent).toBe('Hong Kong');
    await searchFor(search, 'holy see');
    expect(host.querySelector('button')?.textContent).toBe('Vatican City');
  });
});
