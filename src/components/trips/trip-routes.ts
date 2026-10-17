export const tripStudioRoutePattern = '/trips/:tripId';

export const tripStudioPath = (tripId: string) => `/trips/${encodeURIComponent(tripId)}`;
