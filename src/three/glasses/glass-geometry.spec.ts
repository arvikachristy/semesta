import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createGlassGeometry } from './glass-geometry';
import { glassDimensions, glassParameters } from './glass-parameters';

describe('hollow glass geometry', () => {
  let geometry: ReturnType<typeof createGlassGeometry>;
  let material: THREE.MeshBasicMaterial;
  let mesh: THREE.Mesh;
  beforeEach(() => {
    geometry = createGlassGeometry();
    material = new THREE.MeshBasicMaterial();
    mesh = new THREE.Mesh(geometry, material);
  });
  afterEach(() => {
    geometry.dispose();
    material.dispose();
  });

  it('has an open top and an interior base at the configured thickness', () => {
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -1, 0));
    const hits = ray.intersectObject(mesh);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].point.y).toBeCloseTo(glassParameters.baseThickness);
  });

  it('has a real inner wall and outer wall', () => {
    const inside = new THREE.Raycaster(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
    const outside = new THREE.Raycaster(new THREE.Vector3(3, 1, 0), new THREE.Vector3(-1, 0, 0));
    expect(inside.intersectObject(mesh)[0].point.x).toBeCloseTo(
      glassDimensions.interiorDiameter / 2,
    );
    expect(outside.intersectObject(mesh)[0].point.x).toBeCloseTo(glassDimensions.outerRadius);
  });
});
