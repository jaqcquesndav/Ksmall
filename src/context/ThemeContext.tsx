import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, MD3DarkTheme } from 'react-native-paper';
import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

// Theme customization options
const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1976D2', // Changé de #6200EE à #1976D2 (bleu)
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#1976D2', // Changé de #BB86FC à #1976D2 (bleu)
  },
};

// Navigation theme for dark mode
export const navigationDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#1976D2', // Changé de #BB86FC à #1976D2 (bleu)
  },
};

// Available theme colors
export const themeColors = {
  default: '#1976D2', // Changé de #6200EE à #1976D2 (bleu)
  blue: '#1976D2',
  green: '#388E3C',
  orange: '#F57C00',
  purple: '#7B1FA2'
};

// Theme context type
type ThemeContextType = {
  themeType: 'light' | 'dark';
  setThemeType: (theme: 'light' | 'dark') => void;
  theme: typeof lightTheme;
  systemTheme: boolean;
  setSystemTheme: (useSystem: boolean) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
};

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  themeType: 'light',
  setThemeType: () => {},
  theme: lightTheme,
  systemTheme: true,
  setSystemTheme: () => {},
  themeColor: themeColors.default,
  setThemeColor: () => {},
});

// Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeType, setThemeType] = useState<'light' | 'dark'>('light');
  const [systemTheme, setSystemTheme] = useState(true);
  const [themeColor, setThemeColor] = useState(themeColors.default);

  // Load saved theme preferences on mount
  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        const savedThemeType = await AsyncStorage.getItem('themeType');
        const savedSystemTheme = await AsyncStorage.getItem('systemTheme');
        const savedThemeColor = await AsyncStorage.getItem('themeColor');
        
        if (savedThemeType) {
          setThemeType(savedThemeType as 'light' | 'dark');
        }
        
        if (savedSystemTheme !== null) {
          setSystemTheme(savedSystemTheme === 'true');
        }
        
        if (savedThemeColor) {
          setThemeColor(savedThemeColor);
        }
      } catch (error) {
        console.error('Failed to load theme preferences', error);
      }
    };

    loadThemePreferences();
  }, []);

  // Save theme preferences when they change
  useEffect(() => {
    const saveThemePreferences = async () => {
      try {
        await AsyncStorage.setItem('themeType', themeType);
        await AsyncStorage.setItem('systemTheme', String(systemTheme));
        await AsyncStorage.setItem('themeColor', themeColor);
      } catch (error) {
        console.error('Failed to save theme preferences', error);
      }
    };

    saveThemePreferences();
  }, [themeType, systemTheme, themeColor]);

  // Get appropriate theme based on preferences
  const getTheme = () => {
    const activeThemeType = systemTheme ? systemColorScheme || 'light' : themeType;
    
    const baseTheme = activeThemeType === 'dark' ? darkTheme : lightTheme;
    
    // Apply custom color
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: themeColor,
      },
    };
  };

  // Handle theme type change
  const handleThemeTypeChange = (newTheme: 'light' | 'dark') => {
    setThemeType(newTheme);
  };

  // Handle system theme preference change
  const handleSystemThemeChange = (useSystem: boolean) => {
    setSystemTheme(useSystem);
  };

  // Handle theme color change
  const handleThemeColorChange = (color: string) => {
    setThemeColor(color);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeType,
        setThemeType: handleThemeTypeChange,
        theme: getTheme(),
        systemTheme,
        setSystemTheme: handleSystemThemeChange,
        themeColor,
        setThemeColor: handleThemeColorChange,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme context
export const useThemeContext = () => useContext(ThemeContext);

export default ThemeContext;
