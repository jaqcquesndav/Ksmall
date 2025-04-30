import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import DatabaseService from '../services/DatabaseService';
import logger from './logger';

// Maintenir la SplashScreen visible pendant le chargement
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignorer l'erreur */
});

interface AppLoaderProps {
  children: React.ReactNode;
}

const AppLoader = ({ children }: AppLoaderProps) => {
  const [isReady, setIsReady] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    async function prepare() {
      try {
        // Étape 1: Charger les configurations
        setLoadingStep('Chargement des configurations...');
        setProgress(0.2);
        await new Promise(resolve => setTimeout(resolve, 100)); // Permet le rendu de l'UI
        
        // Vérifier si c'est la première utilisation
        const isFirstLaunch = await AsyncStorage.getItem('firstLaunch') === null;
        if (isFirstLaunch) {
          // Optimisation: Ne pas charger tous les assets/données lors du premier lancement
          await AsyncStorage.setItem('firstLaunch', 'false');
        }

        // Étape 2: Initialiser la base de données mais de manière optimisée
        setLoadingStep('Initialisation de la base de données...');
        setProgress(0.4);
        await DatabaseService.initializeLazy(); // Méthode modifiée qui charge seulement l'essentiel
        
        // Étape 3: Précharger les données essentielles de manière asynchrone
        setLoadingStep('Chargement des données essentielles...');
        setProgress(0.7);

        // Étape 4: Finalisation
        setLoadingStep('Finalisation...');
        setProgress(1);
        logger.info('Application prête à utiliser');
        
        // Délai court pour une meilleure UX
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setIsReady(true);
      } catch (e) {
        logger.error('Erreur de chargement initial:', e);
        // Continuer malgré l'erreur
        setIsReady(true);
      } finally {
        // Masquer l'écran de démarrage
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{loadingStep}</Text>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${progress * 100}%`,
                backgroundColor: theme.colors.primary
              }
            ]} 
          />
        </View>
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
});

export default AppLoader;