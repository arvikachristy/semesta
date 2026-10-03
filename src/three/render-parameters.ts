// Keep the fullscreen transmission pass affordable on high-density displays.
export const renderParameters = { maxPixelRatio: 1 };
export const getRenderPixelRatio = (devicePixelRatio: number) =>
  Math.min(devicePixelRatio, renderParameters.maxPixelRatio);
