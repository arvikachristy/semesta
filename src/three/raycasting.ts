import * as THREE from 'three';

// Raycasting turns a screen position into a ray through the camera.
export const createRaycasting = (
  canvas: HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
  box: THREE.Mesh,
) => {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const updatePointer = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
  };

  const isOverBox = () => {
    camera.updateMatrixWorld();
    box.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObject(box, false).length > 0;
  };

  return { updatePointer, isOverBox };
};
