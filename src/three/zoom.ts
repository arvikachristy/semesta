export const zoomParameters = {
  wheelSensitivity: 0.002,
  wheelLinePixels: 16,
  maxWheelPixels: 1000,
};

// Convert wheel units into one proportional camera zoom, including trackpad pinch.
export const getWheelZoomFactor = (event: WheelEvent, viewportHeight: number) => {
  const unit =
    event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? zoomParameters.wheelLinePixels
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? viewportHeight
        : 1;
  const pixels = Math.max(
    -zoomParameters.maxWheelPixels,
    Math.min(zoomParameters.maxWheelPixels, event.deltaY * unit),
  );
  return Math.exp(-pixels * zoomParameters.wheelSensitivity);
};
