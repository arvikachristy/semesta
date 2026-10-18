// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DayDial, dialAngle, dialDelta } from './day-dial';
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  document.body.append(host);
  root = createRoot(host);
  for (const name of ['setPointerCapture', 'releasePointerCapture']) {
    Object.defineProperty(SVGElement.prototype, name, { configurable: true, value: vi.fn() });
  }
  Object.defineProperty(SVGElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: () => true,
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  for (const name of ['setPointerCapture', 'releasePointerCapture', 'hasPointerCapture']) {
    Reflect.deleteProperty(SVGElement.prototype, name);
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const pointer = async (svg: SVGSVGElement, type: string, degrees: number) => {
  const angle = (degrees * Math.PI) / 180;
  const event = new MouseEvent(type, {
    bubbles: true,
    button: 0,
    clientX: 160 + Math.sin(angle) * 130,
    clientY: 160 - Math.cos(angle) * 130,
  });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  await act(async () => svg.dispatchEvent(event));
};
describe('day dial', () => {
  it('uses clockwise angles with a continuous seam at twelve o’clock', () => {
    expect(dialAngle(0, -130)).toBe(0);
    expect(dialAngle(130, 0)).toBe(90);
    expect(dialDelta(6, 354)).toBe(12);
    expect(dialDelta(354, 6)).toBe(-12);
  });
  it('drags across the top without jumping back to one, and stops on cancellation', async () => {
    const onChange = vi.fn();
    await act(async () => root.render(<DayDial value={30} onChange={onChange} />));
    const svg = host.querySelector('svg');
    if (!svg) {
      throw new Error('Missing dial');
    }
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 320,
      right: 320,
      width: 320,
      height: 320,
      toJSON: () => ({}),
    });
    await pointer(svg, 'pointerdown', 348);
    await pointer(svg, 'pointermove', 354);
    await pointer(svg, 'pointermove', 6);
    expect(onChange.mock.calls.map(([days]) => days)).toEqual([30, 31, 32]);
    await pointer(svg, 'pointercancel', 6);
    await pointer(svg, 'pointermove', 90);
    expect(onChange).toHaveBeenCalledTimes(3);
  });
  it('supports keyboard bounds, presets and accessible plus/minus controls', async () => {
    const onChange = vi.fn();
    await act(async () => root.render(<DayDial value={1} onChange={onChange} />));
    const slider = host.querySelector('[role="slider"]');
    if (!slider) {
      throw new Error('Missing slider');
    }
    await act(async () =>
      slider.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
      ),
    );
    expect(onChange).toHaveBeenLastCalledWith(1);
    await act(async () =>
      slider.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
      ),
    );
    expect(onChange).toHaveBeenLastCalledWith(365);
    const minus = host.querySelector('button[aria-label="One fewer day"]');
    expect(minus?.hasAttribute('disabled')).toBe(true);
    const week = [...host.querySelectorAll('button')].find(
      (button) => button.textContent === 'Two weeks',
    );
    if (!week) {
      throw new Error('Missing preset');
    }
    await act(async () => week.click());
    expect(onChange).toHaveBeenLastCalledWith(14);
  });
});
