import * as THREE from 'three';

// Raycasting turns a screen position into a ray through the camera.
export const createRaycasting = (
  canvas: HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
  box: THREE.Object3D,
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

  const isOverObject = (object: THREE.Object3D) => {
    camera.updateMatrixWorld();
    object.updateWorldMatrix(true, true);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObject(object, true).length > 0;
  };

  const isOverBox = () => isOverObject(box);

  return { updatePointer, isOverBox, isOverObject };
};
