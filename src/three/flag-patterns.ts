import * as THREE from 'three';
import { CountryCode, type TCountryCode } from '../types/country';
import { flags } from './flags';

// Generated once per country. Surface UVs are baked from REST coordinates, never current position.
export const createFlagPattern = async (code: TCountryCode) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create flag artwork');
  }
  if (code === CountryCode.ID) {
    context.fillStyle = '#ff0000';
    context.fillRect(0, 0, 512, 256);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 256, 512, 256);
  } else if (code === CountryCode.FR) {
    for (const [i, color] of ['#0055A4', '#ffffff', '#EC1920'].entries()) {
      context.fillStyle = color;
      context.fillRect((i * 512) / 3, 0, 512 / 3 + 1, 512);
    }
  } else {
    // Preserve Nepal's existing SVG artwork and its non-rectangular silhouette in the pattern.
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = flags[code].artwork;
    await image.decode();
    context.fillStyle = '#f7b8cb';
    context.fillRect(0, 0, 512, 512);
    context.drawImage(image, 20, 20, 472, 472);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};
