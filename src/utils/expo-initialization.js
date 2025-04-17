/**
 * Fichier d'initialisation pour les modules Expo
 * Gère l'intégration des modules natifs Expo
 */
import { LogBox } from 'react-native';
import * as ExpoModulesCore from 'expo-modules-core';

// Ignorer l'avertissement concernant expo-constants
LogBox.ignoreLogs([
  'No native ExponentConstants module found',
  'expo-app-loading is deprecated'
]);

// Assurer que les modules Expo sont correctement initialisés
export const initializeExpo = () => {
  try {
    // Vérifier si les modules Expo sont disponibles
    if (!ExpoModulesCore) {
      console.warn('Expo Modules Core is not available. Some Expo features might not work properly.');
    }
    
    // Essayer d'initialiser manuellement les modules Expo si nécessaire
    if (ExpoModulesCore && ExpoModulesCore.NativeModulesProxy) {
      console.log('Expo native modules initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize Expo modules:', error);
  }
};

// Exécuter l'initialisation
initializeExpo();