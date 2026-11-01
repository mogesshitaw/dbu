/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/slices/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  setSidebarOpened: any;
  activeSection: string;
  sidebarOpened: boolean;
}

const initialState: UIState = {
  activeSection: '',
  sidebarOpened: false,
  setSidebarOpened: undefined
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveSection: (state, action: PayloadAction<string>) => {
      state.activeSection = action.payload;
    },
    setSidebarOpened: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpened = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpened = !state.sidebarOpened;
    },
  },
});

export const { setActiveSection, setSidebarOpened, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;