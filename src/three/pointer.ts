import * as THREE from 'three';
import type { createFlagBlock } from './flag-block';

interface IPointerOptions {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  cameraTarget: THREE.Vector3;
  blocks: ReturnType<typeof createFlagBlock>[];
}

// A hit creates a camera-facing grab plane. Ray points are converted to the body's local space.
export const bindPointerEvents = ({ canvas, camera, cameraTarget, blocks }: IPointerOptions) => {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane();
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const previous = new THREE.Vector2();
  let activePointer: number | null = null;
  let grabbed: ReturnType<typeof createFlagBlock> | null = null;
  const updateRay = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      1 - ((event.clientY - bounds.top) / bounds.height) * 2,
    );
    camera.updateMatrixWorld();
    blocks.forEach((block) => block.object.updateWorldMatrix(true, true));
    raycaster.setFromCamera(pointer, camera);
  };
  const hit = () =>
    raycaster.intersectObjects(
      blocks.map((block) => block.object),
      true,
    )[0];
  const release = () => {
    grabbed?.endGrab();
    grabbed = null;
    const id = activePointer;
    activePointer = null;
    if (id !== null && canvas.hasPointerCapture(id)) {
      canvas.releasePointerCapture(id);
    }
    canvas.style.cursor = 'grab';
  };
  const down = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || activePointer !== null) {
      return;
    }
    updateRay(event);
    const intersection = hit();
    activePointer = event.pointerId;
    previous.set(event.clientX, event.clientY);
    if (intersection) {
      grabbed = blocks.find((block) => intersection.object.parent === block.object) ?? null;
      if (grabbed) {
        camera.getWorldDirection(normal);
        plane.setFromNormalAndCoplanarPoint(normal, intersection.point);
        grabbed.beginGrab(grabbed.object.worldToLocal(point.copy(intersection.point)));
      }
    }
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  };
  const move = (event: PointerEvent) => {
    if (!event.isPrimary || (activePointer !== null && activePointer !== event.pointerId)) {
      return;
    }
    updateRay(event);
    if (activePointer === null) {
      canvas.style.cursor = hit() ? 'pointer' : 'grab';
      return;
    }
    if (grabbed) {
      if (raycaster.ray.intersectPlane(plane, point)) {
        grabbed.moveGrab(grabbed.object.worldToLocal(point));
      }
    } else {
      cameraTarget.x = THREE.MathUtils.clamp(
        cameraTarget.x - ((event.clientX - previous.x) / canvas.clientWidth) * 4,
        -0.8,
        0.8,
      );
      cameraTarget.z = THREE.MathUtils.clamp(
        cameraTarget.z - ((event.clientY - previous.y) / canvas.clientHeight) * 4,
        -1.2,
        1.2,
      );
    }
    previous.set(event.clientX, event.clientY);
  };
  const up = (event: PointerEvent) => {
    if (event.pointerId === activePointer) {
      release();
    }
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', up);
  window.addEventListener('blur', release);
  return {
    unbind: () => {
      release();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('lostpointercapture', up);
      window.removeEventListener('blur', release);
    },
  };
};
