import React, { useEffect, useState, lazy, Suspense } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from './types';
import SplashScreen from '../screens/SplashScreen';
import logger from '../utils/logger';
import LazyScreen from '../components/common/LazyScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageOptimizer from '../utils/imageOptimizer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Chargement différé des navigateurs
const AuthNavigator = lazy(() => import('./AuthNavigator'));
const MainStack = lazy(() => import('./MainStack'));

const RootStack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const [initializing, setInitializing] = useState(true);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  
  // Précharger les ressources nécessaires
  useEffect(() => {
    const preloadResources = async () => {
      try {
        // Vérifier si c'est le premier lancement ou une mise à jour
        const lastVersion = await AsyncStorage.getItem('app_last_version');
        const currentVersion = '1.0.0'; // À remplacer par la version réelle de l'application
        
        // Nettoyer le cache si nécessaire (mise à jour ou premier lancement)
        if (lastVersion !== currentVersion) {
          await ImageOptimizer.cleanCache();
          await AsyncStorage.setItem('app_last_version', currentVersion);
        }
        
        // Utilisation d'icônes natives au lieu d'images
        // Précharger les icônes en les initialisant (pas besoin de préchargement spécial)
        Icon.getImageSource('home', 30, '#000').then(() => {
          logger.debug('Icônes chargées');
        }).catch(error => {
          logger.error('Erreur de chargement des icônes:', error);
        });
        
        setResourcesLoaded(true);
        logger.debug('Ressources préchargées avec succès');
      } catch (error) {
        logger.error('Erreur lors du préchargement des ressources:', error);
        setResourcesLoaded(true); // Continuer malgré l'erreur
      }
    };

    preloadResources();
    
    // Simuler un temps de chargement réduit pour le splash screen
    const timer = setTimeout(() => {
      setInitializing(false);
      logger.debug('App initialization complete');
    }, 1000); // Réduit à 1 seconde au lieu de 2
    
    return () => clearTimeout(timer);
  }, []);
  
  if (initializing || loading || !resourcesLoaded) {
    return <SplashScreen />;
  }
  
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <RootStack.Screen name="Main">
          {props => (
            <LazyScreen
              factory={() => import('./MainStack')}
              props={props}
              loadingMessage="Chargement de l'application..."
            />
          )}
        </RootStack.Screen>
      ) : (
        <RootStack.Screen name="Auth">
          {props => (
            <LazyScreen
              factory={() => import('./AuthNavigator')}
              props={props}
              loadingMessage="Préparation de l'authentification..."
            />
          )}
        </RootStack.Screen>
      )}
    </RootStack.Navigator>
  );
};

export default AppNavigator;
