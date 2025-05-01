import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox, Platform, View, Text, ActivityIndicator } from 'react-native';
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
import { api } from './src/services'; // Importer le proxy API
import './src/i18n'; // Import translations
import logger from './src/utils/logger';
import ErrorBoundary from './src/components/error/ErrorBoundary';
import NetworkStatusListener from './src/components/common/NetworkStatusListener';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import networkUtils from './src/utils/networkUtils';
import { setupErrorHandling, ErrorType, handleError } from './src/utils/errorHandler';
import AppLoader from './src/utils/AppLoader';
import { OFFLINE_MODE } from '@env'; // Corrected import path

// Activer le mode démo/offline par défaut pour garantir un démarrage sécurisé
global.__DEMO_MODE__ = true; 
global.__OFFLINE_MODE__ = true; 

// Ignorer certains avertissements pour ne pas polluer la console
LogBox.ignoreLogs([
  'ReactNativeFiberHostComponent: Calling getNode() on the ref of an Animated component',
  'VirtualizedLists should never be nested inside plain ScrollViews',
  'Warning: componentWill',
  'Remote debugger',
  'WebSQL is deprecated',
  '[SyncService]',
  '[OfflineQueueService]'
]);

// Écran de chargement simple quand l'app démarre
const InitialLoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
    <ActivityIndicator size="large" color="#6200ee" />
    <Text style={{ marginTop: 20, fontSize: 16 }}>Démarrage en mode offline-first...</Text>
  </View>
);

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
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<Error | null>(null);

  // Initialisation immédiate de la base de données
  useEffect(() => {
    // Fonction pour initialiser la base de données de manière asynchrone
    const initDbSafely = async () => {
      try {
        // Initialiser la base de données d'abord, avant tout test réseau
        await DatabaseService.initializeLazy();
        logger.info('Base de données initialisée avec succès');
        return true;
      } catch (error) {
        logger.error('Erreur lors de l\'initialisation de la base de données:', error);
        return false;
      }
    };

    // Lancer l'initialisation de la base de données immédiatement
    initDbSafely().catch(e => logger.error(e));
  }, []);

  // Initialisation complète de l'application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Vérifier le mode offline forcé 
        if (OFFLINE_MODE === 'true') {
          global.__OFFLINE_MODE__ = true;
          logger.info('Application starting in forced OFFLINE mode');
        }
        
        // Initialiser le réseau APRÈS avoir vérifié la base de données
        try {
          await networkUtils.initialize();
          logger.info('Network utilities initialized successfully');
          
          // Vérifier la connectivité - si erreur, rester en mode offline
          const isOnline = await networkUtils.isNetworkAvailable().catch(() => false);
          logger.info(`Device is ${isOnline ? 'online' : 'offline'}`);
          
          // Rester en mode offline si déconnecté ou si mode offline forcé
          if (!isOnline || global.__OFFLINE_MODE__) {
            global.__DEMO_MODE__ = true;
            global.__OFFLINE_MODE__ = true;
            api.enableDemoMode(true);
            logger.info('Offline mode activated, using local data only');
          }
        } catch (networkError) {
          // En cas d'erreur réseau, rester en mode offline
          global.__OFFLINE_MODE__ = true;
          global.__DEMO_MODE__ = true;
          logger.warn('Network initialization failed, staying in offline mode', networkError);
          api.enableDemoMode(true);
        }
        
        // S'assurer que les données minimales sont disponibles en mode offline
        if (global.__OFFLINE_MODE__) {
          try {
            await DatabaseService.ensureLocalDataAvailable();
          } catch (dbError) {
            logger.warn('Error ensuring local data, but continuing', dbError);
          }
        }
        
        // Terminer l'initialisation
        logger.info(`Application initialized in ${global.__DEMO_MODE__ ? 'DEMO' : 'ONLINE'} mode`);
        setIsInitializing(false);
      } catch (error) {
        // En cas d'erreur globale, passer en mode offline mais continuer
        global.__DEMO_MODE__ = true;
        global.__OFFLINE_MODE__ = true;
        api.enableDemoMode(true);
        
        logger.error('Error during initialization, continuing in offline mode', error);
        setInitError(error instanceof Error ? error : new Error(String(error)));
        setIsInitializing(false);
      }
    };

    // Délai court pour laisser d'autres initialisations se terminer
    setTimeout(() => {
      initializeApp().catch(e => {
        logger.error('Unexpected initialization error', e);
        setIsInitializing(false);
      });
    }, 100);
  }, []);

  // Afficher un écran de chargement pendant l'initialisation
  if (isInitializing) {
    return <InitialLoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <ThemeProvider>
          <AppLoader>
            <ThemedApp />
          </AppLoader>
        </ThemeProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
