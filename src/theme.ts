import { DefaultTheme, MD3DarkTheme } from 'react-native-paper';
import { Theme as NavigationTheme } from '@react-navigation/native';

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200EE',
    secondary: '#03DAC6',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    error: '#B00020',
    text: '#121212',
    onSurface: '#121212',
    disabled: '#9E9E9E',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#6200EE',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#BB86FC',
    secondary: '#03DAC6',
    background: '#121212',
    surface: '#1E1E1E',
    error: '#CF6679',
    text: '#FFFFFF',
    onSurface: '#FFFFFF',
    disabled: '#757575',
    placeholder: '#9E9E9E',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#BB86FC',
  },
};

export const theme = lightTheme;

// Navigation theme to match Paper
export const navigationTheme: NavigationTheme = {
  dark: false,
  colors: {
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.disabled,
    notification: theme.colors.notification,
  },
};
