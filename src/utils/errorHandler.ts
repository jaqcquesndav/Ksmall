import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import logger from './logger';

// Configuration
const ERROR_COLLECTION_ENABLED = __DEV__ || true; // Activer en dev et prod initialement
const ERROR_LOG_FILE = `${FileSystem.documentDirectory}error_logs.txt`;
const OFFLINE_ERRORS_STORAGE_KEY = 'ksmall_offline_errors';

// Types d'erreurs que nous pouvons gérer
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  STORAGE = 'STORAGE',
  DATABASE = 'DATABASE',
  UNKNOWN = 'UNKNOWN'
}

// Structure d'une erreur
export interface AppError {
  type: ErrorType;
  message: string;
  timestamp: number;
  data?: any;
  handled?: boolean;
  retryable: boolean;
}

// File d'attente de fonctions à réessayer
const retryQueue: { 
  func: () => Promise<any>; 
  retryCount: number; 
  maxRetries: number 
}[] = [];

// État de la connexion réseau
let isOffline = false;
let offlineErrors: AppError[] = [];

/**
 * Écrit l'erreur dans un fichier pour analyse future
 */
export const logErrorToFile = async (error: any, componentInfo?: string) => {
  if (!ERROR_COLLECTION_ENABLED) return;
  
  try {
    const timestamp = new Date().toISOString();
    const errorDetails = {
      timestamp,
      componentInfo: componentInfo || 'Not specified',
      message: error.message || String(error),
      stack: error.stack || 'No stack trace available',
      platform: Platform.OS,
      platformVersion: Platform.Version,
    };
    
    const errorText = `\n--- ERROR LOG ${timestamp} ---\n${JSON.stringify(errorDetails, null, 2)}\n`;
    
    // Vérifier si le fichier existe
    const fileInfo = await FileSystem.getInfoAsync(ERROR_LOG_FILE);
    
    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(ERROR_LOG_FILE, errorText);
    } else {
      // Ajouter au fichier existant
      await FileSystem.appendAsStringAsync(ERROR_LOG_FILE, errorText);
    }
    
    logger.debug('Error logged to file successfully');
  } catch (loggingError) {
    logger.error('Failed to write error to log file', loggingError);
  }
};

/**
 * Gestionnaire global pour les erreurs non gérées
 */
export const setupErrorHandling = () => {
  // Intercepte les erreurs globales sans utiliser require
  // Accéder directement à ErrorUtils depuis global
  const ErrorUtils = global.ErrorUtils || (Platform.OS === 'android' ? global.ErrorUtils : null);
  
  if (ErrorUtils) {
    const originalErrorHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      logger.error(`UNCAUGHT ERROR: ${isFatal ? 'FATAL' : 'NON-FATAL'}`, error);
      logErrorToFile(error, 'GlobalErrorHandler');
      
      // Gérer l'erreur avec notre système
      handleError({
        type: ErrorType.UNKNOWN,
        message: error.message || 'Erreur inconnue',
        timestamp: Date.now(),
        data: { stack: error.stack },
        retryable: false
      });
      
      if (isFatal && __DEV__) {
        Alert.alert(
          'Erreur critique',
          `Une erreur critique s'est produite: ${error.message}\n\nConsultez la console pour plus de détails.`,
        );
      }
      
      // Appeler le gestionnaire d'erreur original
      originalErrorHandler(error, isFatal);
    });
  } else {
    // Fallback si ErrorUtils n'est pas disponible
    logger.warn('ErrorUtils global non disponible, impossible de configurer le gestionnaire d\'erreurs global');
  }
  
  // Configurer la surveillance de l'état du réseau
  setupNetworkListener();
  
  // Charger les erreurs hors ligne sauvegardées
  loadOfflineErrors();
};

/**
 * Affiche une alerte à l'utilisateur en cas d'erreur
 */
export const showErrorToUser = (message: string, error?: any) => {
  logger.error(message, error);
  
  Alert.alert(
    'Erreur',
    `${message}\n${error?.message || ''}`,
    [{ text: 'OK' }]
  );
};

/**
 * Configure l'écouteur d'état du réseau
 */
const setupNetworkListener = () => {
  NetInfo.addEventListener(state => {
    const wasOffline = isOffline;
    isOffline = !state.isConnected;
    
    // Si nous passons de hors ligne à en ligne, traiter la file d'attente
    if (wasOffline && !isOffline) {
      logger.info('Connexion réseau rétablie, traitement des requêtes en attente...');
      processRetryQueue();
    }
    
    // Si nous passons de en ligne à hors ligne
    if (!wasOffline && isOffline) {
      logger.warn('Connexion réseau perdue, passage en mode hors ligne.');
    }
  });
};

