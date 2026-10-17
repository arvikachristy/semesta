export const tripStudioRoutePattern = '/trips/:tripId';
export const tripStudioLandingPath = '/tripstudio';
export const standaloneTripStudioRoutePattern = `${tripStudioLandingPath}/:tripId`;

export const tripStudioPath = (tripId: string) => `/trips/${encodeURIComponent(tripId)}`;

export const standaloneTripStudioPath = (tripId: string) =>
  `${tripStudioLandingPath}/${encodeURIComponent(tripId)}`;
