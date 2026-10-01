import * as THREE from 'three';
import type { TCountryCode } from '../types/country';
import { flags } from './flags';

const textureHeight = 512;

// Surface UVs are baked from rest coordinates, never current position.
export const createFlagPattern = async (code: TCountryCode) => {
  const { pattern, size } = flags[code];
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(textureHeight * (size.width / size.height));
  canvas.height = textureHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create flag artwork');
  }
  const { width, height } = canvas;
  switch (pattern.type) {
    case 'stripes': {
      const horizontal = pattern.orientation === 'horizontal';
      const extent = horizontal ? height : width;
      for (const [index, color] of pattern.colors.entries()) {
        const start = Math.round((index * extent) / pattern.colors.length);
        const end = Math.round(((index + 1) * extent) / pattern.colors.length);
        context.fillStyle = color;
        context.fillRect(
          horizontal ? 0 : start,
          horizontal ? start : 0,
          horizontal ? width : end - start,
          horizontal ? end - start : height,
        );
      }
      break;
    }
    case 'svg': {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = pattern.src;
      await image.decode();
      context.fillStyle = pattern.background;
      context.fillRect(0, 0, width, height);
      context.drawImage(
        image,
        width * pattern.inset,
        height * pattern.inset,
        width * (1 - 2 * pattern.inset),
        height * (1 - 2 * pattern.inset),
      );
      break;
    }
    default: {
      const unsupported: never = pattern;
      throw new Error(`Unsupported flag pattern: ${String(unsupported)}`);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};