/**
 * Traiter la file d'attente des fonctions à réessayer
 */
const processRetryQueue = async () => {
  if (retryQueue.length === 0) return;
  
  logger.info(`Traitement de ${retryQueue.length} requête(s) en file d'attente...`);
  
  // Copier la file d'attente et la vider
  const queueToProcess = [...retryQueue];
  retryQueue.length = 0;
  
  // Traiter chaque élément
  for (const item of queueToProcess) {
    try {
      await item.func();
      logger.info('Requête en file d\'attente traitée avec succès');
    } catch (error) {
      if (item.retryCount < item.maxRetries) {
        retryQueue.push({
          ...item,
          retryCount: item.retryCount + 1
        });
        logger.warn(`Échec de la requête en file d'attente, sera réessayée (${item.retryCount + 1}/${item.maxRetries})`);
      } else {
        handleError({
          type: ErrorType.API,
          message: 'La requête en file d\'attente a échoué définitivement après plusieurs tentatives',
          timestamp: Date.now(),
          data: error,
          retryable: false
        });
      }
    }
  }
};

/**
 * Charger les erreurs hors ligne sauvegardées
 */
const loadOfflineErrors = async () => {
  try {
    const storedErrors = await AsyncStorage.getItem(OFFLINE_ERRORS_STORAGE_KEY);
    if (storedErrors) {
      offlineErrors = JSON.parse(storedErrors);
      logger.debug(`${offlineErrors.length} erreur(s) hors ligne chargée(s)`);
    }
  } catch (error) {
    logger.error('Impossible de charger les erreurs hors ligne', error);
  }
};

/**
 * Sauvegarder les erreurs hors ligne
 */
const saveOfflineErrors = async () => {
  try {
    await AsyncStorage.setItem(OFFLINE_ERRORS_STORAGE_KEY, JSON.stringify(offlineErrors));
  } catch (error) {
    logger.error('Impossible de sauvegarder les erreurs hors ligne', error);
  }
};

/**
 * Gérer une erreur d'application
 */
export const handleError = (error: Omit<AppError, 'handled'>): void => {
  const fullError: AppError = {
    ...error,
    handled: true
  };
  
  // Journaliser l'erreur
  logger.error(`${fullError.type} erreur: ${fullError.message}`, fullError.data);
  
  // Stocker l'erreur dans le fichier de log
  logErrorToFile(fullError);
  
  // Stocker l'erreur si nous sommes hors ligne et qu'elle est réessayable
  if (isOffline && fullError.retryable) {
    offlineErrors.push(fullError);
    saveOfflineErrors();
  }
};

/**
 * Exécuter une fonction avec gestion des erreurs et réessais
 */
export const executeWithRetry = async <T>(
  func: () => Promise<T>,
  errorType: ErrorType = ErrorType.API,
  maxRetries: number = 3
): Promise<T | null> => {
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      // Vérifier si nous sommes hors ligne
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        if (retryCount === 0) {
          // Ajouter à la file d'attente pour une exécution ultérieure
          retryQueue.push({ func, retryCount: 0, maxRetries });
          
          handleError({
            type: ErrorType.NETWORK,
            message: 'Pas de connexion réseau. La requête sera réessayée lorsque la connexion sera disponible.',
            timestamp: Date.now(),
            retryable: true
          });
        }
        
        // Attendre avant la nouvelle tentative
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
        retryCount++;
        continue;
      }
      
      // Exécuter la fonction
      return await func();
    } catch (error) {
      retryCount++;
      
      // Si nous avons des tentatives restantes, réessayer
      if (retryCount <= maxRetries) {
        logger.warn(`Tentative ${retryCount}/${maxRetries} échouée, nouvel essai...`, error);
        // Attendre un délai exponentiel avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      } else {
        // Gérer l'erreur définitive
        handleError({
          type: errorType,
          message: error.message || 'Erreur lors de l\'exécution de l\'opération',
          timestamp: Date.now(),
          data: error,
          retryable: false
        });
        return null;
      }
    }
  }
  
  return null;
};

/**
 * Vérifier l'état du réseau
 */
export const isNetworkAvailable = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected === true;
};

/**
 * Obtenir les erreurs stockées hors ligne
 */
export const getOfflineErrors = (): AppError[] => {
  return [...offlineErrors];
};

/**
 * Effacer toutes les erreurs hors ligne
 */
export const clearOfflineErrors = async (): Promise<void> => {
  offlineErrors = [];
  await saveOfflineErrors();
};
