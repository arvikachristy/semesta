import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CanaryID } from './canary-registry';
import type { TCanaryOverrides } from './canary-storage';

export interface ICanaryState {
  devMode: boolean;
  overrides: TCanaryOverrides;
}

const initialState: ICanaryState = {
  devMode: false,
  overrides: {},
};

const canarySlice = createSlice({
  name: 'canary',
  initialState,
  reducers: {
    setDevMode: (state, action: PayloadAction<boolean>) => {
      state.devMode = action.payload;
    },
    setCanary: (state, action: PayloadAction<{ id: CanaryID; enabled: boolean }>) => {
      state.overrides[action.payload.id] = action.payload.enabled;
    },
  },
});

export const { setDevMode, setCanary } = canarySlice.actions;
export const canaryReducer = canarySlice.reducer;
