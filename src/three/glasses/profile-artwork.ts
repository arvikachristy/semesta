import * as THREE from 'three';
import { glassParameters } from './glass-parameters';

export interface IArtworkCrop {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// SVGs are 1024px square; texture v is reversed relative to SVG y.
export const createProfileArtworkGeometry = (
  width: number,
  height: number,
  centre: number,
  wallAt: (height: number) => { radius: number },
  offset: number,
  crop: IArtworkCrop,
) => {
  const geometry = new THREE.PlaneGeometry(width, height, 32, 12);
  const uv = geometry.getAttribute('uv');
  for (let index = 0; index < uv.count; index++) {
    uv.setXY(
      index,
      (crop.left + uv.getX(index) * (crop.right - crop.left)) / 1024,
      (1024 - crop.bottom + uv.getY(index) * (crop.bottom - crop.top)) / 1024,
    );
  }
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index++) {
    const y = centre + positions.getY(index);
    const radius = wallAt(y).radius + glassParameters.wallThickness + offset;
    const angle = positions.getX(index) / radius;
    positions.setXYZ(index, Math.sin(angle) * radius, y, Math.cos(angle) * radius);
  }
  geometry.computeVertexNormals();
  return geometry;
};
