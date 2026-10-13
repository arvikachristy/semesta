import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { countryGroups } from '../../data/countries';
import { createSoftBody } from '../jelly-flags/jelly-soft-body';
import { createJellyPile, pileParameters } from '../jelly-flags/jelly-pile';
import { jellyParameters } from '../jelly-flags/jelly-parameters';
import { glassParameters } from './glass-parameters';
import { oceaniaCoupe, coupeWallAt, createCoupeGeometry, profileVolume } from './oceania-coupe';

describe('Oceania coupe', () => {
  it('sizes the usable bowl for the catalogue, excluding stem and ten percent headroom', () => {
    const count = countryGroups.find(({ id }) => id === 'oceania')!.countries.length;
    expect(oceaniaCoupe.capacity).toBe(count);
    expect(count).toBe(14);
    const { width, height, depth } = jellyParameters.surface;
    const jellyVolume = width * height * depth * glassParameters.jellyScale ** 3;
    expect((oceaniaCoupe.usableVolume * oceaniaCoupe.packingFraction) / jellyVolume).toBeCloseTo(
      count,
    );
    const usable = [
      ...oceaniaCoupe.profile.filter(({ height }) => height < oceaniaCoupe.ceiling),
      { height: oceaniaCoupe.ceiling, radius: coupeWallAt(oceaniaCoupe.ceiling).radius },
    ];
    expect(profileVolume(usable) / oceaniaCoupe.bowlVolume).toBeCloseTo(0.9);
  });

  it('has an open bowl above a solid stem and grounded foot', () => {
    const geometry = createCoupeGeometry();
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 5, 0), new THREE.Vector3(0, -1, 0));
    expect(ray.intersectObject(mesh)[0].point.y).toBeCloseTo(oceaniaCoupe.floor);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.y).toBe(0);
    expect(geometry.boundingBox!.max.y).toBeCloseTo(
      oceaniaCoupe.height + glassParameters.wallThickness / 2,
    );
    geometry.dispose();
    material.dispose();
  });

  it.each([1, 7, 14])('settles %i jellies inside the curved bowl', (count) => {
    const pile = createJellyPile();
    const { width, height, depth } = jellyParameters.surface;
    const scale = glassParameters.jellyScale;
    const bodies: ReturnType<typeof createSoftBody>[] = [];
    for (let index = 0; index < count; index++) {
      const angle = index * pileParameters.dropAngle;
      const radius =
        Math.max(
          0,
          coupeWallAt(oceaniaCoupe.ceiling - height * scale).radius -
            (Math.hypot(width, depth) * scale) / 2 -
            pileParameters.wallClearance,
        ) * Math.sqrt((index * pileParameters.dropRadiusStep) % 1);
      const body = createSoftBody(width * scale, height * scale, depth * scale, [], {
        origin: new THREE.Vector3(
          Math.sin(angle) * radius,
          oceaniaCoupe.ceiling - (height * scale) / 2 - 0.02,
          Math.cos(angle) * radius,
        ),
        radius: oceaniaCoupe.innerRadius,
        floor: oceaniaCoupe.floor,
        ceiling: oceaniaCoupe.ceiling,
        wallAt: (height) => {
          const wall = coupeWallAt(height);
          return { ...wall, radius: wall.radius - pileParameters.wallClearance };
        },
      });
      pile.add(body);
      bodies.push(body);
      for (let frame = 0; frame < 15; frame++) {
        pile.update(1 / 60);
      }
    }
    const expectCalm = () => {
      for (let frame = 0; frame < 1200; frame++) {
        pile.update(1 / 60);
      }
      const before = bodies.map((body) => body.positions.map((point) => point.clone()));
      let drift = 0;
      for (let frame = 0; frame < 300; frame++) {
        pile.update(1 / 60);
        for (const [index, body] of bodies.entries()) {
          for (const [j, point] of body.positions.entries()) {
            drift = Math.max(drift, point.distanceTo(before[index][j]));
          }
        }
      }
      // Less than 2% of a jelly's width across five seconds, including every frame.
      expect(drift).toBeLessThan(width * scale * 0.02);
    };
    expectCalm();
    if (count === 14) {
      const grabbed = bodies[bodies.length - 1];
      const point = grabbed.positions[0].clone();
      grabbed.beginGrab(point);
      grabbed.moveGrab(point.clone().add(new THREE.Vector3(0.15, 0.15, 0)));
      for (let frame = 0; frame < 30; frame++) {
        pile.update(1 / 60);
      }
      expect(grabbed.isSleeping()).toBe(false);
      expect(grabbed.positions[0].distanceTo(point)).toBeGreaterThan(0.01);
      grabbed.endGrab();
      expectCalm();
      const removed = bodies.shift()!;
      pile.remove(removed);
      expectCalm();
    }
    for (const body of bodies) {
      for (const local of body.positions) {
        const point = local.clone().add(body.container!.origin);
        expect(Number.isFinite(point.length())).toBe(true);
        expect(point.y).toBeGreaterThanOrEqual(oceaniaCoupe.floor - 1e-6);
        expect(point.y).toBeLessThanOrEqual(oceaniaCoupe.ceiling + 1e-6);
        expect(Math.hypot(point.x, point.z)).toBeLessThanOrEqual(
          coupeWallAt(point.y).radius - pileParameters.wallClearance + 1e-6,
        );
      }
    }
    pile.dispose();
  });
});
