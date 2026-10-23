// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { JourneyBlock } from './journey-block';
import interact from 'interactjs';
import type { IJourneyEntry } from './journey-map-model';

const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
const change = vi.fn();
const edit = vi.fn();
const remove = vi.fn();
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 150, 700),
  );
  Object.defineProperty(HTMLElement.prototype, 'getClientRects', {
    configurable: true,
    value(this: HTMLElement) {
      return [this.getBoundingClientRect()];
    },
  });
  document.body.append(host);
  root = createRoot(host);
  change.mockClear();
  edit.mockClear();
  remove.mockClear();
});
afterEach(async () => {
  const block = host.querySelector('[data-dragging]');
  const unset = block instanceof HTMLElement ? vi.spyOn(interact(block), 'unset') : undefined;
  await act(async () => root.unmount());
  expect(unset).toHaveBeenCalledOnce();
  host.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLElement.prototype, 'getClientRects');
  vi.useRealTimers();
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
        onDelete={remove}
      />,
    ),
  );
};
const pointer = async (label: string, type: string, clientY: number, pointerType = 'mouse') => {
  const target = host.querySelector(`[aria-label="${label}"]`);
  if (!target) {
    throw new Error('Missing handle');
  }
  await act(async () =>
    (type === 'pointerdown' ? target : document).dispatchEvent(
      new PointerEvent(type, {
        pointerId: 1,
        pointerType,
        isPrimary: true,
        clientX: 60,
        clientY,
        button: 0,
        buttons: type === 'pointerup' ? 0 : 1,
        bubbles: true,
      }),
    ),
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
  await pointer('Edit Hotel', 'pointerdown', 120);
  await pointer('Edit Hotel', 'pointermove', 420);
  expect(host.textContent).toContain('Day 5–7');
  await pointer('Edit Hotel', 'pointerup', 420);
  expect(change).toHaveBeenCalledExactlyOnceWith(5, 7);
  await click('Edit Hotel');
  expect(edit).not.toHaveBeenCalled();
});
it('discards an interrupted gesture and Escape without persisting a preview', async () => {
  await render();
  await pointer('Resize end of Hotel', 'pointerdown', 680);
  await pointer('Resize end of Hotel', 'pointermove', 380);
  await act(async () => window.dispatchEvent(new Event('touchcancel')));
  expect(host.textContent).toContain('Day 1–8');
  await pointer('Resize end of Hotel', 'pointerdown', 680);
  await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  await pointer('Resize end of Hotel', 'pointerup', 380);
  expect(change).not.toHaveBeenCalled();
});
const click = async (label: string) => {
  await act(async () =>
    host
      .querySelector(`[aria-label="${label}"]`)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })),
  );
};
it('scrolls before a touch hold, then moves from the body after a hold', async () => {
  vi.useFakeTimers();
  await render(2, 4);
  await pointer('Edit Hotel', 'pointerdown', 120, 'touch');
  const swipe = new Event('touchmove', { bubbles: true, cancelable: true });
  await act(async () => host.querySelector('[data-dragging]')?.dispatchEvent(swipe));
  expect(swipe.defaultPrevented).toBe(false);
  await pointer('Edit Hotel', 'pointermove', 420, 'touch');
  await pointer('Edit Hotel', 'pointerup', 420, 'touch');
  await act(async () => vi.advanceTimersByTime(400));
  expect(change).not.toHaveBeenCalled();
  await pointer('Edit Hotel', 'pointerdown', 120, 'touch');
  await act(async () => vi.advanceTimersByTime(350));
  const touchMove = new Event('touchmove', { bubbles: true, cancelable: true });
  await act(async () => host.querySelector('[data-dragging]')?.dispatchEvent(touchMove));
  expect(touchMove.defaultPrevented).toBe(true);
  await pointer('Edit Hotel', 'pointermove', 420, 'touch');
  expect(host.textContent).toContain('Day 5–7');
  await pointer('Edit Hotel', 'pointerup', 420, 'touch');
  expect(change).toHaveBeenCalledExactlyOnceWith(5, 7);
  await click('Edit Hotel');
  expect(edit).not.toHaveBeenCalled();
  await pointer('Edit Hotel', 'pointerdown', 120, 'touch');
  await pointer('Edit Hotel', 'pointerup', 120, 'touch');
  await click('Edit Hotel');
  expect(edit).toHaveBeenCalledOnce();
});
it('keeps taps and Edit/Delete independent of dragging', async () => {
  await render(2, 4);
  await pointer('Edit Hotel', 'pointerdown', 120);
  await pointer('Edit Hotel', 'pointerup', 120);
  await click('Edit Hotel');
  expect(edit).toHaveBeenCalledOnce();
  for (const label of ['Edit details for Hotel', 'Delete Hotel']) {
    await pointer(label, 'pointerdown', 120);
    await pointer(label, 'pointermove', 420);
    await pointer(label, 'pointerup', 420);
    await click(label);
  }
  expect(change).not.toHaveBeenCalled();
  expect(edit).toHaveBeenCalledTimes(2);
  expect(remove).toHaveBeenCalledOnce();
});
it('does not activate a touch hold after cancellation', async () => {
  vi.useFakeTimers();
  await render(2, 4);
  await pointer('Edit Hotel', 'pointerdown', 120, 'touch');
  await pointer('Edit Hotel', 'pointercancel', 120, 'touch');
  await act(async () => vi.advanceTimersByTime(400));
  expect(host.querySelector('[data-dragging="true"]')).toBeNull();
  expect(change).not.toHaveBeenCalled();
});
