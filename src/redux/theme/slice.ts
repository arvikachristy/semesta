import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ThemeId } from '../../styles/theme';
import type { TTheme } from '../../styles/theme';

export interface IThemeState {
  current: TTheme;
}

const initialState: IThemeState = { current: ThemeId.Rose };

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<TTheme>) => {
      state.current = action.payload;
    },
  },
});

export const { setTheme } = themeSlice.actions;
export const themeReducer = themeSlice.reducer;
