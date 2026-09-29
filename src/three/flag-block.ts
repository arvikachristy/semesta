import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createFlag } from './flag';

export const blockHeight = 1.6;

export const createFlagBlock = () => {
  // The flag remains its existing extruded mesh, centred inside the volume.
  const flag = createFlag();
  flag.object.position.set(0, 0, 0);
  flag.object.rotation.set(0, 0, 0);

  // Round the corners, then gently inflate the faces while keeping a rectangular outline.
  const rounded = new RoundedBoxGeometry(2.4, blockHeight, 0.85, 6, 0.3);
  rounded.deleteAttribute('normal');
  rounded.deleteAttribute('uv');
  const geometry = mergeVertices(rounded);
  rounded.dispose();
  const positions = geometry.getAttribute('position');
  const bulge = 0.26;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const u = x / 1.2;
    const v = y / (blockHeight / 2);
    const face = (1 - u * u) * (1 - v * v);
    positions.setXYZ(
      index,
      x * (1 + 0.055 * (1 - v * v)) + 0.018 * v * v,
      y,
      z * (1 + bulge * face) + 0.018 * u * (1 - v * v),
    );
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  // Native Fresnel and thin-film iridescence give grazing edges a restrained colour shift.
  const material = new THREE.MeshPhysicalMaterial({
    color: '#fff8f6',
    metalness: 0,
    roughness: 0.12,
    transmission: 1,
    thickness: 0.38,
    ior: 1.32,
    iridescence: 0.38,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [180, 340],
    clearcoat: 0.25,
    clearcoatRoughness: 0.22,
    attenuationColor: '#f7e2df',
    attenuationDistance: 3,
  });
  // A restrained artistic rim supplements physical iridescence in the flat, HDR-free scene.
  // Use view-space normals: facing surfaces stay clear and grazing edges catch colour.
  const edgeStrength = 0.42;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.edgeStrength = { value: edgeStrength };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float edgeStrength;')
      .replace(
        '#include <opaque_fragment>',
        `
        float rim = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.0);
        vec3 rimTint = mix(vec3(0.24, 0.62, 0.68), vec3(0.72, 0.30, 0.52), normal.y * 0.5 + 0.5);
        outgoingLight = mix(outgoingLight, rimTint, rim * edgeStrength);
        #include <opaque_fragment>
        `,
      );
  };
  const outer = new THREE.Mesh(geometry, material);

  const object = new THREE.Group();
  object.add(flag.object, outer);
  object.position.y = blockHeight / 2;

  // Only the shell breathes. Anchor its bottom so it never moves through the floor.
  const update = (time: number, hover: number) => {
    const breath = Math.sin(time * 0.85) * 0.006;
    outer.scale.set(1 + breath, 1 - breath * 0.6, 1 + breath * 1.4 + hover * 0.015);
    outer.position.y = ((outer.scale.y - 1) * blockHeight) / 2;
  };

  const dispose = () => {
    flag.dispose();
    geometry.dispose();
    material.dispose();
    object.clear();
  };

  return { object, setCountry: flag.setCountry, update, dispose };
};
