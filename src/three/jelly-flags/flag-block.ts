import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createFlagPattern } from './flag-patterns';
import { createJellyMaterial } from './jelly-material';
import type { CountryList } from '../../types/country';
import { createSoftBody } from './jelly-soft-body';
import type { IJellyContainer } from './jelly-soft-body';
import { jellyParameters } from './jelly-parameters';

export const blockHeight = jellyParameters.surface.height;

export interface IFlagBlockOptions {
  scale?: number;
  container?: Omit<IJellyContainer, 'origin'>;
}
export const createFlagBlock = ({ scale = 1, container }: IFlagBlockOptions = {}) => {
  const object = new THREE.Group();
  const bounds: THREE.Plane[] = [];
  const inverseWorld = new THREE.Matrix4();
  let body: ReturnType<typeof createSoftBody> | null = null;
  let surface: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial> | null = null;
  let updateSurface: (() => void) | null = null;
  let updateThickness: (() => void) | null = null;
  let renderedRevision = -1;
  let request = 0;
  let disposed = false;
  let country: CountryList | null = null;

  const setCountry = async (code: CountryList) => {
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

    const width = jellyParameters.surface.width * scale;
    const height = blockHeight * scale;
    const depth = jellyParameters.surface.depth * scale;
    const radius = jellyParameters.surface.radius * scale;
    const { segments } = jellyParameters.surface;

    const rounded = new RoundedBoxGeometry(width, height, depth, segments, radius);
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
      uv[i * 2 + 1] = positions.getY(i) / height + 0.5;
      probes.setXYZ(i * 2, positions.getX(i), positions.getY(i), -depth / 2);
      probes.setXYZ(i * 2 + 1, positions.getX(i), positions.getY(i), depth / 2);
    }

    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geometry.setAttribute('jellyThickness', thickness);
    body = createSoftBody(
      width,
      height,
      depth,
      bounds,
      container ? { ...container, origin: object.position } : undefined,
    );
    renderedRevision = -1;
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
    surface = new THREE.Mesh(geometry, createJellyMaterial(texture, scale));
    updateThickness();
    surface.castShadow = true;
    object.add(surface);
  };
  const update = (delta: number) => {
    if (!surface) {
      return;
    }
    body?.update(delta);
    syncSurface();
  };
  const syncSurface = () => {
    if (body && body.getRevision() === renderedRevision) {
      return false;
    }
    renderedRevision = body?.getRevision() ?? -1;
    if (!surface) {
      return false;
    }
    updateSurface?.();
    updateThickness?.();
    surface.geometry.computeVertexNormals();
    surface.geometry.computeBoundingSphere();
    return true;
  };
  const dispose = () => {
    disposed = true;
    request++;
    surface?.material.map?.dispose();
    surface?.geometry.dispose();
    surface?.material.dispose();
    object.clear();
    body = null;
  };
  return {
    object,
    setBounds: (worldPlanes: THREE.Plane[]) => {
      object.updateWorldMatrix(true, false);
      inverseWorld.copy(object.matrixWorld).invert();
      worldPlanes.forEach((plane, index) => {
        bounds[index] = (bounds[index] ?? new THREE.Plane()).copy(plane).applyMatrix4(inverseWorld);
      });
      bounds.length = worldPlanes.length;
    },
    setCountry,
    update,
    syncSurface,
    getBody: () => body,
    dispose,
    beginGrab: (point: THREE.Vector3) => body?.beginGrab(point),
    moveGrab: (point: THREE.Vector3) => body?.moveGrab(point),
    endGrab: (jump = false) => body?.endGrab(jump),
  };
};
