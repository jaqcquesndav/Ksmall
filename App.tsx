import React, { useEffect } from 'react';
import { StatusBar, LogBox, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store';
import { AuthProvider } from './src/context/AuthContext';
import { CurrencyProvider } from './src/context/CurrencyContext';
import { PaymentProvider } from './src/context/PaymentContext';
import { ThemeProvider, useThemeContext } from './src/context/ThemeContext';
import { DatabaseProvider } from './src/context/DatabaseContext';
import RootNavigator from './src/navigation/RootNavigator';
import DatabaseService from './src/services/DatabaseService';
import AccountingService from './src/services/AccountingService';
import { api } from './src/services'; // Importer le proxy API
import './src/i18n'; // Import translations
import logger from './src/utils/logger';
import ErrorBoundary from './src/components/error/ErrorBoundary';
import NetworkStatusListener from './src/components/common/NetworkStatusListener';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import networkUtils from './src/utils/networkUtils';
import { setupErrorHandling, ErrorType, handleError } from './src/utils/errorHandler';
import AppLoader from './src/utils/AppLoader';
import { OFFLINE_MODE } from '@env';

// Définir la variable globale pour le mode démo
declare global {
  var __DEMO_MODE__: boolean;
  var __OFFLINE_MODE__: boolean; // Nouvelle variable pour le mode offline forcé
}
global.__DEMO_MODE__ = __DEV__ || Platform.OS === 'android'; // Activer automatiquement le mode démo sur Android et en développement
global.__OFFLINE_MODE__ = false; // Par défaut, le mode offline n'est pas forcé

// Ignore specific harmless warnings
LogBox.ignoreLogs([
  'ReactNativeFiberHostComponent: Calling getNode() on the ref of an Animated component',
  'VirtualizedLists should never be nested inside plain ScrollViews',
  'Warning: componentWill',
  'Remote debugger',
  // Ignorer les avertissements liés à SQLite en mode offline
  'WebSQL is deprecated',
  // Ignorer les avertissements liés à la synchronisation
  '[SyncService]',
  '[OfflineQueueService]'
]);

// Composant interne qui utilise le thème du contexte
const ThemedApp = () => {
  const { theme } = useThemeContext();
  
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <AuthProvider>
          <DatabaseProvider>
            <CurrencyProvider>
              <PaymentProvider>
                <NavigationContainer>
                  <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
                  <NetworkStatusListener />
                  <RootNavigator />
                </NavigationContainer>
              </PaymentProvider>
            </CurrencyProvider>
          </DatabaseProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Vérifier si l'application démarre en mode offline forcé (via les variables d'environnement)
        if (OFFLINE_MODE === 'true') {
          global.__OFFLINE_MODE__ = true;
          logger.info('Application starting in forced OFFLINE mode');
        }
        
        // Initialiser les utilitaires réseau
        await networkUtils.initialize();
        logger.info('Network utilities initialized successfully');
        
        // Vérifier si l'appareil est connecté
        const isOnline = await networkUtils.isNetworkAvailable();
        logger.info(`Device is ${isOnline ? 'online' : 'offline'}`);
        
        // Si mode offline forcé, ne pas essayer de se connecter au serveur
        if (global.__OFFLINE_MODE__) {
          global.__DEMO_MODE__ = true;
          api.enableDemoMode(true);
          logger.info('Offline mode activated, using local data only');
          return;
        }
        
        // En mode développement sur Android, vérifier si le serveur local est accessible
        if (__DEV__ && Platform.OS === 'android') {
          const isServerReachable = await networkUtils.isLocalServerReachable();
          logger.info(`Local development server is ${isServerReachable ? 'reachable' : 'not reachable'}`);
          
          // Si le serveur de développement n'est pas accessible, activer le mode démo
          if (!isServerReachable) {
            global.__DEMO_MODE__ = true;
            api.enableDemoMode(true);
            logger.info('Local server not available, falling back to demo mode');
          }
        }
        
        // Si nous sommes sur Android, activer automatiquement le mode démo
        if (Platform.OS === 'android') {
          logger.info('Android platform detected, activating demo mode');
          api.enableDemoMode(true);
        }
        
        logger.info(`Application initialized in ${global.__DEMO_MODE__ ? 'DEMO' : 'ONLINE'} mode`);
      } catch (error) {
        // En cas d'erreur d'initialisation, activer le mode démo et enregistrer l'erreur
        global.__DEMO_MODE__ = true;
        api.enableDemoMode(true);
        handleError({
          type: ErrorType.UNKNOWN,
          message: 'Failed to initialize application, falling back to demo mode',
          timestamp: Date.now(),
          data: error,
          retryable: false
        });
        logger.error('Failed to initialize application, falling back to demo mode', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <ThemeProvider>
          {/* Utiliser AppLoader pour gérer le démarrage et la synchronisation */}
          <AppLoader>
            <ThemedApp />
          </AppLoader>
        </ThemeProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
