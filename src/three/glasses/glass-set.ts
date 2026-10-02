import * as THREE from 'three';
import { createGlassGeometry } from './glass-geometry';
import { createGlassMaterial } from './glass-material';
import { glassParameters } from './glass-parameters';

export const createGlassSet = () => {
  const object = new THREE.Group();
  const geometry = createGlassGeometry();
  const material = createGlassMaterial();

  for (let index = 0; index < glassParameters.count; index++) {
    const angle = Math.PI + (index * Math.PI * 2) / glassParameters.count;
    const glass = new THREE.Mesh(geometry, material);
    glass.position.set(
      glassParameters.circleRadius * Math.sin(angle),
      0,
      glassParameters.circleRadius * Math.cos(angle),
    );
    object.add(glass);
  }

  return {
    object,
    bounds: new THREE.Box3().setFromObject(object),
    dispose: () => {
      geometry.dispose();
      material.dispose();
      object.clear();
    },
  };
};
