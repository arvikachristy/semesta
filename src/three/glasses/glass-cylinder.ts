import * as THREE from 'three';
import { createGlassGeometry, glassCylinderSize } from './glass-geometry';
import { createGlassMaterial } from './glass-material';

export const createGlassCylinder = () => {
  const object = new THREE.Mesh(createGlassGeometry(), createGlassMaterial());
  object.position.set(0, glassCylinderSize.height / 2, 0.8);

  return {
    object,
    dispose: () => {
      object.geometry.dispose();
      object.material.dispose();
    },
  };
};
