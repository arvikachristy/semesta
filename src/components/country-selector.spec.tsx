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
      onClear={() => setShowedCountries([])}
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
  // jsdom lacks the native modal API; real focus trapping is checked in Chrome.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true;
    },
  });
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Harness />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
});

describe('continent country checklist', () => {
  it('starts with Indonesia, groups countries, and keeps the panel open while toggling', async () => {
    expect(button().textContent).toContain('1 selected');
    await act(async () => button().click());
    expect([...host.querySelectorAll('legend')].map((element) => element.textContent)).toEqual([
      'Europe0/48',
      'Asia1/48',
      'Africa0/54',
      'Oceania0/14',
      'Antarctica0/0',
      'South America0/12',
      'North America0/23',
    ]);
    expect(checkbox(CountryList.Indonesia).checked).toBe(true);
    await act(async () => checkbox(CountryList.France).click());
    expect(button().textContent).toContain('2 selected');
    expect(checkbox(CountryList.France).checked).toBe(true);
    await act(async () => checkbox(CountryList.Indonesia).click());
    expect(checkbox(CountryList.Indonesia).checked).toBe(false);
    expect(button().getAttribute('aria-expanded')).toBe('true');
  });
  it('requires confirmation, preserves flags on cancellation, and clears all on confirmation', async () => {
    await act(async () => button().click());
    await act(async () => checkbox(CountryList.France).click());
    const clear = host.querySelector('.country-actions button');
    if (!(clear instanceof HTMLButtonElement)) {
      throw new Error('Missing clear action');
    }
    await act(async () => clear.click());
    expect(button().textContent).toContain('2 selected');
    const cancel = host.querySelector('dialog button');
    if (!(cancel instanceof HTMLButtonElement)) {
      throw new Error('Missing cancellation');
    }
    await act(async () => cancel.click());
    expect(button().textContent).toContain('2 selected');
    expect(document.activeElement).toBe(clear);
    await act(async () => clear.click());
    const confirm = host.querySelector('dialog button:last-child');
    if (!(confirm instanceof HTMLButtonElement)) {
      throw new Error('Missing confirmation');
    }
    await act(async () => confirm.click());
    expect(button().textContent).toContain('0 selected');
    expect(checkbox(CountryList.Indonesia).checked).toBe(false);
    expect(checkbox(CountryList.France).checked).toBe(false);
    expect(clear.disabled).toBe(true);
    expect(host.querySelector('dialog')).toBeNull();
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
