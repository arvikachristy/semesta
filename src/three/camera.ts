import * as THREE from 'three';
import { createCameraPan } from './pan';

// Y points up. Fit the whole circle while preserving the downward viewing angle.
export const createCamera = (compositionBounds: THREE.Box3) => {
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
  const cameraTarget = compositionBounds.getCenter(new THREE.Vector3());
  const cameraOffset = new THREE.Vector3(0, 4.5, 8);
  const panBetween = createCameraPan(camera, cameraTarget, compositionBounds);
  const minDistance = 3;
  let maxDistance = 22;
  const corner = new THREE.Vector3();
  const inverseRotation = new THREE.Quaternion();

  const fitViewport = () => {
    camera.position.copy(cameraTarget).add(cameraOffset);
    camera.lookAt(cameraTarget);
    inverseRotation.copy(camera.quaternion).invert();
    const verticalTangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const horizontalTangent = verticalTangent * camera.aspect;
    let distance = minDistance;

    // Each bounds corner must fit both the horizontal and vertical field of view.
    for (const x of [compositionBounds.min.x, compositionBounds.max.x]) {
      for (const y of [compositionBounds.min.y, compositionBounds.max.y]) {
        for (const z of [compositionBounds.min.z, compositionBounds.max.z]) {
          corner.set(x, y, z).sub(cameraTarget).applyQuaternion(inverseRotation);
          distance = Math.max(
            distance,
            corner.z +
              1.1 *
                Math.max(
                  Math.abs(corner.x) / horizontalTangent,
                  Math.abs(corner.y) / verticalTangent,
                ),
          );
        }
      }
    }

    maxDistance = Math.max(22, distance * 2);
    cameraOffset.setLength(distance);
  };
  fitViewport();

  const zoomBy = (factor: number) => {
    if (!Number.isFinite(factor) || factor <= 0) {
      return;
    }
    cameraOffset.setLength(
      THREE.MathUtils.clamp(cameraOffset.length() / factor, minDistance, maxDistance),
    );
  };

  return { camera, cameraTarget, cameraOffset, zoomBy, panBetween, fitViewport };
};
