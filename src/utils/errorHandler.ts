import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import logger from './logger';

// Configuration
const ERROR_COLLECTION_ENABLED = __DEV__ || true; // Activer en dev et prod initialement
const ERROR_LOG_FILE = `${FileSystem.documentDirectory}error_logs.txt`;

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
      await FileSystem.readAsStringAsync(ERROR_LOG_FILE, errorText);
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
  // Intercepte les erreurs globales
  const originalErrorHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    logger.error(`UNCAUGHT ERROR: ${isFatal ? 'FATAL' : 'NON-FATAL'}`, error);
    logErrorToFile(error, 'GlobalErrorHandler');
    
    if (isFatal && __DEV__) {
      Alert.alert(
        'Erreur critique',
        `Une erreur critique s'est produite: ${error.message}\n\nConsultez la console pour plus de détails.`,
      );
    }
    
    // Appeler le gestionnaire d'erreur original
    originalErrorHandler(error, isFatal);
  });
  
  // Pour React 16+, ajouter un ErrorBoundary au niveau supérieur de l'app
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
