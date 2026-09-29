import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createFlag } from './flag';

export const blockHeight = 1.6;

export const createFlagBlock = () => {
  // The flag remains its existing extruded mesh, centred inside the volume.
  const flag = createFlag();
  flag.object.position.set(0, 0, 0);
  flag.object.rotation.set(0, 0, 0);

  // A few segments round the physical edges without making a dense mesh.
  const geometry = new RoundedBoxGeometry(2.4, blockHeight, 0.85, 3, 0.17);
  const material = new THREE.MeshPhysicalMaterial({
    color: '#fff8f6',
    metalness: 0,
    roughness: 0.1,
    transmission: 1,
    thickness: 0.2,
    ior: 1.1,
    attenuationColor: '#f7e2df',
    attenuationDistance: 3,
  });
  const outer = new THREE.Mesh(geometry, material);

  const object = new THREE.Group();
  object.add(flag.object, outer);
  object.position.y = blockHeight / 2;

  const dispose = () => {
    flag.dispose();
    geometry.dispose();
    material.dispose();
    object.clear();
  };

  return { object, setCountry: flag.setCountry, dispose };
};
