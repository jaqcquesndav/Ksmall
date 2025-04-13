import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { paperTheme, navigationTheme } from './theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <NavigationContainer theme={navigationTheme}>
      <PaperProvider theme={paperTheme as any}>
        {children}
      </PaperProvider>
    </NavigationContainer>
  );
};

export default ThemeProvider;
