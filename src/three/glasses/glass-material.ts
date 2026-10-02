import * as THREE from 'three';

// Transmission keeps the object optically clear while thickness adds refraction.
export const createGlassMaterial = () =>
  new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0,
    roughness: 0.025,
    transmission: 1,
    thickness: 0.65,
    ior: 1.45,
    attenuationColor: '#ffffff',
    attenuationDistance: 10,
    envMapIntensity: 0.2,
    clearcoat: 0.1,
    clearcoatRoughness: 0.04,
  });
