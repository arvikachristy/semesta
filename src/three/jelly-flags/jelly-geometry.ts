import { BufferAttribute } from 'three';
import type { BufferGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { jellyParameters } from './jelly-parameters';
import { jellyPerformance } from './jelly-performance';

export const JellyAttribute = {
  Position: 'position',
  Normal: 'normal',
  Uv: 'uv',
  Thickness: 'jellyThickness',
};

// Keep one CPU-only rest template. Each body owns independent mutable buffers;
// building another country never repeats rounded geometry generation or welding.
let template: BufferGeometry | null = null;
export const createJellyGeometry = (scale: number) => {
  if (!template) {
    const { width, height, depth, radius } = jellyParameters.surface;
    const rounded = new RoundedBoxGeometry(
      width,
      height,
      depth,
      jellyPerformance.surfaceSegments,
      radius,
    );
    rounded.deleteAttribute(JellyAttribute.Normal);
    rounded.deleteAttribute(JellyAttribute.Uv);
    template = mergeVertices(rounded);
    rounded.dispose();
    template.computeVertexNormals();
    const positions = template.getAttribute(JellyAttribute.Position);
    const uv = new BufferAttribute(new Float32Array(positions.count * 2), 2);
    for (let i = 0; i < positions.count; i++) {
      uv.setXY(i, positions.getX(i) / width + 0.5, positions.getY(i) / height + 0.5);
    }
    template.setAttribute(JellyAttribute.Uv, uv);
  }
  return template.clone().scale(scale, scale, scale);
};
