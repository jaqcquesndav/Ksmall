import React, { createContext, useState, useContext, ReactNode } from 'react';
import { DefaultTheme, MD3DarkTheme } from 'react-native-paper'; // Utilisation de MD3DarkTheme
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme types
export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: typeof DefaultTheme;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
  toggleTheme: () => void;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: DefaultTheme,
  themeType: 'light',
  setThemeType: () => {},
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeType, setThemeType] = useState<ThemeType>('light');
  
  // Load saved theme preference on component mount
  React.useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@theme_preference');
        if (savedTheme !== null) {
          setThemeType(savedTheme as ThemeType);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Save theme preference whenever it changes
  React.useEffect(() => {
    const saveThemePreference = async () => {
      try {
        // Correction de la fonction (setItem au lieu de getItem)
        await AsyncStorage.setItem('@theme_preference', themeType);
      } catch (e) {
        console.error('Failed to save theme preference', e);
      }
    };
    
    saveThemePreference();
  }, [themeType]);
  
  // Determine the actual theme object based on themeType
  const theme = React.useMemo(() => {
    if (themeType === 'dark') {
      return {
        ...MD3DarkTheme, // Utilisation de MD3DarkTheme
        colors: {
          ...MD3DarkTheme.colors,
          primary: '#BB86FC',
          accent: '#03DAC6',
        }
      };
    } else {
      return {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: '#6200EE',
          accent: '#03DAC6',
        }
      };
    }
  }, [themeType]);
  
  // Toggle between light and dark
  const toggleTheme = () => {
    setThemeType(prev => prev === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, themeType, setThemeType, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);
