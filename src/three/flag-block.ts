import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createFlag } from './flag';
import { flags } from './flags';
import type { TCountryCode } from './flags';

export const blockHeight = 1.32;

export const createFlagBlock = () => {
  // The flag remains its existing extruded mesh, centred inside the volume.
  const flag = createFlag();
  flag.object.position.set(0, 0, 0);
  flag.object.rotation.set(0, 0, 0);

  // Round the corners, then gently inflate the faces while keeping a rectangular outline.
  const rounded = new RoundedBoxGeometry(1.86, blockHeight, 0.72, 8, 0.14);
  rounded.deleteAttribute('normal');
  rounded.deleteAttribute('uv');
  const geometry = mergeVertices(rounded);
  rounded.dispose();
  const positions = geometry.getAttribute('position');
  const bulge = 0.1;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const u = x / 0.93;
    const v = y / (blockHeight / 2);
    const face = (1 - u * u) * (1 - v * v);
    // Small cast-surface ripples break up edge reflections, keeping the centre clear.
    const ripple = 0.012 * (u * u + v * v) * Math.sin(11 * u + 7 * v) * Math.cos(9 * v - 3 * u);
    positions.setXYZ(
      index,
      x * (1 + 0.018 * (1 - v * v)) + 0.018 * v * v,
      y,
      z * (1 + bulge * face) + 0.018 * u * (1 - v * v) + ripple,
    );
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  // Native Fresnel and thin-film iridescence give grazing edges a restrained colour shift.
  const material = new THREE.MeshPhysicalMaterial({
    color: '#fff4fa',
    metalness: 0,
    envMapIntensity: 0.65,
    roughness: 0.035,
    transmission: 1,
    thickness: 0.22,
    ior: 1.46,
    iridescence: 0.55,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [220, 420],
    clearcoat: 1,
    clearcoatRoughness: 0.045,
    attenuationColor: '#ff80b5',
    attenuationDistance: 1.8,
  });
  const outer = new THREE.Mesh(geometry, material);

  const object = new THREE.Group();
  object.add(flag.object, outer);
  object.position.y = blockHeight / 2;

  let widthScale = 1;
  const setCountry = (code: TCountryCode) => {
    // Keep a narrow resin margin around the selected flag without scaling its artwork.
    widthScale = (flags[code].aspectRatio + 0.36) / 1.86;
    return flag.setCountry(code);
  };

  // Only the shell breathes. Anchor its bottom so it never moves through the floor.
  const update = (time: number, hover: number) => {
    const breath = Math.sin(time * 0.85) * 0.006;
    outer.scale.set(widthScale * (1 + breath), 1 - breath * 0.6, 1 + breath * 1.4 + hover * 0.015);
    outer.position.y = ((outer.scale.y - 1) * blockHeight) / 2;
  };

  const dispose = () => {
    flag.dispose();
    geometry.dispose();
    material.dispose();
    object.clear();
  };

  return { object, setCountry, update, dispose };
};
