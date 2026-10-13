import * as THREE from 'three';
import { GlassShape } from './glass-definitions';
import type { IGlassDefinition } from './glass-definitions';
import { createGlassGeometry } from './glass-geometry';
import { createGlassMaterial } from './glass-material';
import { createArtworkGeometry } from './glass-artwork';
import { glassDimensions, glassParameters } from './glass-parameters';
import {
  createCoupeGeometry,
  createCoupeArtworkGeometry,
  createCoupeWordGeometry,
  oceaniaCoupe,
} from './oceania-coupe';

interface IMeshPlacement {
  geometry: THREE.BufferGeometry;
  y: number;
  rotationX?: number;
}

// One owned resource set per resolved definition, shared by vessels with identical dimensions.
export const createGlassResources = (definition: IGlassDefinition) => {
  let geometry: THREE.BufferGeometry;
  let markings: IMeshPlacement[];
  const accents: IMeshPlacement[] = [];
  switch (definition.shape) {
    case GlassShape.Coupe:
      geometry = createCoupeGeometry();
      markings = [
        { geometry: createCoupeArtworkGeometry(), y: 0 },
        {
          geometry: createCoupeWordGeometry(),
          y: oceaniaCoupe.floor + (oceaniaCoupe.height - oceaniaCoupe.floor) * 0.2,
        },
      ];
      accents.push(
        {
          geometry: new THREE.TorusGeometry(oceaniaCoupe.footRadius - 0.012, 0.022, 10, 96),
          y: 0.05,
          rotationX: Math.PI / 2,
        },
        {
          geometry: new THREE.TorusGeometry(0.12, 0.026, 10, 48),
          y: definition.floor - 0.1,
          rotationX: Math.PI / 2,
        },
        {
          geometry: new THREE.CylinderGeometry(0.033, 0.045, definition.floor - 0.26, 24),
          y: (definition.floor - 0.26) / 2 + 0.13,
        },
      );
      break;
    case GlassShape.Highball: {
      geometry = createGlassGeometry({
        ...glassDimensions,
        outerRadius: definition.outerRadius,
        outerHeight: definition.height,
        interiorDiameter: definition.innerRadius * 2,
      });
      // Keep each continent SVG's map and lettering together at their original aspect ratio.
      const artworkSize = definition.innerRadius * 2.05;
      markings = [
        {
          geometry: createArtworkGeometry(
            artworkSize,
            artworkSize,
            definition.outerRadius + definition.artworkOffset,
          ),
          y: definition.height * 0.57,
        },
      ];
      break;
    }
    case GlassShape.Cylinder:
      geometry = createGlassGeometry();
      markings = [
        {
          geometry: createArtworkGeometry(),
          y: definition.height * glassParameters.artwork.centreHeight,
        },
      ];
      break;
  }
  const material = createGlassMaterial(definition.height);
  const rim = new THREE.TorusGeometry(
    definition.innerRadius + glassParameters.wallThickness / 2,
    0.012,
    8,
    96,
  );
  return {
    geometry,
    material,
    markings,
    accents,
    rim,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      rim.dispose();
      markings.forEach(({ geometry }) => geometry.dispose());
      accents.forEach(({ geometry }) => geometry.dispose());
    },
  };
};
