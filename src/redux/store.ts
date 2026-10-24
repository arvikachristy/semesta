import { configureStore } from '@reduxjs/toolkit';
import { canaryReducer } from './canary/slice';
import { readCanaryOverrides, saveCanaryOverrides } from '../features/canary/canary-storage';
import { readStoredTheme, saveStoredTheme } from '../styles/theme';
import { themeReducer } from './theme/slice';

export const createAppStore = () => {
  const store = configureStore({
    reducer: { canary: canaryReducer, theme: themeReducer },
    preloadedState: {
      canary: {
        overrides: readCanaryOverrides(),
      },
      theme: { current: readStoredTheme() },
    },
  });
  let previous = store.getState();
  store.subscribe(() => {
    const current = store.getState();
    if (current.canary.overrides !== previous.canary.overrides) {
      saveCanaryOverrides(current.canary.overrides);
    }
    if (current.theme.current !== previous.theme.current) {
      saveStoredTheme(current.theme.current);
    }
    previous = current;
  });
  return store;
};

export const store = createAppStore();
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
