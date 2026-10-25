// Keep the fullscreen transmission pass affordable on high-density displays.
export const renderParameters = {
  maxPixelRatio: 2,
  maxCanvasPixels: 1_000_000,
  transmissionResolutionScale: 0.5,
  minResolutionScale: 0.75,
  resolutionStep: 0.125,
  slowFps: 48,
  fastFps: 58,
  slowSamples: 3,
  fastSamples: 15,
};
export const getRenderPixelRatio = (
  devicePixelRatio: number,
  viewportPixels: number,
  resolutionScale = 1,
) =>
  Math.min(
    devicePixelRatio,
    renderParameters.maxPixelRatio,
    Math.sqrt(renderParameters.maxCanvasPixels / viewportPixels),
  ) * resolutionScale;

// Sustained slow frames reduce canvas pixels. Long headroom restores resolution;
// separate thresholds and windows prevent quality from oscillating every second.
export const createRenderQuality = () => {
  let scale = 1;
  let slow = 0;
  let fast = 0;
  return {
    getScale: () => scale,
    sample: (fps: number) => {
      slow = fps < renderParameters.slowFps ? slow + 1 : 0;
      fast = fps >= renderParameters.fastFps ? fast + 1 : 0;
      if (slow >= renderParameters.slowSamples) {
        scale = Math.max(
          renderParameters.minResolutionScale,
          scale - renderParameters.resolutionStep,
        );
        slow = 0;
        fast = 0;
      } else if (fast >= renderParameters.fastSamples) {
        scale = Math.min(1, scale + renderParameters.resolutionStep);
        slow = 0;
        fast = 0;
      }
      return scale;
    },
  };
};
