import * as THREE from 'three';
import { glassDimensions, glassParameters } from './glass-parameters';
import { readScenePalette } from '../theme';

const shaderIncludes = {
  common: '#include <common>',
  vertex: '#include <begin_vertex>',
  color: '#include <color_fragment>',
};

export const getGlassTint = (height: number) => {
  const blend = THREE.MathUtils.smoothstep(
    height / glassDimensions.outerHeight,
    0,
    glassParameters.gradient.fadeHeight,
  );
  const palette = readScenePalette();
  return new THREE.Color(palette.glassBottom).lerp(new THREE.Color(palette.glassClear), blend);
};

// Transmission keeps the object optically clear while thickness adds refraction.
export const createGlassMaterial = (height = glassDimensions.outerHeight) => {
  const palette = readScenePalette();
  const glassBottomTint = new THREE.Color(palette.glassBottom);
  const material = new THREE.MeshPhysicalMaterial({
    color: palette.glassClear,
    metalness: 0,
    roughness: 0.025,
    transmission: 1,
    // Alpha blending also reveals the transmissive jellies omitted from the WebGL transmission buffer.
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    thickness: glassParameters.wallThickness,
    ior: 1.45,
    attenuationColor: palette.glassClear,
    attenuationDistance: 10,
    envMapIntensity: 0.2,
    clearcoat: 0.1,
    clearcoatRoughness: 0.04,
  });
  material.userData.themeGlass = true;
  material.userData.glassBottomTint = glassBottomTint;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.glassBottomTint = { value: glassBottomTint };
    shader.uniforms.glassFadeHeight = { value: glassParameters.gradient.fadeHeight };
    shader.uniforms.glassHeight = { value: height };
    shader.vertexShader = shader.vertexShader
      .replace(
        shaderIncludes.common,
        shaderIncludes.common + '\nvarying float vGlassHeight;\nuniform float glassHeight;',
      )
      .replace(
        shaderIncludes.vertex,
        shaderIncludes.vertex + '\nvGlassHeight = position.y / glassHeight;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        shaderIncludes.common,
        shaderIncludes.common +
          '\nvarying float vGlassHeight;\nuniform vec3 glassBottomTint;\nuniform float glassFadeHeight;',
      )
      .replace(
        shaderIncludes.color,
        shaderIncludes.color +
          '\ndiffuseColor.rgb *= mix(glassBottomTint, vec3(1.0), smoothstep(0.0, glassFadeHeight, vGlassHeight));',
      );
  };
  return material;
};
