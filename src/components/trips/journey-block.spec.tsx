// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { JourneyBlock } from './journey-block';
import type { IJourneyEntry } from './journey-map-model';

const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
const change = vi.fn();
const edit = vi.fn();
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
  document.body.append(host);
  root = createRoot(host);
  change.mockClear();
  edit.mockClear();
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'setPointerCapture');
  Reflect.deleteProperty(HTMLElement.prototype, 'releasePointerCapture');
});
const render = async (day = 1, endDay = 8) => {
  const entry: IJourneyEntry = {
    item: { id: 'hotel', category: 'accommodation', name: 'Hotel', details: '', completed: false },
    day,
    endDay,
    label: 'Stay',
    saved: true,
  };
  await act(async () =>
    root.render(
      <JourneyBlock
        entry={entry}
        duration={8}
        getBoundaries={() => [0, 100, 200, 300, 400, 500, 600, 700, 800]}
        onChange={change}
        onEdit={edit}
      />,
    ),
  );
};
const pointer = async (label: string, type: string, clientY: number) => {
  const target = host.querySelector(`[aria-label="${label}"]`);
  if (!target) {
    throw new Error('Missing handle');
  }
  await act(async () =>
    target.dispatchEvent(new MouseEvent(type, { clientY, button: 0, bubbles: true })),
  );
};
it('previews a resize then commits once on pointer release without opening the editor', async () => {
  await render();
  await pointer('Resize end of Hotel', 'pointerdown', 680);
  await pointer('Resize end of Hotel', 'pointermove', 380);
  expect(host.textContent).toContain('Day 1–5');
  expect(change).not.toHaveBeenCalled();
  await pointer('Resize end of Hotel', 'pointerup', 380);
  expect(change).toHaveBeenCalledExactlyOnceWith(1, 5);
  expect(edit).not.toHaveBeenCalled();
});
it('moves the entire range and preserves its length', async () => {
  await render(2, 4);
  await pointer('Move Hotel', 'pointerdown', 120);
  await pointer('Move Hotel', 'pointermove', 420);
  expect(host.textContent).toContain('Day 5–7');
  await pointer('Move Hotel', 'pointerup', 420);
  expect(change).toHaveBeenCalledExactlyOnceWith(5, 7);
});
it('discards an interrupted gesture and Escape without persisting a preview', async () => {
  await render();
  await pointer('Resize end of Hotel', 'pointerdown', 680);
  await pointer('Resize end of Hotel', 'pointermove', 380);
  await pointer('Resize end of Hotel', 'pointercancel', 380);
  expect(host.textContent).toContain('Day 1–8');
  await pointer('Resize end of Hotel', 'pointerdown', 680);
  await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  await pointer('Resize end of Hotel', 'pointerup', 380);
  expect(change).not.toHaveBeenCalled();
});
