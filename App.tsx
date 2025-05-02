// Importer en premier le patcher Jimp compatible avec ES Modules
import './src/utils/jimpPatcher.js';
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, LogBox, View, Text, ActivityIndicator, AppState } from 'react-native';
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
import { api } from './src/services';
import './src/i18n';
import logger from './src/utils/logger';
import ErrorBoundary from './src/components/error/ErrorBoundary';
import NetworkStatusListener from './src/components/common/NetworkStatusListener';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import networkUtils from './src/utils/networkUtils';
import { setupErrorHandling } from './src/utils/errorHandler';
import AppLoader from './src/utils/AppLoader';
import { OFFLINE_MODE } from '@env';
import HermesDebug from './src/utils/hermes-debug';
import FastBootManager from './src/utils/fastBootManager';
import { validateAndPreloadImages } from './src/utils/imageUtils';
import { replaceNativeImageComponent } from './src/utils/imageReplacement';

// Sécuriser Hermes au démarrage (ne pas changer, essentiel au fonctionnement)
if (typeof global !== 'undefined') {
  const isHermes = typeof global.HermesInternal !== 'undefined';
  if (isHermes && typeof global.__r === 'function') {
    // Définir les structures nécessaires sans utiliser require directement
    global.__HERMES_RUNTIME_READY__ = true;
  }
}

// Configuration de base garantissant que l'app reste accessible même sans internet
// Modifier ces valeurs pour changer entre mode online/offline
global.__DEMO_MODE__ = false; 
global.__OFFLINE_MODE__ = false;

// Remplacer les images par des icônes natifs pour éviter les erreurs Jimp
replaceNativeImageComponent();

// Ancienne configuration commentée
// global.__DEMO_MODE__ = true; 
// global.__OFFLINE_MODE__ = true;

// Ignorer les avertissements non critiques
LogBox.ignoreLogs([
  'ReactNativeFiberHostComponent: Calling getNode()',
  'VirtualizedLists should never be nested',
  'Warning: componentWill',
  'Remote debugger',
  'WebSQL is deprecated',
  '[SyncService]',
  '[OfflineQueueService]'
]);

// Types d'état de démarrage
const BOOT_STATES = {
  CHECKING: 'checking',      // Vérification si démarrage rapide possible
  FAST_BOOTING: 'fast',      // Démarrage rapide en cours
  NORMAL_BOOTING: 'normal',  // Démarrage normal (complet) en cours
  READY: 'ready'             // Application prête à l'utilisation
};

// Écran de chargement amélioré avec étapes visibles
const LoadingScreen = ({ bootState, progress, message }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
    <ActivityIndicator size="large" color="#6200ee" />
    <Text style={{ marginTop: 20, fontSize: 16, textAlign: 'center' }}>
      {message || "Démarrage en cours..."}
    </Text>
    {progress > 0 && (
      <Text style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
        {Math.round(progress * 100)}%
      </Text>
    )}
  </View>
);

