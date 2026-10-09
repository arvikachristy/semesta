// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { getWheelZoomFactor, zoomParameters } from './zoom';

describe('wheel camera zoom', () => {
  it('normalizes pixel, line and page deltas to the same magnification', () => {
    const pixels = getWheelZoomFactor(new WheelEvent('wheel', { deltaY: 160 }), 800);
    const lines = getWheelZoomFactor(
      new WheelEvent('wheel', { deltaY: 10, deltaMode: WheelEvent.DOM_DELTA_LINE }),
      800,
    );
    const pages = getWheelZoomFactor(
      new WheelEvent('wheel', { deltaY: 0.2, deltaMode: WheelEvent.DOM_DELTA_PAGE }),
      800,
    );
    expect(lines).toBeCloseTo(pixels);
    expect(pages).toBeCloseTo(pixels);
  });
  it('matches a pinch ratio and makes opposite wheel motion reversible', () => {
    const factor = 1.5;
    const deltaY = -Math.log(factor) / zoomParameters.wheelSensitivity;
    const zoomIn = getWheelZoomFactor(new WheelEvent('wheel', { deltaY, ctrlKey: true }), 800);
    const zoomOut = getWheelZoomFactor(new WheelEvent('wheel', { deltaY: -deltaY }), 800);
    expect(zoomIn).toBeCloseTo(factor);
    expect(zoomIn * zoomOut).toBeCloseTo(1);
  });
});
