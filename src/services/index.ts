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

// Importer statiquement toutes les implémentations possibles (évite l'utilisation de require dynamique)
import ApiServiceDefault from './ApiService';
import ApiServiceWrapperDefault from './ApiServiceWrapper';
import ApiServiceFallbackDefault from './ApiServiceFallback';

// Instance d'API qui sera configurée
let api: any;

// Fonction d'initialisation sécurisée
const initializeApi = () => {
  try {
    if (Platform.OS === 'android') {
      // Utiliser l'implémentation basée sur fetch pour Android
      api = ApiServiceWrapperDefault;
      logger.info('Using Fetch API implementation for Android');
    } else {
      // Utiliser l'implémentation basée sur axios pour iOS et Web
      try {
        api = ApiServiceDefault;
        logger.info(`Using Axios API implementation for ${Platform.OS}`);
      } catch (axiosError) {
        // Si axios n'est pas disponible, utiliser l'implémentation basée sur fetch
        logger.warn(`Failed to load Axios implementation, falling back to Fetch`);
        api = ApiServiceWrapperDefault;
        logger.info(`Fallback: Using Fetch API implementation for ${Platform.OS}`);
      }
    }
  } catch (error) {
    // En cas d'échec complet, utiliser l'implémentation de secours
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to load API implementations: ${errorMsg}, using fallback`);
    api = ApiServiceFallbackDefault;
    logger.warn('Using Demo API implementation (no real API calls will be made)');
  }
};

// Initialiser l'API immédiatement
initializeApi();

// Exporter l'instance API sélectionnée
export { api };

// Re-exporter les autres services
export { default as AccountingService } from './AccountingService';
export { default as DatabaseService } from './DatabaseService';
export { default as TokenService } from './TokenService';
export { default as SubscriptionService } from './SubscriptionService';

// Par défaut, exporter le service API sélectionné
export default api;