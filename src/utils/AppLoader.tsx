import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import DatabaseService from '../services/DatabaseService';
import logger from './logger';
import { AppState, Platform } from 'react-native';
import networkUtils from './networkUtils';

// Maintenir la SplashScreen visible pendant le chargement
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignorer l'erreur */
});

interface AppLoaderProps {
  children: React.ReactNode;
  initialData?: any;
}

const AppLoader = ({ children, initialData }: AppLoaderProps) => {
  const [isReady, setIsReady] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    let isMounted = true;
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isReady) {
        // L'application est revenue au premier plan après avoir été initialisée
        logger.info('Application revient au premier plan, vérification de l\'état');
      }
    });

    async function prepare() {
      try {
        // Si des données initiales sont disponibles, on peut accélérer le chargement
        if (initialData) {
          logger.info('Utilisation des données préchargées pour un démarrage rapide');
          setProgress(0.8);
          
          // Attendre un court instant pour permettre le rendu de l'UI
          await new Promise(resolve => setTimeout(resolve, 300));
          
          if (isMounted) {
            setIsReady(true);
          }
          return;
        }
        
        // Vérifier l'état du réseau au début
        const isNetworkAvailable = await networkUtils.isNetworkAvailable().catch(() => false);
        logger.info(`État du réseau au démarrage: ${isNetworkAvailable ? 'connecté' : 'déconnecté'}`);
        
        // Annoncer clairement si nous sommes en mode offline forcé
        if (global.__OFFLINE_MODE__) {
          logger.info('Initialisation en mode OFFLINE forcé');
        }

        // Étape 1: Charger les configurations
        if (isMounted) {
          setLoadingStep('Chargement des configurations...');
          setProgress(0.2);
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Permet le rendu de l'UI
        
        // Vérifier si c'est la première utilisation
        const isFirstLaunch = await AsyncStorage.getItem('firstLaunch') === null;
        if (isFirstLaunch) {
          // Optimisation: Ne pas charger tous les assets/données lors du premier lancement
          await AsyncStorage.setItem('firstLaunch', 'false');
          logger.info('Premier lancement de l\'application détecté');
        }

        // Étape 2: Initialiser la base de données mais de manière optimisée
        if (isMounted) {
          setLoadingStep('Initialisation de la base de données...');
          setProgress(0.4);
        }
        
        // Vérifier si la base de données est déjà ouverte pour éviter les conflits
        const dbStatus = await DatabaseService.getStatus();
        if (!dbStatus.isOpen) {
          await DatabaseService.initializeLazy(); // Méthode modifiée qui charge seulement l'essentiel
          logger.info('Base de données initialisée avec succès');
        } else {
          logger.info('Base de données déjà initialisée');
        }
        
        // Étape 3: Précharger les données essentielles de manière asynchrone
        if (isMounted) {
          setLoadingStep('Chargement des données essentielles...');
          setProgress(0.7);
        }

        // Précharger uniquement ce qui est nécessaire en fonction du statut réseau
        if (global.__OFFLINE_MODE__ || !isNetworkAvailable) {
          // En mode offline, s'assurer que les données locales sont accessibles
          await DatabaseService.ensureLocalDataAvailable();
          logger.info('Données locales vérifiées et disponibles');
        }

        // Étape 4: Finalisation
        if (isMounted) {
          setLoadingStep('Finalisation...');
          setProgress(1);
        }
        logger.info('Application prête à utiliser');
        
        // Délai court pour une meilleure UX
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (isMounted) {
          setIsReady(true);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erreur inconnue';
        logger.error('Erreur de chargement initial:', e);
        
        if (isMounted) {
          setError(`Erreur lors de l'initialisation: ${errorMessage}`);
          // Même en cas d'erreur, on continue après un court délai
          setTimeout(() => {
            if (isMounted) {
              setIsReady(true);
            }
          }, 1500);
        }
      } finally {
        try {
          // Masquer l'écran de démarrage seulement si l'application est toujours montée
          if (isMounted) {
            await SplashScreen.hideAsync();
          }
        } catch (splashError) {
          logger.warn('Erreur lors de la fermeture de SplashScreen:', splashError);
        }
      }
    }

    prepare();

    // Nettoyage lors du démontage du composant
    return () => {
      isMounted = false;
      appStateSubscription.remove();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{error || loadingStep}</Text>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${progress * 100}%`,
                backgroundColor: error ? '#e53935' : theme.colors.primary
              }
            ]} 
          />
        </View>
        {error && (
          <Text style={styles.errorText}>
            L'application continuera en mode limité
          </Text>
        )}
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  progressBarContainer: {
    height: 4,
    width: '80%',
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  errorText: {
    marginTop: 10,
    color: '#e53935',
    fontSize: 14,
  }
});

export default AppLoader;