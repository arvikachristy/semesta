import * as THREE from 'three';
import { getTheme } from '../styles/theme';

export interface IScenePalette {
  world: string;
  shadow: string;
  environment: string;
  reflectionWarm: string;
  reflectionCool: string;
  reflectionNeutral: string;
  glassBottom: string;
  glassClear: string;
  glassMetal: string;
  jellyTint: string;
}

// All scene colours come from the same active CSS theme used by React.
const sceneTokens = {
  world: '--color-world',
  shadow: '--scene-shadow',
  environment: '--scene-environment',
  reflectionWarm: '--scene-reflection-warm',
  reflectionCool: '--scene-reflection-cool',
  reflectionNeutral: '--scene-reflection-neutral',
  glassBottom: '--scene-glass-bottom',
  glassClear: '--scene-glass-clear',
  glassMetal: '--scene-glass-metal',
  jellyTint: '--scene-jelly-tint',
} as const;

let cachedTheme: string | null = null;
let cachedPalette: IScenePalette | null = null;

export const readScenePalette = (): IScenePalette => {
  const theme = getTheme();
  if (cachedTheme === theme && cachedPalette) {
    return cachedPalette;
  }
  const styles = typeof document === 'undefined' ? null : getComputedStyle(document.documentElement);
  const read = (name: string) => {
    const value = styles?.getPropertyValue(name).trim();
    if (value) {
      return value;
    }
    // Headless Three.js geometry tests don't mount the app's stylesheets.
    if (import.meta.env.MODE === 'test') {
      return '#ffffff';
    }
    throw new Error(`Missing required Semesta theme colour: ${name}`);
  };
  const result = {
    world: read(sceneTokens.world),
    shadow: read(sceneTokens.shadow),
    environment: read(sceneTokens.environment),
    reflectionWarm: read(sceneTokens.reflectionWarm),
    reflectionCool: read(sceneTokens.reflectionCool),
    reflectionNeutral: read(sceneTokens.reflectionNeutral),
    glassBottom: read(sceneTokens.glassBottom),
    glassClear: read(sceneTokens.glassClear),
    glassMetal: read(sceneTokens.glassMetal),
    jellyTint: read(sceneTokens.jellyTint),
  };
  cachedTheme = theme;
  cachedPalette = result;
  return result;
};

// Material identity and jelly physics survive a theme switch.
export const recolorSceneMaterials = (scene: THREE.Scene, palette: IScenePalette) => {
  const visited = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return;
    }
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (visited.has(material)) {
        continue;
      }
      visited.add(material);
      if (material instanceof THREE.MeshPhysicalMaterial) {
        if (material.userData.themeGlass) {
          material.color.set(palette.glassClear);
          material.attenuationColor.set(palette.glassClear);
          const tint = material.userData.glassBottomTint;
          if (tint instanceof THREE.Color) {
            tint.set(palette.glassBottom);
          }
        } else if (material.userData.themeJelly) {
          material.attenuationColor.set(palette.jellyTint);
        }
      }
      if (material instanceof THREE.MeshStandardMaterial && material.userData.themeGold) {
        material.color.set(palette.glassMetal);
      }
    }
  });
};
