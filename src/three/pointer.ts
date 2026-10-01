import * as THREE from 'three';

interface IPointerOptions {
  canvas: HTMLCanvasElement;
  box: THREE.Object3D;
  cameraTarget: THREE.Vector3;
  updatePointer: (event: PointerEvent) => void;
  isOverBox: () => boolean;
  getPressedObject?: () => THREE.Object3D | null;
}

// Pointer Events cover both mouse and touch with the same gesture handling.
export const bindPointerEvents = ({
  canvas,
  box,
  cameraTarget,
  updatePointer,
  isOverBox,
  getPressedObject,
}: IPointerOptions) => {
  // The render loop reads this state; pointer handlers change it.
  const interaction = {
    activePointer: null as number | null,
    pointerVisible: false,
    pressedBlock: null as THREE.Object3D | null,
  };

  const dragStart = new THREE.Vector2();
  const previousPointer = new THREE.Vector2();
  const tapTolerance = 6;
  let moved = false;

  const releasePointer = () => {
    const pointerId = interaction.activePointer;
    interaction.activePointer = null;
    interaction.pressedBlock = null;
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) {
      canvas.releasePointerCapture(pointerId);
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || interaction.activePointer !== null) {
      return;
    }

    updatePointer(event);
    interaction.activePointer = event.pointerId;
    interaction.pointerVisible = true;
    interaction.pressedBlock = getPressedObject?.() ?? null;
    moved = false;
    dragStart.set(event.clientX, event.clientY);
    previousPointer.copy(dragStart);
    canvas.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (
      !event.isPrimary ||
      (interaction.activePointer !== null && event.pointerId !== interaction.activePointer)
    ) {
      return;
    }

    updatePointer(event);
    interaction.pointerVisible = true;
    if (interaction.activePointer === null) {
      return;
    }

    moved ||= Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) > tapTolerance;

    if (interaction.pressedBlock) {
      const dx = event.clientX - previousPointer.x;
      const currentTarget = interaction.pressedBlock.userData.targetRotation ?? interaction.pressedBlock.rotation.y;
      interaction.pressedBlock.userData.targetRotation = currentTarget + dx * 0.01;
    } else if (moved) {
      // Move the view a little. The box keeps its world coordinates.
      const dx = (event.clientX - previousPointer.x) / canvas.clientWidth;
      const dy = (event.clientY - previousPointer.y) / canvas.clientHeight;
      cameraTarget.x = THREE.MathUtils.clamp(cameraTarget.x - dx * 4, -0.8, 0.8);
      cameraTarget.z = THREE.MathUtils.clamp(cameraTarget.z - dy * 4, -1.2, 1.2);
    }

    previousPointer.set(event.clientX, event.clientY);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== interaction.activePointer) {
      return;
    }

    updatePointer(event);
    moved ||= Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) > tapTolerance;

    if (interaction.pressedBlock && !moved) {
      const currentTarget = interaction.pressedBlock.userData.targetRotation ?? interaction.pressedBlock.rotation.y;
      interaction.pressedBlock.userData.targetRotation = currentTarget + Math.PI / 2;
    }

    const bounds = canvas.getBoundingClientRect();
    interaction.pointerVisible =
      event.pointerType !== 'touch' &&
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;
    releasePointer();
  };

  const onPointerLeave = () => {
    interaction.pointerVisible = false;
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (event.pointerId !== interaction.activePointer) {
      return;
    }
    interaction.pointerVisible = false;
    releasePointer();
  };

  const onLostPointerCapture = (event: PointerEvent) => {
    if (event.pointerId !== interaction.activePointer) {
      return;
    }
    interaction.pointerVisible = false;
    releasePointer();
  };

  const onBlur = () => {
    interaction.pointerVisible = false;
    releasePointer();
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('lostpointercapture', onLostPointerCapture);
  window.addEventListener('blur', onBlur);

  const unbind = () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('pointercancel', onPointerCancel);
    canvas.removeEventListener('lostpointercapture', onLostPointerCapture);
    window.removeEventListener('blur', onBlur);
    releasePointer();
  };

  return { interaction, unbind };
};
