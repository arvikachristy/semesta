// @vitest-environment jsdom
import { FrameStatus } from './performance/frame-monitor';
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { startPlayground } from './three/playground';
import { CountryList } from './types/country';
import { CountryStatus } from './types/country-status';
import { selectionStorage } from './storage/country-selection';

vi.mock('./three/playground', () => ({ startPlayground: vi.fn() }));
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
const setCountries = vi.fn(async () => {});
const dispose = vi.fn();
const click = async (query: string) => {
  const element = host.querySelector(query);
  if (!(element instanceof HTMLElement)) {
    throw new Error('Missing checklist control');
  }
  await act(async () => element.click());
};
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.mocked(startPlayground).mockReturnValue({ setCountries, dispose });
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('application selection state', () => {
  it('restores an intentionally empty selection before reconciling the scene', async () => {
    localStorage.setItem(
      selectionStorage.key,
      JSON.stringify({
        version: selectionStorage.version,
        selectedCountryIds: [],
      }),
    );
    await act(async () => root.render(<App />));
    expect(setCountries).toHaveBeenCalledOnce();
    expect(setCountries).toHaveBeenLastCalledWith([]);
  });
  it('restores saved IDs and persists checkbox changes', async () => {
    localStorage.setItem(
      selectionStorage.key,
      JSON.stringify({
        version: selectionStorage.version,
        selectedCountryIds: [CountryList.France],
      }),
    );
    await act(async () => root.render(<App />));
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.France]);
    await click('button');
    await click(`input[value="${CountryList.France}"]`);
    expect(
      JSON.parse(localStorage.getItem(selectionStorage.key) ?? '{}').selectedCountryIds,
    ).toEqual([]);
  });
  it('updates the diagnostic token without recreating the scene', async () => {
    await act(async () => root.render(<App />));
    await act(async () =>
      vi.mocked(startPlayground).mock.calls[0][1]?.onFrameReading?.({
        fps: 24,
        frameMs: 1000 / 24,
        status: FrameStatus.Bad,
      }),
    );
    expect(host.querySelector('.fps-token')?.textContent).toContain('24');
    expect(host.querySelector('.fps-token')?.textContent).toContain('Potato mode');
    expect(startPlayground).toHaveBeenCalledOnce();
  });
  it('reconciles the enum array without reinitializing the scene and retains failed selections for retry', async () => {
    await act(async () => root.render(<App />));
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.Indonesia]);
    await click('button');
    await click(`input[value="${CountryList.France}"]`);
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.Indonesia, CountryList.France]);
    expect(startPlayground).toHaveBeenCalledOnce();
    await act(async () =>
      vi
        .mocked(startPlayground)
        .mock.calls[0][1]?.onCountryStatus?.(CountryList.France, CountryStatus.Error),
    );
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.Indonesia, CountryList.France]);
    expect(host.textContent).toContain('Could not load. Untick and tick to retry.');
    await click(`input[value="${CountryList.France}"]`);
    await click(`input[value="${CountryList.France}"]`);
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.Indonesia, CountryList.France]);
  });
  it('ignores callbacks from the disposed Strict Mode scene', async () => {
    await act(async () =>
      root.render(
        <StrictMode>
          <App />
        </StrictMode>,
      ),
    );
    expect(startPlayground).toHaveBeenCalledTimes(2);
    expect(dispose).toHaveBeenCalledOnce();
    await act(async () =>
      vi
        .mocked(startPlayground)
        .mock.calls[0][1]?.onCountryStatus?.(CountryList.Indonesia, CountryStatus.Error),
    );
    expect(setCountries).toHaveBeenLastCalledWith([CountryList.Indonesia]);
  });
});
