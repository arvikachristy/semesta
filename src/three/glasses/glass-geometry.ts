import * as THREE from 'three';

export const glassCylinderSize = { radius: 0.48, height: 1.55, edgeRadius: 0.11 };

// A revolved profile closes at the axis and rounds the rim of the solid cylinder.
export const createGlassGeometry = () => {
  const { radius, height, edgeRadius } = glassCylinderSize;
  const halfHeight = height / 2;
  const innerRadius = radius - edgeRadius;
  const points = [new THREE.Vector2(0, -halfHeight), new THREE.Vector2(innerRadius, -halfHeight)];
  const curveSegments = 8;

  for (let step = 1; step <= curveSegments; step++) {
    const angle = -Math.PI / 2 + (step / curveSegments) * (Math.PI / 2);
    points.push(
      new THREE.Vector2(
        innerRadius + Math.cos(angle) * edgeRadius,
        -halfHeight + edgeRadius + Math.sin(angle) * edgeRadius,
      ),
    );
  }

  points.push(new THREE.Vector2(radius, halfHeight - edgeRadius));

  for (let step = 1; step <= curveSegments; step++) {
    const angle = (step / curveSegments) * (Math.PI / 2);
    points.push(
      new THREE.Vector2(
        innerRadius + Math.cos(angle) * edgeRadius,
        halfHeight - edgeRadius + Math.sin(angle) * edgeRadius,
      ),
    );
  }

  points.push(new THREE.Vector2(0, halfHeight));
  return new THREE.LatheGeometry(points, 64);
};
