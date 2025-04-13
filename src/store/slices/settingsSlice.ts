import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
}

const initialState: SettingsState = {
  language: 'fr',
  theme: 'light',
  notificationsEnabled: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    toggleNotifications: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },
  },
});

export const { setLanguage, setTheme, toggleNotifications } = settingsSlice.actions;
export default settingsSlice.reducer;
