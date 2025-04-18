/**
 * index.ts - Sélecteur d'API par plateforme
 * 
 * Ce fichier exporte la bonne implémentation d'API en fonction de la plateforme.
 * - Pour iOS et Web: Utilise ApiService (basé sur axios)
 * - Pour Android: Utilise ApiServiceWrapper (basé sur fetch)
 * - En cas d'erreur: Utilise ApiServiceFallback (mode démo)
 */

import { Platform } from 'react-native';
import logger from '../utils/logger';

let api: any;

try {
  if (Platform.OS === 'android') {
    // Utiliser l'implémentation basée sur fetch pour Android
    const ApiServiceWrapper = require('./ApiServiceWrapper').default;
    api = ApiServiceWrapper;
    logger.info('Using Fetch API implementation for Android');
  } else {
    // Utiliser l'implémentation basée sur axios pour iOS et Web
    try {
      const ApiService = require('./ApiService').default;
      api = ApiService;
      logger.info(`Using Axios API implementation for ${Platform.OS}`);
    } catch (axiosError) {
      // Si axios n'est pas disponible, utiliser l'implémentation basée sur fetch
      logger.warn(`Failed to load Axios implementation: ${axiosError.message}, falling back to Fetch`);
      const ApiServiceWrapper = require('./ApiServiceWrapper').default;
      api = ApiServiceWrapper;
      logger.info(`Fallback: Using Fetch API implementation for ${Platform.OS}`);
    }
  }
} catch (error) {
  // En cas d'échec complet, utiliser l'implémentation de secours
  logger.error(`Failed to load API implementations: ${error.message}, using fallback`);
  const ApiServiceFallback = require('./ApiServiceFallback').default;
  api = ApiServiceFallback;
  logger.warn('Using Demo API implementation (no real API calls will be made)');
}

// Exporter l'instance API sélectionnée
export { api };

// Re-exporter les autres services
export { default as AccountingService } from './AccountingService';
export { default as DatabaseService } from './DatabaseService';
export { default as TokenService } from './TokenService';
export { default as SubscriptionService } from './SubscriptionService';

// Par défaut, exporter le service API sélectionné
export default api;