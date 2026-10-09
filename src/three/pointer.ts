import * as THREE from 'three';
import type { createFlagBlock } from './jelly-flags/flag-block';
import type { createGlassSet } from './glasses/glass-set';

enum PointerEventName {
  Down = 'pointerdown',
  Move = 'pointermove',
  Up = 'pointerup',
  Cancel = 'pointercancel',
  LostCapture = 'lostpointercapture',
  Blur = 'blur',
}
const Cursor = { Grab: 'grab', Grabbing: 'grabbing', Pointer: 'pointer' };
const PointerType = { Touch: 'touch' };

interface IPointerOptions {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  cameraTarget: THREE.Vector3;
  blocks: ReturnType<typeof createFlagBlock>[];
  glasses: ReturnType<typeof createGlassSet>;
  zoomBy?: (factor: number) => void;
}

// A hit creates a camera-facing grab plane. Ray points are converted to the body's local space.
export const bindPointerEvents = ({
  canvas,
  camera,
  cameraTarget,
  blocks,
  glasses,
  zoomBy,
}: IPointerOptions) => {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane();
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const previous = new THREE.Vector2();
  let activePointer: number | null = null;
  let grabbed: ReturnType<typeof createFlagBlock> | null = null;
  let rotatingGlasses = false;
  const touches = new Map<number, THREE.Vector2>();
  let pinching = false;
  let previousPinchDistance = 0;
  const pinchDistance = () => {
    const [first, second] = touches.values();
    return first && second ? first.distanceTo(second) : 0;
  };
  const updateRay = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      1 - ((event.clientY - bounds.top) / bounds.height) * 2,
    );
    camera.updateMatrixWorld();
    blocks.forEach((block) => block.object.updateWorldMatrix(true, true));
    glasses.object.updateWorldMatrix(true, true);
    raycaster.setFromCamera(pointer, camera);
  };
  const hit = () =>
    raycaster.intersectObjects(
      blocks.map((block) => block.object),
      true,
    )[0];
  const release = (jump = false) => {
    grabbed?.endGrab(jump);
    grabbed = null;
    rotatingGlasses = false;
    const id = activePointer;
    activePointer = null;
    if (id !== null && canvas.hasPointerCapture(id)) {
      canvas.releasePointerCapture(id);
    }
    canvas.style.cursor = Cursor.Grab;
  };
  const down = (event: PointerEvent) => {
    if (event.pointerType === PointerType.Touch && event.button === 0) {
      touches.set(event.pointerId, new THREE.Vector2(event.clientX, event.clientY));
      canvas.setPointerCapture(event.pointerId);
      if (touches.size >= 2) {
        // Keep both captures, but cancel the one-finger action without launching a jelly.
        grabbed?.endGrab(false);
        grabbed = null;
        rotatingGlasses = false;
        activePointer = null;
        pinching = true;
        previousPinchDistance = pinchDistance();
        return;
      }
      if (pinching) {
        return;
      }
    }
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
    rotatingGlasses = !grabbed && raycaster.intersectObject(glasses.object, true).length > 0;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = Cursor.Grabbing;
  };
  const move = (event: PointerEvent) => {
    const touch = touches.get(event.pointerId);
    if (touch) {
      touch.set(event.clientX, event.clientY);
      if (pinching) {
        const distance = pinchDistance();
        if (distance > 0 && previousPinchDistance > 0) {
          zoomBy?.(distance / previousPinchDistance);
        }
        previousPinchDistance = distance;
        return;
      }
    }
    if (!event.isPrimary || (activePointer !== null && activePointer !== event.pointerId)) {
      return;
    }
    updateRay(event);
    if (activePointer === null) {
      canvas.style.cursor = hit() ? Cursor.Pointer : Cursor.Grab;
      return;
    }
    if (grabbed) {
      if (raycaster.ray.intersectPlane(plane, point)) {
        grabbed.moveGrab(grabbed.object.worldToLocal(point));
      }
    } else if (rotatingGlasses) {
      // Only turn around world Y: the circle and all glass bases stay on the floor.
      glasses.rotateBy((event.clientX - previous.x) / canvas.clientWidth);
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
    if (touches.delete(event.pointerId)) {
      if (pinching) {
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
        // After one finger lifts, wait for all fingers to lift before panning again.
        previousPinchDistance = pinchDistance();
        pinching = touches.size > 0;
        canvas.style.cursor = Cursor.Grab;
        return;
      }
    }
    if (event.pointerId === activePointer) {
      release(event.type === PointerEventName.Up);
    }
  };
  const cancel = () => {
    const ids = [...touches.keys()];
    touches.clear();
    pinching = false;
    previousPinchDistance = 0;
    release();
    ids.forEach((id) => {
      if (canvas.hasPointerCapture(id)) {
        canvas.releasePointerCapture(id);
      }
    });
  };
  canvas.addEventListener(PointerEventName.Down, down);
  canvas.addEventListener(PointerEventName.Move, move);
  canvas.addEventListener(PointerEventName.Up, up);
  canvas.addEventListener(PointerEventName.Cancel, up);
  canvas.addEventListener(PointerEventName.LostCapture, up);
  window.addEventListener(PointerEventName.Blur, cancel);
  return {
    releaseBlock: (block: ReturnType<typeof createFlagBlock>) => {
      if (grabbed === block) {
        release();
      }
    },
    unbind: () => {
      cancel();
      canvas.removeEventListener(PointerEventName.Down, down);
      canvas.removeEventListener(PointerEventName.Move, move);
      canvas.removeEventListener(PointerEventName.Up, up);
      canvas.removeEventListener(PointerEventName.Cancel, up);
      canvas.removeEventListener(PointerEventName.LostCapture, up);
      window.removeEventListener(PointerEventName.Blur, cancel);
    },
  };
};
