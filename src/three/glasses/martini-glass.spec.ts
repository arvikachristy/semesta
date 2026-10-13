import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ContinentId } from '../../types/continent';
import { createSoftBody } from '../jelly-flags/jelly-soft-body';
import { createJellyPile, pileParameters } from '../jelly-flags/jelly-pile';
import { jellyParameters } from '../jelly-flags/jelly-parameters';
import { getGlassDefinition, GlassShape } from './glass-definitions';
import { glassParameters } from './glass-parameters';
import { northAmericaMartini, martiniWallAt } from './martini-glass';
import { profileVolume } from './oceania-coupe';
import { createStemmedGlassGeometry } from './stemmed-geometry';

const martini = getGlassDefinition(ContinentId.NorthAmerica);

describe('North America martini', () => {
  it('sizes usable bowl volume for 23 countries with the shared packing allowance', () => {
    const coupe = getGlassDefinition(ContinentId.Oceania);
    expect(martini.shape).toBe(GlassShape.Martini);
    expect(martini.capacity).toBe(23);
    expect(martini.usableVolume / coupe.usableVolume).toBeCloseTo(23 / 14);
    const usable = [
      ...northAmericaMartini.profile.filter(({ height }) => height < martini.ceiling),
      { height: martini.ceiling, radius: martiniWallAt(martini.ceiling).radius },
    ];
    expect(profileVolume(usable) / martini.bowlVolume).toBeCloseTo(0.9);
  });

  it('has an open lip and a bowl floor above the stem', () => {
    const geometry = createStemmedGlassGeometry(northAmericaMartini);
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 5, 0), new THREE.Vector3(0, -1, 0));
    expect(ray.intersectObject(mesh)[0].point.y).toBeCloseTo(martini.floor);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.y).toBe(0);
    expect(geometry.boundingBox!.max.y).toBeCloseTo(martini.height);
    geometry.dispose();
    material.dispose();
  });

  it('settles all 23 jellies inside the sloping bowl', () => {
    const pile = createJellyPile();
    const { width, height, depth } = jellyParameters.surface;
    const scale = glassParameters.jellyScale;
    const bodies: ReturnType<typeof createSoftBody>[] = [];
    for (let index = 0; index < martini.capacity; index++) {
      const angle = index * pileParameters.dropAngle;
      const radius =
        Math.max(
          0,
          martiniWallAt(martini.ceiling - height * scale).radius -
            (Math.hypot(width, depth) * scale) / 2 -
            pileParameters.wallClearance,
        ) * Math.sqrt((index * pileParameters.dropRadiusStep) % 1);
      const body = createSoftBody(width * scale, height * scale, depth * scale, [], {
        origin: new THREE.Vector3(
          Math.sin(angle) * radius,
          martini.ceiling - (height * scale) / 2 - 0.02,
          Math.cos(angle) * radius,
        ),
        radius: martini.innerRadius - pileParameters.wallClearance,
        floor: martini.floor,
        ceiling: martini.ceiling,
        wallAt: (height) => {
          const wall = martiniWallAt(height);
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
        expect(point.y).toBeGreaterThanOrEqual(martini.floor - 1e-6);
        expect(point.y).toBeLessThanOrEqual(martini.ceiling + 1e-6);
        expect(Math.hypot(point.x, point.z)).toBeLessThanOrEqual(
          martiniWallAt(point.y).radius - pileParameters.wallClearance + 1e-6,
        );
      }
    }
    expect(pile.getAwakeCount()).toBe(0);
    pile.dispose();
  });
});
