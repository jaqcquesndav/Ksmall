import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { DatabaseProvider } from './src/context/DatabaseContext';
import { theme } from './src/theme';
import i18n from './src/localization/i18n';
import ServiceInitializer from './src/services/ServiceInitializer';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <AuthProvider>
              <DatabaseProvider>
                <ServiceInitializer>
                  <NavigationContainer>
                    <StatusBar style="auto" />
                    <AppNavigator />
                  </NavigationContainer>
                </ServiceInitializer>
              </DatabaseProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </PaperProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
