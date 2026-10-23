import { configureStore } from '@reduxjs/toolkit';
import { canaryReducer } from '../features/canary/canary-slice';
import {
  readCanaryOverrides,
  readDevMode,
  saveCanaryOverrides,
  saveDevMode,
} from '../features/canary/canary-storage';

export const createAppStore = () => {
  const devMode = readDevMode();
  saveDevMode(devMode);
  const store = configureStore({
    reducer: { canary: canaryReducer },
    preloadedState: {
      canary: {
        devMode,
        overrides: readCanaryOverrides(),
      },
    },
  });
  let previous = store.getState().canary;
  store.subscribe(() => {
    const current = store.getState().canary;
    if (current.devMode !== previous.devMode) {
      saveDevMode(current.devMode);
    }
    if (current.overrides !== previous.overrides) {
      saveCanaryOverrides(current.overrides);
    }
    previous = current;
  });
  return store;
};

export const store = createAppStore();
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
