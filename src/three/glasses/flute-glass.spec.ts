import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ContinentId } from '../../types/continent';
import { createSoftBody } from '../jelly-flags/jelly-soft-body';
import { createJellyPile, pileParameters } from '../jelly-flags/jelly-pile';
import { jellyParameters } from '../jelly-flags/jelly-parameters';
import { fluteWallAt, southAmericaFlute } from './flute-glass';
import { getGlassDefinition, GlassShape } from './glass-definitions';
import { glassParameters } from './glass-parameters';
import { profileVolume } from './glass-profile';
import { createStemmedGlassGeometry } from './stemmed-geometry';

const flute = getGlassDefinition(ContinentId.SouthAmerica);

describe('South America flute', () => {
  it('reserves 10% headroom and gives 12 countries their proportional bowl volume', () => {
    const coupe = getGlassDefinition(ContinentId.Oceania);
    expect(flute.shape).toBe(GlassShape.Flute);
    expect(flute.capacity).toBe(12);
    expect(flute.usableVolume / coupe.usableVolume).toBeCloseTo(12 / 14);
    const usable = [
      ...southAmericaFlute.profile.filter(({ height }) => height < flute.ceiling),
      { height: flute.ceiling, radius: fluteWallAt(flute.ceiling).radius },
    ];
    expect(profileVolume(usable) / flute.bowlVolume).toBeCloseTo(0.9);
    expect(flute.height / (flute.innerRadius * 2)).toBeGreaterThan(2.3);
  });

  it('has an open rim and a bowl floor above the stem', () => {
    const geometry = createStemmedGlassGeometry(southAmericaFlute);
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 6, 0), new THREE.Vector3(0, -1, 0));
    expect(ray.intersectObject(mesh)[0].point.y).toBeCloseTo(flute.floor);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.y).toBe(0);
    expect(geometry.boundingBox!.max.y).toBeCloseTo(flute.height);
    geometry.dispose();
    material.dispose();
  });

  it('settles all 12 jellies inside the flute profile', () => {
    const pile = createJellyPile();
    const { width, height, depth } = jellyParameters.surface;
    const scale = glassParameters.jellyScale;
    const bodies: ReturnType<typeof createSoftBody>[] = [];
    for (let index = 0; index < flute.capacity; index++) {
      const angle = index * pileParameters.dropAngle;
      const radius =
        Math.max(
          0,
          fluteWallAt(flute.ceiling - height * scale).radius -
            (Math.hypot(width, depth) * scale) / 2 -
            pileParameters.wallClearance,
        ) * Math.sqrt((index * pileParameters.dropRadiusStep) % 1);
      const body = createSoftBody(width * scale, height * scale, depth * scale, [], {
        origin: new THREE.Vector3(
          Math.sin(angle) * radius,
          flute.ceiling - (height * scale) / 2 - 0.02,
          Math.cos(angle) * radius,
        ),
        radius: flute.innerRadius - pileParameters.wallClearance,
        floor: flute.floor,
        ceiling: flute.ceiling,
        wallAt: (height) => {
          const wall = fluteWallAt(height);
          return { ...wall, radius: wall.radius - pileParameters.wallClearance };
        },
      });
      bodies.push(body);
      pile.add(body);
      for (let frame = 0; frame < 15; frame++) {
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
        expect(point.y).toBeGreaterThanOrEqual(flute.floor - 1e-6);
        expect(point.y).toBeLessThanOrEqual(flute.ceiling + 1e-6);
        expect(Math.hypot(point.x, point.z)).toBeLessThanOrEqual(
          fluteWallAt(point.y).radius - pileParameters.wallClearance + 1e-6,
        );
      }
    }
    expect(pile.getAwakeCount()).toBe(0);
    pile.dispose();
  });
});
