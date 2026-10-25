// @vitest-environment jsdom
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startPlayground } from './playground';
import { readScenePalette } from './scene-palette';

const mocks = vi.hoisted(() => ({
  render: vi.fn(),
  update: vi.fn(() => false),
  shadowMap: { needsUpdate: true },
  artworkLoaded: () => {},
}));
vi.mock('./renderer', () => ({
  createRenderer: () => ({
    render: mocks.render.mockImplementation(() => {
      mocks.shadowMap.needsUpdate = false;
    }),
    shadowMap: mocks.shadowMap,
    getPixelRatio: () => 1,
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    dispose: vi.fn(),
  }),
}));
vi.mock('./lights', () => ({
  createLights: () => ({
    ambientLight: new THREE.AmbientLight(),
    directionalLight: new THREE.DirectionalLight(),
    environment: null,
    setTheme: () => null,
    dispose: vi.fn(),
  }),
}));
vi.mock('./glasses/glass-set', () => ({
  createGlassSet: (_palette: unknown, onLoad: () => void) => {
    mocks.artworkLoaded = onLoad;
    return {
      object: new THREE.Group(),
      bounds: new THREE.Box3(new THREE.Vector3(-5, 0, -5), new THREE.Vector3(5, 5, 5)),
      updateFacing: vi.fn(),
      setTheme: vi.fn(),
      dispose: vi.fn(),
    };
  },
}));
vi.mock('./jelly-flags/country-collection', () => ({
  createCountryCollection: () => ({
    blocks: [],
    update: mocks.update,
    setCountries: vi.fn(),
    dispose: vi.fn(),
  }),
}));
vi.mock('./pointer', () => ({
  bindPointerEvents: () => ({ unbind: vi.fn() }),
}));

let nextFrame: FrameRequestCallback | undefined;
let playground: ReturnType<typeof startPlayground>;
let canvas: HTMLCanvasElement;
let now = 0;
const frame = () => {
  now += 1000 / 60;
  nextFrame?.(now);
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.shadowMap.needsUpdate = true;
  mocks.update.mockReturnValue(false);
  now = 100;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    nextFrame = callback;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  canvas = document.createElement('canvas');
  document.body.append(canvas);
  playground = startPlayground(canvas);
});
afterEach(() => {
  playground.dispose();
  canvas.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('scene render invalidation', () => {
  it('renders initially, skips settled frames, and redraws changing surfaces and their final shadows', () => {
    expect(mocks.render).toHaveBeenCalledTimes(1);
    for (let index = 0; index < 120; index++) {
      frame();
    }
    expect(mocks.render).toHaveBeenCalledTimes(1);
    mocks.update.mockReturnValueOnce(true);
    frame();
    expect(mocks.render).toHaveBeenCalledTimes(2);
    for (let index = 0; index < 120; index++) {
      frame();
    }
    expect(mocks.render).toHaveBeenCalledTimes(2);
  });

  it('redraws asynchronous artwork, themes, resizing and camera interaction after idle', () => {
    frame();
    mocks.render.mockClear();
    mocks.artworkLoaded?.();
    frame();
    expect(mocks.render).toHaveBeenCalledTimes(1);
    playground.setTheme(readScenePalette());
    frame();
    expect(mocks.render).toHaveBeenCalledTimes(2);
    window.dispatchEvent(new Event('resize'));
    frame();
    expect(mocks.render).toHaveBeenCalledTimes(3);
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }));
    frame();
    expect(mocks.render).toHaveBeenCalledTimes(4);
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    frame();
    expect(mocks.render).toHaveBeenCalledTimes(5);
  });

  it('submits a delayed final shadow update even when motion has already stopped', () => {
    mocks.update.mockReturnValueOnce(true);
    frame();
    expect(mocks.render).toHaveBeenCalledTimes(2);
    for (let index = 0; index < 120; index++) {
      frame();
    }
    expect(mocks.render).toHaveBeenCalledTimes(3);
  });

  it('does no rendering or physics work while hidden and redraws when shown', () => {
    mocks.render.mockClear();
    mocks.update.mockClear();
    canvas.hidden = true;
    frame();
    expect(mocks.render).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    canvas.hidden = false;
    frame();
    expect(mocks.render).toHaveBeenCalledOnce();
    mocks.render.mockClear();
    mocks.update.mockClear();
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    frame();
    expect(mocks.render).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    hidden.mockReturnValue(false);
    frame();
    expect(mocks.render).toHaveBeenCalledOnce();
  });
});
