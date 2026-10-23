import { configureStore } from '@reduxjs/toolkit';
import { canaryReducer } from '../features/canary/canary-slice';
import { readCanaryOverrides, saveCanaryOverrides } from '../features/canary/canary-storage';

export const createAppStore = () => {
  const store = configureStore({
    reducer: { canary: canaryReducer },
    preloadedState: {
      canary: {
        overrides: readCanaryOverrides(),
      },
    },
  });
  let previous = store.getState().canary;
  store.subscribe(() => {
    const current = store.getState().canary;
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
