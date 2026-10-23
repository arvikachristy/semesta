export const CanaryIDs = {
  TRIP_STUDIO: 'trip-studio',
} as const;

export type CanaryID = (typeof CanaryIDs)[keyof typeof CanaryIDs];

export interface ICanaryFeature {
  id: CanaryID;
  description: string;
  isEnabled: boolean;
}

export const canary_registry: Record<CanaryID, ICanaryFeature> = {
  [CanaryIDs.TRIP_STUDIO]: {
    id: CanaryIDs.TRIP_STUDIO,
    description: 'Trip studio to plan your trips',
    isEnabled: false,
  },
};
