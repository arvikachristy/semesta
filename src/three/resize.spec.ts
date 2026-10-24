// @vitest-environment jsdom
import * as THREE from 'three';
import { expect, it, vi } from 'vitest';
import { resize } from './resize';
import { getRenderPixelRatio, renderParameters } from './render-parameters';

it('preserves adaptive quality when resizing a high-density viewport', () => {
  vi.stubGlobal('devicePixelRatio', 2);
  const renderer = { setPixelRatio: vi.fn(), setSize: vi.fn() };
  resize(renderer, new THREE.PerspectiveCamera(), renderParameters.minResolutionScale);
  expect(renderer.setPixelRatio).toHaveBeenCalledWith(
    getRenderPixelRatio(
      2,
      window.innerWidth * window.innerHeight,
      renderParameters.minResolutionScale,
    ),
  );
  vi.unstubAllGlobals();
});

it('keeps high-density resize at the same affordable resolution as renderer startup', () => {
  vi.stubGlobal('devicePixelRatio', 3);
  const camera = new THREE.PerspectiveCamera();
  const renderer = { setPixelRatio: vi.fn(), setSize: vi.fn() };
  resize(renderer, camera);
  expect(renderer.setPixelRatio).toHaveBeenCalledWith(
    getRenderPixelRatio(3, window.innerWidth * window.innerHeight),
  );
  expect(renderer.setSize).toHaveBeenCalledWith(window.innerWidth, window.innerHeight, false);
  expect(camera.aspect).toBe(window.innerWidth / window.innerHeight);
  vi.unstubAllGlobals();
});

it('fits the camera and buffer to the scene area alongside a country sidebar', () => {
  const canvas = document.createElement('canvas');
  Object.defineProperties(canvas, { clientWidth: { value: 800 }, clientHeight: { value: 700 } });
  const camera = new THREE.PerspectiveCamera();
  const renderer = { setPixelRatio: vi.fn(), setSize: vi.fn() };
  resize(renderer, camera, 1, canvas);
  expect(camera.aspect).toBe(800 / 700);
  expect(renderer.setSize).toHaveBeenCalledWith(800, 700, false);
});
