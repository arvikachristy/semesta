import * as THREE from 'three';
import { createBox } from './box';
import { createCamera } from './camera';
import { createFloor } from './floor';
import { createLights } from './lights';
import { bindPointerEvents } from './pointer';
import { createRaycasting } from './raycasting';
import { createRenderer } from './renderer';
import { resize } from './resize';
import { createScene } from './scene';

export const startPlayground = (canvas: HTMLCanvasElement) => {
  // React supplies the canvas. These are the raw Three.js pieces inside it.
  const renderer = createRenderer(canvas);
  const scene = createScene();
  const { camera, cameraTarget, cameraOffset, adjustZoom } = createCamera();
  const { ambientLight, directionalLight } = createLights();
  const floor = createFloor();
  const box = createBox();
  scene.add(ambientLight, directionalLight, floor, box);

  const { updatePointer, isOverBox } = createRaycasting(canvas, camera, box);
  const { interaction, unbind } = bindPointerEvents({
    canvas,
    box,
    cameraTarget,
    updatePointer,
    isOverBox,
  });
  const onResize = () => resize(renderer, camera);
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    adjustZoom(event.deltaY * 0.02);
  };
  window.addEventListener('resize', onResize);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  // The render loop keeps the camera, hover, and box rotation in sync.
  let previousTime = performance.now();
  let frameId = 0;

  function animate() {
    frameId = requestAnimationFrame(animate);

    const now = performance.now();
    const delta = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    const easing = 1 - Math.exp(-12 * delta);

    camera.position.copy(cameraTarget).add(cameraOffset);
    camera.lookAt(cameraTarget);

    const dragging = interaction.activePointer !== null && !interaction.pressedBox;
    const hovered = interaction.pointerVisible && !dragging && isOverBox();
    canvas.style.cursor = dragging ? 'grabbing' : hovered ? 'pointer' : 'grab';

    const scale = THREE.MathUtils.lerp(box.scale.x, hovered ? 1.08 : 1, easing);
    box.scale.setScalar(scale);
    box.position.y = scale / 2;
    box.rotation.y = THREE.MathUtils.lerp(box.rotation.y, interaction.targetRotation, easing);

    renderer.render(scene, camera);
  }

  animate();

  // React calls this when the canvas unmounts (and during Strict Mode checks).
  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', onResize);
    canvas.removeEventListener('wheel', onWheel);
    unbind();
    box.geometry.dispose();
    box.material.dispose();
    floor.geometry.dispose();
    floor.material.dispose();
    renderer.dispose();
    scene.clear();
    canvas.style.cursor = '';
  };
};
