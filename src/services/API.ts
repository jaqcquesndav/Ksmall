/**
 * API.ts - Point d'entrée central pour les services API
 * 
 * Ce fichier exporte l'implémentation API appropriée selon la plateforme:
 * - ApiService (axios) pour iOS/Web
 * - ApiServiceWrapper (fetch) pour Android
 */

import { Platform } from 'react-native';
import logger from '../utils/logger';

// Import conditionnel pour éviter le bundling d'axios sur Android
let api: any;

try {
  if (Platform.OS === 'android') {
    // Utiliser l'implémentation fetch pour Android
    const ApiServiceWrapper = require('./ApiServiceWrapper').default;
    api = ApiServiceWrapper;
    logger.info('Using fetch-based API implementation for Android');
  } else {
    // Utiliser l'implémentation axios pour iOS/Web
    const ApiService = require('./ApiService').default;
    api = ApiService;
    logger.info('Using axios-based API implementation for iOS/Web');
  }
} catch (error) {
  logger.error('Failed to initialize primary API service, using fallback', error);
  // Fallback vers ApiService comme dernière solution
  const ApiService = require('./ApiService').default;
  api = ApiService;
}

// Exporter l'instance API unique
export default api;

// Exporter les méthodes spécifiques pour plus de flexibilité
export const get = api.get.bind(api);
export const post = api.post.bind(api);
export const put = api.put.bind(api);
export const patch = api.patch.bind(api);
export const del = api.delete.bind(api);
export const uploadFile = api.uploadFile?.bind(api);
export const isDemoMode = api.isDemoMode?.bind(api);
export const enableDemoMode = api.enableDemoMode?.bind(api);