// Composant interne utilisant le thème du contexte
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
  // État du démarrage de l'application
  const [bootState, setBootState] = useState(BOOT_STATES.CHECKING);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootMessage, setBootMessage] = useState("Préparation de l'application...");
  const [essentialData, setEssentialData] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  
  // Tentative de démarrage rapide
  const attemptFastBoot = useCallback(async () => {
    try {
      // Vérifier si un démarrage rapide est possible
      const canDoFastBoot = await FastBootManager.canFastBoot();
      
      if (canDoFastBoot) {
        setBootState(BOOT_STATES.FAST_BOOTING);
        setBootMessage("Démarrage rapide en cours...");
        
        // Charger uniquement les données essentielles
        const data = await FastBootManager.loadEssentialData();
        setEssentialData(data);
        setBootProgress(0.9);
        
        // Terminer rapidement le démarrage
        setBootState(BOOT_STATES.READY);
        
        // Planifier la synchronisation en arrière-plan APRÈS l'affichage de l'interface
        FastBootManager.scheduleBackgroundSync(async () => {
          // Synchroniser la base de données en arrière-plan
          await DatabaseService.initializeLazy();
          // Vérifier la connectivité réseau en arrière-plan
          await networkUtils.initialize();
        });
        
        return true;
      } else {
        // Démarrage standard nécessaire
        setBootState(BOOT_STATES.NORMAL_BOOTING);
        setBootMessage("Initialisation complète...");
        return false;
      }
    } catch (error) {
      logger.warn('Erreur lors de la tentative de démarrage rapide:', error);
      setBootState(BOOT_STATES.NORMAL_BOOTING);
      return false;
    }
  }, []);

  // Processus de démarrage standard (complet)
  const performStandardBoot = useCallback(async () => {
    try {
      // Initialisation de Hermes si nécessaire
      if (HermesDebug.isHermesEnabled() && !HermesDebug.isRuntimeReady()) {
        HermesDebug.fixHermesRequireIssue();
      }
      setBootProgress(0.1);
      
      // Précharger et valider les images pour éviter l'erreur Jimp
      setBootMessage("Validation des ressources graphiques...");
      await validateAndPreloadImages();
      setBootProgress(0.2);
      
      // Initialisation séquentielle mais avec reporting de progression
      setBootMessage("Initialisation de la base de données...");
      await DatabaseService.initializeLazy();
      setBootProgress(0.4);
      
      // Configuration du mode réseau en fonction de la connectivité
      setBootMessage("Vérification de la connectivité...");
      api.enableDemoMode(false); // Désactiver le mode démo par défaut
      setBootProgress(0.7);
      
    
      setBootMessage("Vérification de la connectivité...");
      try {
        await networkUtils.initialize();
        const isOnline = await networkUtils.isNetworkAvailable().catch(() => false);
        
        // Mode hors ligne uniquement si déconnecté ou si mode forcé
        if (!isOnline || OFFLINE_MODE === 'true') {
          global.__OFFLINE_MODE__ = true;
          api.enableDemoMode(true);
        } else {
          global.__OFFLINE_MODE__ = false;
          global.__DEMO_MODE__ = false;
        }
      } catch (error) {
        // En cas d'erreur réseau, continuer en mode hors ligne
        global.__OFFLINE_MODE__ = true;
        global.__DEMO_MODE__ = true;
        api.enableDemoMode(true);
      }
    
      
      // S'assurer que les données minimales sont disponibles en mode hors ligne
      setBootMessage("Préparation des données locales...");
      try {
        await DatabaseService.ensureLocalDataAvailable();
        
        // Enregistrer les données critiques pour un démarrage rapide futur
        const criticalData = await DatabaseService.getCriticalData();
        await FastBootManager.recordSuccessfulBoot(criticalData);
      } catch (error) {
        logger.warn('Erreur lors de la préparation des données locales:', error);
      }
      
      setBootProgress(0.9);
      
      // Démarrage terminé
      setBootProgress(1.0);
      setBootState(BOOT_STATES.READY);
      
    } catch (error) {
      // En cas d'erreur, continuer en mode dégradé
      logger.error('Erreur durant le démarrage standard:', error);
      global.__DEMO_MODE__ = true;
      global.__OFFLINE_MODE__ = true;
      api.enableDemoMode(true);
      setBootState(BOOT_STATES.READY);
    }
  }, []);

  // Démarrage initial de l'application
  useEffect(() => {
    // Activer le détecteur d'erreurs Hermes en temps réel
    FastBootManager.detectRuntimeErrors();
    
    // Synchroniser l'état de Hermes avant tout
    FastBootManager.synchronizeHermesState();
    
    // Gestionnaire d'état de l'application (actif/inactif)
    const handleAppStateChange = nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // Réactiver l'app - Vérifier si des données ont changé en arrière-plan
        if (bootState === BOOT_STATES.READY) {
          networkUtils.isNetworkAvailable()
            .then(isOnline => {
              if (isOnline && !global.__OFFLINE_MODE__) {
                // Synchronisation légère à la réactivation
                DatabaseService.syncEssentialData().catch(logger.warn);
              }
            })
            .catch(() => {});
        }
      }
      setAppState(nextAppState);
    };

    // Démarrage asynchrone de l'application
    const bootApp = async () => {
      // Essayer d'abord un démarrage rapide
      const fastBootSucceeded = await attemptFastBoot();
      
      // Si le démarrage rapide échoue, faire un démarrage standard
      if (!fastBootSucceeded) {
        await performStandardBoot();
      }
    };

    // Gérer les événements liés au cycle de vie de l'application
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Lancer le démarrage de l'application
    bootApp().catch(error => {
      logger.error('Erreur fatale lors du démarrage:', error);
      setBootState(BOOT_STATES.READY); // Continuer malgré l'erreur
    });

    // Nettoyage
    return () => {
      subscription.remove();
    };
  }, [attemptFastBoot, performStandardBoot, appState, bootState]);

  // Afficher l'écran de chargement pendant le démarrage
  if (bootState !== BOOT_STATES.READY) {
    return (
      <LoadingScreen 
        bootState={bootState} 
        progress={bootProgress} 
        message={bootMessage} 
      />
    );
  }

  // Application prête - Rendu complet
  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <ThemeProvider>
          <AppLoader initialData={essentialData}>
            <ThemedApp />
          </AppLoader>
        </ThemeProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
