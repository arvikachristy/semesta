import * as THREE from 'three';
import { jellyParameters } from './jelly-parameters';
import { readScenePalette } from '../scene-palette';
import type { IScenePalette } from '../scene-palette';

// The thickness attribute is measured between embedded front/back volume probes each frame.
// This is a local-volume approximation, not a screen-space back-depth render pass.
export const createJellyMaterial = (pattern: THREE.Texture, scale = 1) => {
  const p = jellyParameters.material;
  const material = new THREE.MeshPhysicalMaterial({
    map: pattern,
    roughness: p.roughness,
    transmission: p.transmission,
    ior: p.ior,
    thickness: jellyParameters.surface.depth * scale,
    metalness: 0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.25,
    envMapIntensity: 0.45,
    attenuationColor: readScenePalette().jellyTint,
    attenuationDistance: 1 / p.absorption,
  });
  material.userData.semestaJelly = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.jellyAbsorption = { value: p.absorption / scale };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float jellyThickness;\nvarying float vJellyThickness;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvJellyThickness = jellyThickness;',
      );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      '#include <common>\nvarying float vJellyThickness;\nuniform float jellyAbsorption;',
    );
    const transmission = THREE.ShaderChunk.transmission_fragment
      .replace(
        'material.thickness = thickness;',
        'material.thickness = clamp(vJellyThickness, 0.015, 0.6);',
      )
      .replace(
        'material.attenuationColor = attenuationColor;',
        'material.attenuationColor = mix(vec3(1.0), diffuseColor.rgb, 0.65);',
      );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <transmission_fragment>',
      transmission +
        `
      // Beer-Lambert colour density: thinner stretched regions transmit more light.
      float density = 1.0 - exp(-jellyAbsorption * max(vJellyThickness, 0.0));
      vec3 absorption = exp(-(vec3(1.0) - diffuseColor.rgb) * jellyAbsorption * vJellyThickness);
      totalDiffuse *= absorption;
      totalDiffuse = mix(totalDiffuse + (vec3(1.0) - diffuseColor.rgb) * 0.055, totalDiffuse, density);
    `,
    );
  };
  return material;
};

export const updateJellyMaterial = (material: THREE.MeshPhysicalMaterial, palette: IScenePalette) => {
  if (material.userData.semestaJelly === true) {
    material.attenuationColor.set(palette.jellyTint);
  }
};
