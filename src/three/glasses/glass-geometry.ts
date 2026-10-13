import * as THREE from 'three';
import { glassDimensions, glassParameters } from './glass-parameters';

// Revolve the underside, outer wall, rounded rim, inner wall, and base.
export const createGlassGeometry = (dimensions = glassDimensions) => {
  const { outerRadius, outerHeight, interiorDiameter } = dimensions;
  const { wallThickness, baseThickness } = glassParameters;
  const innerRadius = interiorDiameter / 2;
  const rimRadius = wallThickness / 2;
  const bottomRadius = wallThickness;
  const points = [new THREE.Vector2(0, 0), new THREE.Vector2(outerRadius - bottomRadius, 0)];
  const curveSegments = 8;
  const addArc = (x: number, y: number, radius: number, start: number, end: number) => {
    for (let step = 1; step <= curveSegments; step++) {
      const angle = start + (step / curveSegments) * (end - start);
      points.push(new THREE.Vector2(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius));
    }
  };

  addArc(outerRadius - bottomRadius, bottomRadius, bottomRadius, -Math.PI / 2, 0);
  points.push(new THREE.Vector2(outerRadius, outerHeight - rimRadius));
  addArc(outerRadius - rimRadius, outerHeight - rimRadius, rimRadius, 0, Math.PI);
  points.push(new THREE.Vector2(innerRadius, baseThickness + rimRadius));
  addArc(innerRadius - rimRadius, baseThickness + rimRadius, rimRadius, 0, -Math.PI / 2);
  points.push(new THREE.Vector2(0, baseThickness));

  return new THREE.LatheGeometry(points, 64);
};
