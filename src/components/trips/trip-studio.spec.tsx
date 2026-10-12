// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TripStudio } from './trip-studio';
import { emptyTripDetails } from '../../types/trip';
import { CountryList } from '../../types/country';

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
describe('Trip Studio preview', () => {
  it('shows the chosen trip and updates progress only for enabled categories without saving', async () => {
    const onBack = vi.fn();
    const before = localStorage.length;
    await act(async () =>
      root.render(
        <TripStudio
          trip={{
            ...emptyTripDetails,
            id: 'trip',
            name: 'Paris with friends',
            countryIds: [CountryList.France],
          }}
          onBack={onBack}
        />,
      ),
    );
    expect(host.querySelector('h1')?.textContent).toBe('Paris with friends');
    expect(document.activeElement).toBe(host.querySelector('h1'));
    expect(host.textContent).toContain('France');
    expect(host.textContent).toContain('Example travel group');
    expect(host.textContent).toContain('67%');
    expect(host.querySelectorAll('ol')).toHaveLength(2);
    const activity = host.querySelectorAll('input')[2];
    await act(async () => activity.click());
    expect(host.querySelectorAll('ol')).toHaveLength(3);
    expect(host.textContent).toContain('40%');
    for (const checkbox of host.querySelectorAll('input')) {
      if (checkbox.checked) {
        await act(async () => checkbox.click());
      }
    }
    expect(host.textContent).toContain('0%');
    expect(host.querySelectorAll('ol')).toHaveLength(0);
    expect(localStorage.length).toBe(before);
    const back = host.querySelector('button');
    if (!back) {
      throw new Error('Missing back action');
    }
    await act(async () => back.click());
    expect(onBack).toHaveBeenCalledOnce();
  });
});
