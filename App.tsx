import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import DatabaseService from './src/services/DatabaseService';
import AccountingService from './src/services/AccountingService';
import { theme } from './src/theme';
import './src/i18n'; // Import translations
import logger from './src/utils/logger';

// Ignore specific harmless warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database when the app starts
        await DatabaseService.initDatabase();
        
        // Mettre à jour les transactions existantes pour calculer le total
        await DatabaseService.updateTransactionsWithTotal();
        
        // Initialiser les transactions mock pour les tests
        await AccountingService.initializeMockTransactions();
        
        logger.info('Application initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize application', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </ReduxProvider>
  );
}
