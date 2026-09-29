import * as THREE from 'three';

// Y points up. The camera looks slightly down at the middle of the box.
export const createCamera = () => {
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
  const cameraTarget = new THREE.Vector3(0, 0.5, 0);
  const minDistance = 3;
  const maxDistance = 22;

  camera.position.set(0, 5, 8);
  camera.lookAt(cameraTarget);

  // Preserve the viewing angle as the target moves across the X/Z plane.
  const cameraOffset = camera.position.clone().sub(cameraTarget);
  const desktopDistance = cameraOffset.length();

  // Keep both blocks in frame on narrow screens without changing the viewing angle.
  const fitViewport = () => {
    const aspect = window.innerWidth / window.innerHeight;
    const fitDistance = desktopDistance * Math.max(1, 0.9 / aspect);
    cameraOffset.setLength(Math.min(maxDistance, Math.max(cameraOffset.length(), fitDistance)));
  };
  fitViewport();

  const adjustZoom = (delta: number) => {
    const currentDistance = cameraOffset.length();
    const nextDistance = THREE.MathUtils.clamp(currentDistance + delta, minDistance, maxDistance);
    const direction = cameraOffset.clone().normalize();
    cameraOffset.copy(direction.multiplyScalar(nextDistance));
  };

  return { camera, cameraTarget, cameraOffset, minDistance, maxDistance, adjustZoom, fitViewport };
};
