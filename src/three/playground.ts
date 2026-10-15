import { createFrameMonitor } from '../performance/frame-monitor';
import { jellyPerformance } from './jelly-flags/jelly-performance';
import type { IFrameReading } from '../performance/frame-monitor';
import { createCamera } from './camera';
import { createCountryCollection } from './jelly-flags/country-collection';
import type { CountryStatus } from '../types/country-status';
import type { CountryList } from '../types/country';
import type { TContinentId } from '../types/continent';
import { createFloor } from './floor';
import { createGlassSet } from './glasses/glass-set';
import { createLights } from './lights';
import { bindPointerEvents } from './pointer';
import { createRenderer } from './renderer';
import { createRenderQuality, getRenderPixelRatio } from './render-parameters';
import { resize } from './resize';
import { createScene } from './scene';
import { getWheelZoomFactor } from './zoom';

interface IPlaygroundOptions {
  onFrameReading?: (reading: IFrameReading) => void;
  onCountryStatus?: (country: CountryList, status: CountryStatus) => void;
  onCountrySelect?: (country: CountryList) => void;
  onContinentSelect?: (continent: TContinentId) => void;
}
export const startPlayground = (
  canvas: HTMLCanvasElement,
  { onCountryStatus, onCountrySelect, onContinentSelect, onFrameReading }: IPlaygroundOptions = {},
) => {
  // React supplies the canvas. These are the raw Three.js pieces inside it.
  const renderer = createRenderer(canvas);
  const quality = createRenderQuality();
  const scene = createScene();
  const glasses = createGlassSet();
  const { camera, cameraTarget, cameraOffset, zoomBy, panBetween, fitViewport } = createCamera(
    glasses.bounds,
  );
  const lighting = createLights(renderer);
  const { ambientLight, directionalLight } = lighting;
  scene.environment = lighting.environment;
  const floor = createFloor();
  let input: ReturnType<typeof bindPointerEvents> | null = null;
  const collection = createCountryCollection({
    glasses,
    onStatus: onCountryStatus,
    onRemove: (block) => input?.releaseBlock(block),
  });
  scene.add(ambientLight, directionalLight, floor, glasses.object);
  input = bindPointerEvents({
    canvas,
    camera,
    blocks: collection.blocks,
    glasses,
    zoomBy,
    panBetween,
    onSelectGlass: onContinentSelect,
    onSelectBlock: (block) => {
      const country = collection.countryForBlock(block);
      if (country) {
        onCountrySelect?.(country);
      }
    },
  });
  const onResize = () => {
    resize(renderer, camera, quality.getScale());
    fitViewport();
  };
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    zoomBy(getWheelZoomFactor(event, canvas.clientHeight));
  };
  window.addEventListener('resize', onResize);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  // The render loop keeps the camera, hover, and composition rotation in sync.
  const frameMonitor = createFrameMonitor((reading) => {
    const ratio = getRenderPixelRatio(
      window.devicePixelRatio,
      window.innerWidth * window.innerHeight,
      quality.sample(reading.fps),
    );
    if (renderer.getPixelRatio() !== ratio) {
      renderer.setPixelRatio(ratio);
    }
    onFrameReading?.(reading);
  });
  const visibilityEvent = 'visibilitychange';
  document.addEventListener(visibilityEvent, frameMonitor.reset);
  let previousTime = performance.now();
  let frameId = 0;
  const previousCameraPosition = camera.position.clone();
  let previousGlassRotation = glasses.object.rotation.y;
  let shadowDirty = true;
  let previousShadowTime = 0;

  function animate() {
    frameId = requestAnimationFrame(animate);

    const now = performance.now();
    if (canvas.closest('[hidden]')) {
      previousTime = now;
      frameMonitor.reset();
      return;
    }
    if (document.hidden) {
      frameMonitor.reset();
    } else {
      frameMonitor.sample(now);
    }
    const delta = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;

    camera.position.copy(cameraTarget).add(cameraOffset);
    camera.lookAt(cameraTarget);
    camera.updateMatrixWorld();
    glasses.updateFacing(camera);
    const surfacesChanged = collection.update(delta);
    shadowDirty ||=
      surfacesChanged ||
      !previousCameraPosition.equals(camera.position) ||
      previousGlassRotation !== glasses.object.rotation.y;
    if (shadowDirty && now - previousShadowTime >= 1000 / jellyPerformance.shadowUpdatesPerSecond) {
      renderer.shadowMap.needsUpdate = true;
      previousShadowTime = now;
      shadowDirty = false;
    }
    previousCameraPosition.copy(camera.position);
    previousGlassRotation = glasses.object.rotation.y;

    renderer.render(scene, camera);
  }

  animate();

  // React calls this when the canvas unmounts (and during Strict Mode checks).
  const dispose = () => {
    cancelAnimationFrame(frameId);
    document.removeEventListener(visibilityEvent, frameMonitor.reset);
    window.removeEventListener('resize', onResize);
    canvas.removeEventListener('wheel', onWheel);
    input?.unbind();
    collection.dispose();
    glasses.dispose();
    floor.geometry.dispose();
    floor.material.dispose();
    lighting.dispose();
    renderer.dispose();
    scene.clear();
    canvas.style.cursor = '';
  };

  return {
    setCountries: collection.setCountries,
    dispose,
  };
};
