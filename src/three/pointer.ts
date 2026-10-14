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
  blocks: ReturnType<typeof createFlagBlock>[];
  glasses: ReturnType<typeof createGlassSet>;
  zoomBy?: (factor: number) => void;
  panBetween: (from: THREE.Vector2, to: THREE.Vector2) => void;
  onSelectBlock?: (block: ReturnType<typeof createFlagBlock>) => void;
}

// A hit creates a camera-facing grab plane. Ray points are converted to the body's local space.
export const bindPointerEvents = ({
  canvas,
  camera,
  blocks,
  glasses,
  zoomBy,
  panBetween,
  onSelectBlock,
}: IPointerOptions) => {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane();
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const previous = new THREE.Vector2();
  const previousPanPointer = new THREE.Vector2();
  const pinchCentre = new THREE.Vector2();
  const previousPinchCentre = new THREE.Vector2();
  let activePointer: number | null = null;
  let grabbed: ReturnType<typeof createFlagBlock> | null = null;
  let rotatingGlasses = false;
  let draggedBlock = false;
  const grabStart = new THREE.Vector2();
  const tapThreshold = 8;
  const touches = new Map<number, THREE.Vector2>();
  let pinching = false;
  let previousPinchDistance = 0;
  let pinchFrame: number | null = null;
  const pinchDistance = () => {
    const [first, second] = touches.values();
    return first && second ? first.distanceTo(second) : 0;
  };
  const setNdc = (target: THREE.Vector2, x: number, y: number) => {
    const bounds = canvas.getBoundingClientRect();
    target.set(
      ((x - bounds.left) / bounds.width) * 2 - 1,
      1 - ((y - bounds.top) / bounds.height) * 2,
    );
  };
  const updatePinchCentre = () => {
    const [first, second] = touches.values();
    if (first && second) {
      setNdc(pinchCentre, (first.x + second.x) / 2, (first.y + second.y) / 2);
    }
  };
  const cancelPinchFrame = () => {
    if (pinchFrame !== null) {
      cancelAnimationFrame(pinchFrame);
      pinchFrame = null;
    }
  };
  const applyPinch = () => {
    cancelPinchFrame();
    if (!pinching || touches.size < 2) {
      return;
    }
    updatePinchCentre();
    panBetween(previousPinchCentre, pinchCentre);
    previousPinchCentre.copy(pinchCentre);
    const distance = pinchDistance();
    if (distance > 0 && previousPinchDistance > 0 && distance !== previousPinchDistance) {
      zoomBy?.(distance / previousPinchDistance);
    }
    previousPinchDistance = distance;
  };
  const updateRay = (event: PointerEvent) => {
    setNdc(pointer, event.clientX, event.clientY);
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
    const selected = jump && !draggedBlock ? grabbed : null;
    grabbed?.endGrab(jump && !selected);
    grabbed = null;
    draggedBlock = false;
    rotatingGlasses = false;
    const id = activePointer;
    activePointer = null;
    if (id !== null && canvas.hasPointerCapture(id)) {
      canvas.releasePointerCapture(id);
    }
    canvas.style.cursor = Cursor.Grab;
    if (selected) {
      onSelectBlock?.(selected);
    }
  };
  const down = (event: PointerEvent) => {
    if (event.pointerType === PointerType.Touch && event.button === 0) {
      touches.set(event.pointerId, new THREE.Vector2(event.clientX, event.clientY));
      canvas.setPointerCapture(event.pointerId);
      if (touches.size >= 2) {
        cancelPinchFrame();
        // Keep both captures, but cancel the one-finger action without launching a jelly.
        grabbed?.endGrab(false);
        grabbed = null;
        draggedBlock = false;
        rotatingGlasses = false;
        activePointer = null;
        pinching = true;
        previousPinchDistance = pinchDistance();
        updatePinchCentre();
        previousPinchCentre.copy(pinchCentre);
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
    grabStart.copy(previous);
    draggedBlock = false;
    previousPanPointer.copy(pointer);
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
        if (touches.size < 2) {
          return;
        }
        // Read both fingers once per frame: their separate events must not create
        // a temporary pinch or hit zoom limits during a parallel two-finger pan.
        if (pinchFrame === null) {
          pinchFrame = requestAnimationFrame(applyPinch);
        }
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
      if (
        Math.hypot(event.clientX - grabStart.x, event.clientY - grabStart.y) > tapThreshold
      ) {
        draggedBlock = true;
      }
      if (raycaster.ray.intersectPlane(plane, point)) {
        grabbed.moveGrab(grabbed.object.worldToLocal(point));
      }
    } else if (rotatingGlasses) {
      // Only turn around world Y: the circle and all glass bases stay on the floor.
      glasses.rotateBy((event.clientX - previous.x) / canvas.clientWidth);
    } else {
      panBetween(previousPanPointer, pointer);
    }
    previous.set(event.clientX, event.clientY);
    previousPanPointer.copy(pointer);
  };
  const up = (event: PointerEvent) => {
    if (touches.has(event.pointerId) && pinchFrame !== null) {
      if (event.type === PointerEventName.Up) {
        applyPinch();
      } else {
        cancelPinchFrame();
      }
    }
    if (touches.delete(event.pointerId)) {
      if (pinching) {
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
        // After one finger lifts, wait for all fingers to lift before panning again.
        previousPinchDistance = pinchDistance();
        updatePinchCentre();
        previousPinchCentre.copy(pinchCentre);
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
    cancelPinchFrame();
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
