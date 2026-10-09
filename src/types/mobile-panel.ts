export const MobilePanel = { Countries: 'countries', Trips: 'trips' } as const;
export type TMobilePanel = (typeof MobilePanel)[keyof typeof MobilePanel];

export interface IMobilePanelState {
  open: boolean;
  onClose: () => void;
}

export const mobilePanelText = { close: 'Close sheet', closeLabel: 'Close' };
