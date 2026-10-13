import * as THREE from 'three';
import { glassDimensions, glassParameters } from './glass-parameters';

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
  return new THREE.Color(glassParameters.gradient.bottomColor).lerp(
    new THREE.Color(glassParameters.gradient.clearColor),
    blend,
  );
};

// Transmission keeps the object optically clear while thickness adds refraction.
export const createGlassMaterial = (height = glassDimensions.outerHeight) => {
  const material = new THREE.MeshPhysicalMaterial({
    color: glassParameters.gradient.clearColor,
    metalness: 0,
    roughness: 0.025,
    transmission: 1,
    // Alpha blending also reveals the transmissive jellies omitted from the WebGL transmission buffer.
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    thickness: glassParameters.wallThickness,
    ior: 1.45,
    attenuationColor: glassParameters.gradient.clearColor,
    attenuationDistance: 10,
    envMapIntensity: 0.2,
    clearcoat: 0.1,
    clearcoatRoughness: 0.04,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.glassBottomTint = {
      value: new THREE.Color(glassParameters.gradient.bottomColor),
    };
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
