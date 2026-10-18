// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DateRangeCalendar } from './date-range-calendar';
import { changeMonth, rangeDays } from './date-range';
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
const click = async (label: string) => {
  const button = host.querySelector(`button[aria-label="${label}"]`);
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(label);
  }
  await act(async () => button.click());
};
describe('date range calendar', () => {
  it('counts inclusive days across leap days and year boundaries', () => {
    expect(rangeDays('2028-02-28', '2028-03-01')).toBe(3);
    expect(rangeDays('2026-12-31', '2027-01-01')).toBe(2);
    expect(changeMonth('2028-01-31', 1)).toBe('2028-02-29');
    expect(changeMonth('2026-12-31', 1)).toBe('2027-01-31');
  });
  it('selects a correct seven-day range and starts a fresh range after completion', async () => {
    const onChange = vi.fn();
    const Calendar = () => {
      const [range, setRange] = useState({ start: '2026-06-12', end: '' });
      return (
        <DateRangeCalendar
          {...range}
          onChange={(start, end) => {
            setRange({ start, end });
            onChange(start, end);
          }}
        />
      );
    };
    await act(async () => root.render(<Calendar />));
    expect(host.querySelectorAll('tbody td')).toHaveLength(42);
    await click('Thursday, 18 June 2026');
    expect(onChange).toHaveBeenLastCalledWith('2026-06-12', '2026-06-18');
    expect(host.querySelectorAll('td[aria-selected="true"]')).toHaveLength(7);
    expect(host.textContent).toContain('7 days');
    await click('Saturday, 20 June 2026');
    expect(onChange).toHaveBeenLastCalledWith('2026-06-20', '');
  });
  it('selects across months and moves keyboard focus across a month boundary', async () => {
    const onChange = vi.fn();
    await act(async () =>
      root.render(<DateRangeCalendar start="2026-12-30" end="" onChange={onChange} />),
    );
    await click('Next month');
    await click('Saturday, 2 January 2027');
    expect(onChange).toHaveBeenLastCalledWith('2026-12-30', '2027-01-02');
    await act(async () =>
      root.render(
        <DateRangeCalendar key="keyboard" start="2026-12-31" end="" onChange={onChange} />,
      ),
    );
    const last = host.querySelector('button[aria-label="Thursday, 31 December 2026"]');
    if (!(last instanceof HTMLButtonElement)) {
      throw new Error('Missing last day');
    }
    await act(async () => {
      last.focus();
      last.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      );
    });
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Friday, 1 January 2027');
    expect(host.querySelector('h3')?.textContent).toBe('January 2027');
  });
});
