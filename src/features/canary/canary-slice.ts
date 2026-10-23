import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CanaryID } from './canary-registry';
import type { TCanaryOverrides } from './canary-storage';

export interface ICanaryState {
  overrides: TCanaryOverrides;
}

const initialState: ICanaryState = {
  overrides: {},
};

const canarySlice = createSlice({
  name: 'canary',
  initialState,
  reducers: {
    setCanary: (state, action: PayloadAction<{ id: CanaryID; enabled: boolean }>) => {
      state.overrides[action.payload.id] = action.payload.enabled;
    },
  },
});

export const { setCanary } = canarySlice.actions;
export const canaryReducer = canarySlice.reducer;
