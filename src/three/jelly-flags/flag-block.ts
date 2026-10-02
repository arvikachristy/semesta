import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createFlagPattern } from './flag-patterns';
import { createJellyMaterial } from './jelly-material';
import type { TCountryCode } from '../flags';
import { createSoftBody } from './jelly-soft-body';
import { jellyParameters } from './jelly-parameters';

export const blockHeight = jellyParameters.surface.height;

export const createFlagBlock = () => {
  const object = new THREE.Group();
  const bounds = Array.from({ length: 6 }, () => new THREE.Plane());
  const inverseWorld = new THREE.Matrix4();
  let body: ReturnType<typeof createSoftBody>;
  let surface: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial> | null = null;
  let updateSurface: (() => void) | null = null;
  let updateThickness: (() => void) | null = null;
  let request = 0;
  let disposed = false;
  let country: TCountryCode | null = null;

  const setCountry = async (code: TCountryCode) => {
    const currentRequest = ++request;

    if (country === code) {
      return;
    }

    const texture = await createFlagPattern(code);
    if (disposed || currentRequest !== request) {
      texture.dispose();
      return;
    }
    country = code;

    const { width, depth, radius, segments } = jellyParameters.surface;

    const rounded = new RoundedBoxGeometry(width, blockHeight, depth, segments, radius);
    rounded.deleteAttribute('normal');
    rounded.deleteAttribute('uv');

    const geometry = mergeVertices(rounded);
    rounded.dispose();
    geometry.computeVertexNormals();

    const positions = geometry.getAttribute('position');
    const uv = new Float32Array(positions.count * 2);
    const probes = new THREE.BufferAttribute(new Float32Array(positions.count * 6), 3);
    const thickness = new THREE.BufferAttribute(new Float32Array(positions.count), 1);

    for (let i = 0; i < positions.count; i++) {
      uv[i * 2] = positions.getX(i) / width + 0.5;
      uv[i * 2 + 1] = positions.getY(i) / blockHeight + 0.5;
      probes.setXYZ(i * 2, positions.getX(i), positions.getY(i), -depth / 2);
      probes.setXYZ(i * 2 + 1, positions.getX(i), positions.getY(i), depth / 2);
    }

    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geometry.setAttribute('jellyThickness', thickness);
    body = createSoftBody(width, blockHeight, depth, bounds);
    updateSurface = body.bind(positions);
    const updateProbes = body.bind(probes);
    updateThickness = () => {
      updateProbes();
      for (let i = 0; i < positions.count; i++) {
        thickness.setX(
          i,
          Math.hypot(
            probes.getX(i * 2) - probes.getX(i * 2 + 1),
            probes.getY(i * 2) - probes.getY(i * 2 + 1),
            probes.getZ(i * 2) - probes.getZ(i * 2 + 1),
          ),
        );
      }
      thickness.needsUpdate = true;
    };
    if (surface) {
      object.remove(surface);
      surface.geometry.dispose();
      surface.material.map?.dispose();
      surface.material.dispose();
    }
    surface = new THREE.Mesh(geometry, createJellyMaterial(texture));
    updateThickness();
    surface.castShadow = true;
    object.add(surface);
  };
  const update = (delta: number) => {
    if (!surface) {
      return;
    }
    body.update(delta);
    updateSurface?.();
    updateThickness?.();
    surface.geometry.computeVertexNormals();
    surface.geometry.computeBoundingSphere();
  };
  const dispose = () => {
    disposed = true;
    request++;
    surface?.material.map?.dispose();
    surface?.geometry.dispose();
    surface?.material.dispose();
    object.clear();
  };
  return {
    object,
    setBounds: (worldPlanes: THREE.Plane[]) => {
      object.updateWorldMatrix(true, false);
      inverseWorld.copy(object.matrixWorld).invert();
      worldPlanes.forEach((plane, index) => bounds[index].copy(plane).applyMatrix4(inverseWorld));
    },
    setCountry,
    update,
    dispose,
    beginGrab: (point: THREE.Vector3) => body?.beginGrab(point),
    moveGrab: (point: THREE.Vector3) => body?.moveGrab(point),
    endGrab: (jump = false) => body?.endGrab(jump),
  };
};
