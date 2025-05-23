/**
 * API.ts - Point d'entrée central pour les services API
 * 
 * Ce fichier exporte l'implémentation API appropriée selon la plateforme:
 * - ApiService (axios) pour iOS/Web
 * - ApiServiceWrapper (fetch) pour Android
 */

import { Platform } from 'react-native';
import logger from '../utils/logger';
import AuthApiService from './api/auth/AuthApiService';

// Importer statiquement les implémentations pour éviter require dynamique
import ApiServiceDefault from './ApiService';
import ApiServiceWrapperDefault from './ApiServiceWrapper';

// Instance d'API qui sera configurée
let api: any;

// Fonction d'initialisation sécurisée
const initializeApi = () => {
  try {
    if (Platform.OS === 'android') {
      // Utiliser l'implémentation fetch pour Android
      api = ApiServiceWrapperDefault;
      logger.info('Using fetch-based API implementation for Android');
    } else {
      // Utiliser l'implémentation axios pour iOS/Web
      api = ApiServiceDefault;
      logger.info('Using axios-based API implementation for iOS/Web');
    }
  } catch (error) {
    logger.error('Failed to initialize primary API service, using fallback', error);
    // Fallback vers ApiService comme dernière solution
    api = ApiServiceDefault;
  }
};

// Initialiser l'API immédiatement
initializeApi();

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

/**
 * Main API service that integrates all microservices
 */
const API = {
  /**
   * Authentication services
   */
  auth: AuthApiService,
  
  /**
   * Process any queued requests when coming back online
   * This should be called when the app detects a connection after being offline
   */
  async processOfflineQueue() {
    // Import statiquement pour éviter les problèmes avec require
    // et utiliser dynamic import avec la syntaxe ES qui est supportée par Hermes
    const { authHttp, accountingHttp, inventoryHttp, portfolioHttp } = await import('./api/HttpInterceptor');
    
    // Process queued requests for each service
    await authHttp.processQueue();
    await accountingHttp.processQueue();
    await inventoryHttp.processQueue();
    await portfolioHttp.processQueue();
  }
};

export { API };