// @vitest-environment jsdom
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCamera } from './camera';
import { createGlassSet } from './glasses/glass-set';
import { panParameters } from './pan';
const syncCamera = (view: ReturnType<typeof createCamera>) => {
  view.camera.position.copy(view.cameraTarget).add(view.cameraOffset);
  view.camera.lookAt(view.cameraTarget);
  view.camera.updateMatrixWorld();
};
const groundPoint = (camera: THREE.PerspectiveCamera, screen: THREE.Vector2) => {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(screen, camera);
  const point = ray.ray.intersectPlane(
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -panParameters.groundHeight),
    new THREE.Vector3(),
  );
  if (!point) {
    throw new Error('Expected ground intersection');
  }
  return point;
};

describe('spatial camera pan', () => {
  it('keeps the dragged ground point under the pointer at both zoom levels and viewport shapes', () => {
    const glasses = createGlassSet();
    for (const aspect of [1280 / 800, 390 / 844]) {
      for (const zoom of [1, 2]) {
        const view = createCamera(glasses.bounds);
        view.camera.aspect = aspect;
        view.camera.updateProjectionMatrix();
        view.fitViewport();
        view.zoomBy(zoom);
        syncCamera(view);
        const from = new THREE.Vector2(0, -0.1);
        const to = new THREE.Vector2(0.05, -0.15);
        const picked = groundPoint(view.camera, from);
        const y = view.cameraTarget.y;
        view.panBetween(from, to);
        syncCamera(view);
        const projected = picked.project(view.camera);
        expect(projected.x).toBeCloseTo(to.x);
        expect(projected.y).toBeCloseTo(to.y);
        expect(view.cameraTarget.y).toBe(y);
      }
    }
    glasses.dispose();
  });

  it('reaches the front face of a front glass when fully zoomed in', () => {
    const glasses = createGlassSet();
    const view = createCamera(glasses.bounds);
    view.zoomBy(10000);
    syncCamera(view);
    const frontGlass = glasses.object.children.reduce((front, glass) =>
      glass.position.z > front.position.z ? glass : front,
    );
    const desired = new THREE.Vector3(
      frontGlass.position.x,
      view.cameraTarget.y,
      glasses.bounds.max.z,
    );
    const from = new THREE.Vector2();
    const to = groundPoint(view.camera, from)
      .sub(desired.clone().sub(view.cameraTarget))
      .project(view.camera);
    view.panBetween(from, new THREE.Vector2(to.x, to.y));
    expect(view.cameraTarget.distanceTo(desired)).toBeLessThan(1e-10);
    expect(view.cameraTarget.z).toBeGreaterThan(4.5);
    expect(glasses.object.position.toArray()).toEqual([0, 0, 0]);
    glasses.dispose();
  });

  it('bounds travel to the composition plus a small margin', () => {
    const glasses = createGlassSet();
    const view = createCamera(glasses.bounds);
    syncCamera(view);
    for (let i = 0; i < 20; i++) {
      view.panBetween(new THREE.Vector2(0.5, 0), new THREE.Vector2(-0.5, 0));
      syncCamera(view);
    }
    expect(view.cameraTarget.x).toBeCloseTo(glasses.bounds.max.x + panParameters.boundaryPadding);
    expect(view.cameraTarget.z).toBeCloseTo(0);
    glasses.dispose();
  });
});
