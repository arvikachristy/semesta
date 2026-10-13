import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { countryGroups } from '../../data/countries';
import { ContinentId } from '../../types/continent';
import { getGlassDefinition, GlassShape } from './glass-definitions';
import { createGlassGeometry } from './glass-geometry';
import { glassDimensions, glassParameters } from './glass-parameters';
import { createSoftBody } from '../jelly-flags/jelly-soft-body';
import { createJellyPile, pileParameters } from '../jelly-flags/jelly-pile';
import { jellyParameters } from '../jelly-flags/jelly-parameters';

const highball = getGlassDefinition(ContinentId.Africa);

describe('Africa highball', () => {
  it('allocates catalogue capacity with the same usable volume per country as Oceania', () => {
    const count = countryGroups.find(({ id }) => id === ContinentId.Africa)!.countries.length;
    const coupe = getGlassDefinition(ContinentId.Oceania);
    expect(highball.shape).toBe(GlassShape.Highball);
    expect(highball.capacity).toBe(count);
    expect(count).toBe(54);
    expect(highball.usableVolume / coupe.usableVolume).toBeCloseTo(count / coupe.capacity);
    expect(Math.PI * highball.innerRadius ** 2 * (highball.ceiling - highball.floor)).toBeCloseTo(
      highball.usableVolume,
    );
    expect(highball.height / (2 * highball.outerRadius)).toBeGreaterThan(2);
    expect(highball.height).toBeGreaterThan(glassDimensions.outerHeight);
  });

  it('keeps the top open and matches the visible floor and wall to the interior dimensions', () => {
    const geometry = createGlassGeometry({
      ...glassDimensions,
      outerRadius: highball.outerRadius,
      outerHeight: highball.height,
      interiorDiameter: highball.innerRadius * 2,
    });
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    const ray = new THREE.Raycaster(
      new THREE.Vector3(0, highball.height + 1, 0),
      new THREE.Vector3(0, -1, 0),
    );
    expect(ray.intersectObject(mesh)[0].point.y).toBeCloseTo(highball.floor);
    ray.set(new THREE.Vector3(0, highball.height / 2, 0), new THREE.Vector3(1, 0, 0));
    expect(ray.intersectObject(mesh)[0].point.x).toBeCloseTo(highball.innerRadius);
    geometry.dispose();
    material.dispose();
  });

  it('contains all 54 jellies after filling and settling', () => {
    const pile = createJellyPile();
    const { width, height, depth } = jellyParameters.surface;
    const scale = glassParameters.jellyScale;
    const bodies: ReturnType<typeof createSoftBody>[] = [];
    for (let index = 0; index < highball.capacity; index++) {
      const angle = index * pileParameters.dropAngle;
      const radius =
        (highball.innerRadius -
          (Math.hypot(width, depth) * scale) / 2 -
          pileParameters.wallClearance) *
        Math.sqrt((index * pileParameters.dropRadiusStep) % 1);
      const body = createSoftBody(width * scale, height * scale, depth * scale, [], {
        origin: new THREE.Vector3(
          Math.sin(angle) * radius,
          highball.ceiling - (height * scale) / 2 - 0.02,
          Math.cos(angle) * radius,
        ),
        radius: highball.innerRadius - pileParameters.wallClearance,
        wallAt: (height) => {
          const wall = highball.wallAt!(height);
          return { ...wall, radius: wall.radius - pileParameters.wallClearance };
        },
        floor: highball.floor,
        ceiling: highball.ceiling,
      });
      bodies.push(body);
      pile.add(body);
      for (let frame = 0; frame < 30; frame++) {
        pile.update(1 / 60);
      }
    }
    for (let frame = 0; frame < 1200; frame++) {
      pile.update(1 / 60);
    }
    for (const body of bodies) {
      for (const local of body.positions) {
        const point = local.clone().add(body.container!.origin);
        expect(Number.isFinite(point.length())).toBe(true);
        expect(point.y).toBeGreaterThanOrEqual(highball.floor - 1e-6);
        expect(point.y).toBeLessThanOrEqual(highball.ceiling + 1e-6);
        expect(Math.hypot(point.x, point.z)).toBeLessThanOrEqual(
          highball.innerRadius - pileParameters.wallClearance + 1e-6,
        );
      }
    }
    expect(pile.getAwakeCount()).toBe(0);
    pile.dispose();
  });
});
