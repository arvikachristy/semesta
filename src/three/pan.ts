import * as THREE from 'three';

export const panParameters = { boundaryPadding: 1, groundHeight: 0 };

// Two screen rays meet the ground. Their world-space difference makes the scene
// follow the drag at the current camera distance, field of view and aspect ratio.
export const createCameraPan = (
  camera: THREE.PerspectiveCamera,
  cameraTarget: THREE.Vector3,
  compositionBounds: THREE.Box3,
) => {
  const bounds = compositionBounds.clone().expandByScalar(panParameters.boundaryPadding);
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -panParameters.groundHeight);
  const ray = new THREE.Raycaster();
  const fromPoint = new THREE.Vector3();
  const toPoint = new THREE.Vector3();
  return (from: THREE.Vector2, to: THREE.Vector2) => {
    camera.updateMatrixWorld();
    ray.setFromCamera(from, camera);
    if (!ray.ray.intersectPlane(ground, fromPoint)) {
      return;
    }
    ray.setFromCamera(to, camera);
    if (!ray.ray.intersectPlane(ground, toPoint)) {
      return;
    }
    cameraTarget.x = THREE.MathUtils.clamp(
      cameraTarget.x + fromPoint.x - toPoint.x,
      bounds.min.x,
      bounds.max.x,
    );
    cameraTarget.z = THREE.MathUtils.clamp(
      cameraTarget.z + fromPoint.z - toPoint.z,
      bounds.min.z,
      bounds.max.z,
    );
  };
};
