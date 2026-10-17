// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountryList } from '../../types/country';
import { TripEditor } from './trip-editor';
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
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
const fill = async (selector: string, value: string) => {
  const input = host.querySelector(selector);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(selector);
  }
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
const submit = async () => {
  const form = host.querySelector('form');
  if (!form) {
    throw new Error('Missing form');
  }
  await act(async () =>
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  );
};
describe('two-question trip setup', () => {
  it('creates a flexible trip with a country, duration and generated title, without booking records', async () => {
    const onSave = vi.fn();
    await act(async () => root.render(<TripEditor onSave={onSave} onCancel={vi.fn()} />));
    expect(host.querySelectorAll('input')).toHaveLength(2);
    expect(host.querySelector('textarea')).toBeNull();
    await fill('input[name="destination"]', 'Japan');
    await fill('input[type="number"]', '10');
    await submit();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Japan',
        destination: 'Japan',
        countryIds: [CountryList.Japan],
        durationDays: 10,
        startDate: '',
        endDate: '',
        stops: [expect.objectContaining({ name: 'Japan', nights: 9 })],
      }),
    );
    expect(onSave.mock.calls[0][0].planning).toBeUndefined();
  });
  it('accepts a city without fabricating a country and calculates inclusive date duration', async () => {
    const onSave = vi.fn();
    await act(async () => root.render(<TripEditor onSave={onSave} onCancel={vi.fn()} />));
    await fill('input[name="destination"]', 'Kyoto');
    const dates = [...host.querySelectorAll('button')].find(
      (button) => button.textContent === 'Choose dates',
    );
    if (!dates) {
      throw new Error('Missing dates toggle');
    }
    await act(async () => dates.click());
    await fill('input[aria-label="Departure date"]', '2026-12-17');
    await fill('input[aria-label="Return date"]', '2026-12-26');
    await submit();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Kyoto',
        countryIds: [],
        durationDays: 10,
        startDate: '2026-12-17',
        endDate: '2026-12-26',
      }),
    );
  });
  it('rejects empty, fractional and excessive day counts', async () => {
    const onSave = vi.fn();
    await act(async () => root.render(<TripEditor onSave={onSave} onCancel={vi.fn()} />));
    await fill('input[name="destination"]', 'Japan');
    for (const days of ['0', '1.5', '366', '']) {
      await fill('input[type="number"]', days);
      await submit();
    }
    expect(onSave).not.toHaveBeenCalled();
  });
});
