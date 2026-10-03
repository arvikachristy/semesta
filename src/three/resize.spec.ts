// @vitest-environment jsdom
import * as THREE from 'three';
import { expect, it, vi } from 'vitest';
import { resize } from './resize';
import { getRenderPixelRatio } from './render-parameters';

it('keeps high-density resize at the same affordable resolution as renderer startup', () => {
  vi.stubGlobal('devicePixelRatio', 3);
  const camera = new THREE.PerspectiveCamera();
  const renderer = { setPixelRatio: vi.fn(), setSize: vi.fn() };
  resize(renderer, camera);
  expect(renderer.setPixelRatio).toHaveBeenCalledWith(getRenderPixelRatio(3));
  expect(renderer.setPixelRatio).toHaveBeenCalledWith(1);
  expect(renderer.setSize).toHaveBeenCalledWith(window.innerWidth, window.innerHeight);
  expect(camera.aspect).toBe(window.innerWidth / window.innerHeight);
  vi.unstubAllGlobals();
});
