import * as THREE from 'three';
import { jellyPerformance } from './jelly-performance';
import { jellyParameters } from './jelly-parameters';

const atlasParameters = { columns: 8, padding: 2 };
export const getFlagAtlasLayout = (count: number) => {
  const capacity = THREE.MathUtils.ceilPowerOfTwo(Math.max(1, count));
  const columns = Math.min(atlasParameters.columns, capacity);
  const rows = Math.ceil(capacity / columns);
  const height = jellyPerformance.textureHeight;
  const width = Math.round(
    (height * jellyParameters.surface.width) / jellyParameters.surface.height,
  );
  const cellWidth = width + atlasParameters.padding * 2;
  const cellHeight = height + atlasParameters.padding * 2;
  return {
    columns,
    width,
    height,
    cellWidth,
    cellHeight,
    padding: atlasParameters.padding,
    atlasWidth: columns * cellWidth,
    atlasHeight: rows * cellHeight,
  };
};

// UVs address pixel centres inside each tile. Linear filtering cannot sample a
// neighbouring flag; no mip chain mixes the atlas tiles at a distance.
export const getFlagAtlasUv = (layout: ReturnType<typeof getFlagAtlasLayout>, slot: number) => ({
  x: ((slot % layout.columns) * layout.cellWidth + layout.padding + 0.5) / layout.atlasWidth,
  y:
    1 -
    (Math.floor(slot / layout.columns) * layout.cellHeight + layout.padding + layout.height - 0.5) /
      layout.atlasHeight,
  width: (layout.width - 1) / layout.atlasWidth,
  height: (layout.height - 1) / layout.atlasHeight,
});

export const createFlagAtlas = () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create flag atlas');
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  let layout = getFlagAtlasLayout(1);
  return {
    texture,
    resize: (count: number) => {
      const nextLayout = getFlagAtlasLayout(count);
      // Three.js allocates immutable GPU texture storage. Reallocate when a
      // growing selection changes atlas dimensions rather than uploading out of bounds.
      const resized =
        canvas.width !== nextLayout.atlasWidth || canvas.height !== nextLayout.atlasHeight;
      if (resized) {
        texture.dispose();
        canvas.width = nextLayout.atlasWidth;
        canvas.height = nextLayout.atlasHeight;
      }
      layout = nextLayout;
      return resized;
    },
    draw: (image: HTMLCanvasElement, slot: number) => {
      context.drawImage(
        image,
        (slot % layout.columns) * layout.cellWidth + layout.padding,
        Math.floor(slot / layout.columns) * layout.cellHeight + layout.padding,
        layout.width,
        layout.height,
      );
      texture.needsUpdate = true;
      return getFlagAtlasUv(layout, slot);
    },
    dispose: () => texture.dispose(),
  };
};
