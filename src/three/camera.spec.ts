// @vitest-environment jsdom
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCamera } from './camera';
import { createGlassSet } from './glasses/glass-set';
describe('camera framing', () => {
  it('fits the complete rotation envelope on desktop and portrait resize', () => {
    const glasses = createGlassSet();
    const view = createCamera(glasses.bounds);
    for (const aspect of [1280 / 800, 390 / 844]) {
      view.camera.aspect = aspect;
      view.camera.updateProjectionMatrix();
      view.fitViewport();
      view.camera.position.copy(view.cameraTarget).add(view.cameraOffset);
      view.camera.lookAt(view.cameraTarget);
      view.camera.updateMatrixWorld();
      const { min, max } = glasses.bounds;
      for (const x of [min.x, max.x]) {
        for (const y of [min.y, max.y]) {
          for (const z of [min.z, max.z]) {
            const point = new THREE.Vector3(x, y, z).project(view.camera);
            expect(Math.abs(point.x)).toBeLessThan(0.92);
            expect(Math.abs(point.y)).toBeLessThan(0.92);
            expect(point.z).toBeLessThan(1);
            expect(point.z).toBeGreaterThan(-1);
          }
        }
      }
    }
    glasses.dispose();
  });

  it('bounds zoom without changing the viewing direction', () => {
    const glasses = createGlassSet();
    const view = createCamera(glasses.bounds);
    const direction = view.cameraOffset.clone().normalize();
    view.zoomBy(10000);
    expect(view.cameraOffset.length()).toBeCloseTo(3);
    view.zoomBy(0.0001);
    expect(view.cameraOffset.length()).toBeLessThan(200);
    expect(view.cameraOffset.clone().normalize().distanceTo(direction)).toBeLessThan(1e-10);
    glasses.dispose();
  });

  it('uses the same proportional magnification in desktop and portrait framing', () => {
    const glasses = createGlassSet();
    const view = createCamera(glasses.bounds);
    for (const aspect of [1280 / 800, 390 / 844]) {
      view.camera.aspect = aspect;
      view.fitViewport();
      const before = view.cameraOffset.length();
      view.zoomBy(1.5);
      expect(view.cameraOffset.length()).toBeCloseTo(before / 1.5);
      view.zoomBy(1 / 1.5);
      expect(view.cameraOffset.length()).toBeCloseTo(before);
      for (const invalid of [0, -1, Infinity, NaN]) {
        view.zoomBy(invalid);
        expect(view.cameraOffset.length()).toBeCloseTo(before);
      }
    }
    glasses.dispose();
  });
});
