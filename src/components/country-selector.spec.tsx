// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountrySelector } from './country-selector';
import { defaultCountries, toggleCountry } from '../data/countries';
import { CountryList } from '../types/country';

const Harness = () => {
  const [showedCountries, setShowedCountries] = useState([...defaultCountries]);
  return (
    <CountrySelector
      showedCountries={showedCountries}
      statuses={{}}
      onToggle={(country, checked) =>
        setShowedCountries((current) => toggleCountry(current, country, checked, 60))
      }
    />
  );
};
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
const button = () => {
  const element = host.querySelector('button');
  if (!element) {
    throw new Error('Missing selector trigger');
  }
  return element;
};
const checkbox = (country: CountryList) => {
  const element = host.querySelector(`input[value="${country}"]`);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error('Missing country checkbox');
  }
  return element;
};
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Harness />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe('continent country checklist', () => {
  it('starts with Indonesia, groups countries, and keeps the panel open while toggling', async () => {
    expect(button().textContent).toContain('1 selected');
    await act(async () => button().click());
    expect([...host.querySelectorAll('legend')].map((element) => element.textContent)).toEqual([
      'Europe',
      'Asia',
    ]);
    expect(checkbox(CountryList.Indonesia).checked).toBe(true);
    await act(async () => checkbox(CountryList.France).click());
    expect(button().textContent).toContain('2 selected');
    expect(checkbox(CountryList.France).checked).toBe(true);
    await act(async () => checkbox(CountryList.Indonesia).click());
    expect(checkbox(CountryList.Indonesia).checked).toBe(false);
    expect(button().getAttribute('aria-expanded')).toBe('true');
  });
  it('closes on Escape with focus restored and on an outside pointer press', async () => {
    await act(async () => button().click());
    checkbox(CountryList.Indonesia).focus();
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(button().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button());
    await act(async () => button().click());
    await act(async () => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(button().getAttribute('aria-expanded')).toBe('false');
  });
});
