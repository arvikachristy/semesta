import * as THREE from 'three';
import { glassParameters } from './glass-parameters';

const glassColors = { clear: '#ffffff' };

// Transmission keeps the object optically clear while thickness adds refraction.
export const createGlassMaterial = () =>
  new THREE.MeshPhysicalMaterial({
    color: glassColors.clear,
    metalness: 0,
    roughness: 0.025,
    transmission: 1,
    // Alpha blending also reveals the transmissive jellies omitted from the WebGL transmission buffer.
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    thickness: glassParameters.wallThickness,
    ior: 1.45,
    attenuationColor: glassColors.clear,
    attenuationDistance: 10,
    envMapIntensity: 0.2,
    clearcoat: 0.1,
    clearcoatRoughness: 0.04,
  });
