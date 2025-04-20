import React, { useEffect } from 'react';
import { StatusBar, LogBox, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store';
import { AuthProvider } from './src/context/AuthContext';
import { CurrencyProvider } from './src/context/CurrencyContext';
import { ThemeProvider, useThemeContext } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import DatabaseService from './src/services/DatabaseService';
import AccountingService from './src/services/AccountingService';
import { api } from './src/services'; // Importer le proxy API
import './src/i18n'; // Import translations
import logger from './src/utils/logger';
import ErrorBoundary from './src/components/error/ErrorBoundary';

// Définir la variable globale pour le mode démo
declare global {
  var __DEMO_MODE__: boolean;
}
global.__DEMO_MODE__ = Platform.OS === 'android'; // Activer automatiquement le mode démo sur Android

// Ignore specific harmless warnings
LogBox.ignoreLogs([
  'ReactNativeFiberHostComponent: Calling getNode() on the ref of an Animated component',
  'VirtualizedLists should never be nested inside plain ScrollViews'
]);

// Composant interne qui utilise le thème du contexte
const ThemedApp = () => {
  const { theme } = useThemeContext();
  
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <CurrencyProvider>
          <NavigationContainer>
            <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
            <RootNavigator />
          </NavigationContainer>
        </CurrencyProvider>
      </AuthProvider>
    </PaperProvider>
  );
};

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Si nous sommes sur Android, activer automatiquement le mode démo
        if (Platform.OS === 'android') {
          logger.info('Android platform detected, activating demo mode');
          api.enableDemoMode(true);
        }
        
        // Initialize database when the app starts
        await DatabaseService.initDatabase();
        
        // Mettre à jour les transactions existantes pour calculer le total
        await DatabaseService.updateTransactionsWithTotal();
        
        // Initialiser les transactions mock pour les tests
        await AccountingService.initializeMockTransactions();
        
        // Initialiser la base de données pour le profil d'entreprise
        await DatabaseService.initializeDatabase();
        
        logger.info(`Application initialized successfully in ${global.__DEMO_MODE__ ? 'DEMO' : 'ONLINE'} mode`);
      } catch (error) {
        // En cas d'erreur d'initialisation, activer le mode démo
        global.__DEMO_MODE__ = true;
        api.enableDemoMode(true);
        logger.error('Failed to initialize application, falling back to demo mode', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
