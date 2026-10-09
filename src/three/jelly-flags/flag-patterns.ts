import { FlagPatternType, StripeOrientation } from '../../types/flag-pattern';
import { jellyParameters } from './jelly-parameters';
import * as THREE from 'three';
import type { CountryList } from '../../types/country';
import { countries } from '../../data/countries';

import { jellyPerformance } from './jelly-performance';
import { flagArtwork } from '../../data/flag-definitions';

const { textureHeight } = jellyPerformance;

// Surface UVs are baked from rest coordinates, never current position.
export const createFlagPattern = async (code: CountryList) => {
  const { pattern, size } = countries[code];
  const artwork = document.createElement('canvas');
  artwork.width = Math.round(textureHeight * (size.width / size.height));
  artwork.height = textureHeight;
  const artworkContext = artwork.getContext('2d');
  if (!artworkContext) {
    throw new Error('Could not create flag artwork');
  }
  const { width, height } = artwork;
  switch (pattern.type) {
    case FlagPatternType.Stripes: {
      const horizontal = pattern.orientation === StripeOrientation.Horizontal;
      const extent = horizontal ? height : width;
      for (const [index, color] of pattern.colors.entries()) {
        const start = Math.round((index * extent) / pattern.colors.length);
        const end = Math.round(((index + 1) * extent) / pattern.colors.length);
        artworkContext.fillStyle = color;
        artworkContext.fillRect(
          horizontal ? 0 : start,
          horizontal ? start : 0,
          horizontal ? width : end - start,
          horizontal ? end - start : height,
        );
      }
      break;
    }
    case FlagPatternType.Svg: {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = pattern.src;
      await image.decode();
      artworkContext.fillStyle = pattern.background;
      artworkContext.fillRect(0, 0, width, height);
      artworkContext.drawImage(
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
  // Preserve national artwork proportions inside the shared, identical jelly dimensions.
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(
    textureHeight * (jellyParameters.surface.width / jellyParameters.surface.height),
  );
  canvas.height = textureHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create the shared flag texture');
  }
  const background =
    pattern.type === FlagPatternType.Svg
      ? pattern.background
      : (pattern.colors.find((color) => color.toLowerCase() === flagArtwork.white) ??
        pattern.colors[0]);
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const drawWidth = Math.min(canvas.width, (canvas.height * size.width) / size.height);
  const drawHeight = Math.min(canvas.height, (canvas.width * size.height) / size.width);
  context.drawImage(
    artwork,
    (canvas.width - drawWidth) / 2,
    (canvas.height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};
