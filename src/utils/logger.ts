/**
 * Service de logging pour faciliter le débogage
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 99
};

// Régler sur DEBUG pour le développement, INFO pour la production
const CURRENT_LOG_LEVEL = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

// Activer l'écriture dans un fichier de logs si nécessaire
const WRITE_TO_FILE = false;

const logger = {
  debug: (message: string, data?: any) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, data !== undefined ? data : '');
      
      // Écrire dans un fichier si configuré
      if (WRITE_TO_FILE) {
        // Implémentation à venir si nécessaire
      }
    }
  },
  
  info: (message: string, data?: any) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, data !== undefined ? data : '');
    }
  },
  
  warn: (message: string, data?: any) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, data !== undefined ? data : '');
    }
  },
  
  error: (message: string, error?: any, p0?: string) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`);
      if (error) {
        console.error(error);
        
        // Log la stack trace complète si disponible
        if (error.stack) {
          console.error(`Stack trace: ${error.stack}`);
        }
      }
    }
  }
};

export default logger;
