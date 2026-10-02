import * as THREE from 'three';
import { createCamera } from './camera';
import { blockHeight, createFlagBlock } from './flag-block';
import { createFloor } from './floor';
import { createLights } from './lights';
import { bindPointerEvents } from './pointer';
import { createRenderer } from './renderer';
import { resize } from './resize';
import { createScene } from './scene';

export const startPlayground = (canvas: HTMLCanvasElement) => {
  // React supplies the canvas. These are the raw Three.js pieces inside it.
  const renderer = createRenderer(canvas);
  const scene = createScene();
  const { camera, cameraTarget, cameraOffset, adjustZoom, fitViewport } = createCamera();
  const lighting = createLights(renderer);
  const { ambientLight, directionalLight } = lighting;
  scene.environment = lighting.environment;
  const floor = createFloor();
  const leftFlag = createFlagBlock();
  const rightFlag = createFlagBlock();
  const box = new THREE.Group();
  leftFlag.object.position.set(-1.6, blockHeight / 2, 0.8);
  leftFlag.object.rotation.y = -Math.PI / 1.5;
  rightFlag.object.position.set(1.6, blockHeight / 2, 0.8);
  rightFlag.object.rotation.y = Math.PI / 1.5;
  box.add(leftFlag.object, rightFlag.object);
  scene.add(ambientLight, directionalLight, floor, box);

  const blocks = [leftFlag, rightFlag];
  const viewBounds = new THREE.Frustum();
  const viewProjection = new THREE.Matrix4();
  const { unbind } = bindPointerEvents({ canvas, camera, cameraTarget, blocks });
  const onResize = () => {
    resize(renderer, camera);
    fitViewport();
  };
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    adjustZoom(event.deltaY * 0.02);
  };
  window.addEventListener('resize', onResize);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  // The render loop keeps the camera, hover, and composition rotation in sync.
  let previousTime = performance.now();
  let frameId = 0;

  function animate() {
    frameId = requestAnimationFrame(animate);

    const now = performance.now();
    const delta = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;

    camera.position.copy(cameraTarget).add(cameraOffset);
    camera.lookAt(cameraTarget);
    camera.updateMatrixWorld();
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    viewBounds.setFromProjectionMatrix(viewProjection);

    for (const block of blocks) {
      block.setBounds(viewBounds.planes);
      block.update(delta);
    }

    renderer.render(scene, camera);
  }

  animate();

  // React calls this when the canvas unmounts (and during Strict Mode checks).
  const dispose = () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', onResize);
    canvas.removeEventListener('wheel', onWheel);
    unbind();
    leftFlag.dispose();
    rightFlag.dispose();
    floor.geometry.dispose();
    floor.material.dispose();
    lighting.dispose();
    renderer.dispose();
    scene.clear();
    canvas.style.cursor = '';
  };

  return {
    setCountries: async (
      leftCountry: Parameters<typeof leftFlag.setCountry>[0],
      rightCountry: Parameters<typeof rightFlag.setCountry>[0],
    ) => {
      await Promise.all([leftFlag.setCountry(leftCountry), rightFlag.setCountry(rightCountry)]);
    },
    dispose,
  };
};
