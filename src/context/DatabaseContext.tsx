import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import DatabaseService from '../services/DatabaseService';
import { useAuth } from './AuthContext';
import logger from '../utils/logger';

export interface DatabaseContextType {
  executeQuery: (query: string, params?: any[]) => Promise<any[]>;
  isInitialized: boolean;
  initializeDb: () => Promise<boolean>;
  error: string | null;
}

// Valeur par défaut du contexte
export const DatabaseContext = createContext<DatabaseContextType>({
  executeQuery: async () => [],
  isInitialized: false,
  initializeDb: async () => false,
  error: null
});

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Utiliser useAuth() uniquement dans le composant React, pas dans le service
  const { user } = useAuth();
  
  // Passer l'utilisateur au service quand il change
  useEffect(() => {
    // C'est ici que nous passons l'utilisateur au service
    DatabaseService.setCurrentUser(user);
    
    // Si l'utilisateur change, nous pourrions avoir besoin de réinitialiser la base de données
    if (user) {
      initializeDb();
    }
  }, [user]);

  const initializeDb = async (): Promise<boolean> => {
    try {
      logger.info('Initialisation de la base de données...');
      setError(null);
      const result = await DatabaseService.initDatabase();
      setIsInitialized(result);
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || 'Erreur inconnue lors de l\'initialisation de la base de données';
      logger.error('Échec de l\'initialisation de la base de données', err);
      setError(errorMessage);
      return false;
    }
  };

  useEffect(() => {
    // Initialiser la base de données au montage du provider
    initializeDb();
  }, []);

  const executeQuery = async (query: string, params: any[] = []): Promise<any[]> => {
    try {
      if (!isInitialized && !DatabaseService.isDbInitialized()) {
        logger.warn('Tentative d\'exécuter une requête avant l\'initialisation de la base de données');
        
        // Tentative d'initialisation au moment de la requête si nécessaire
        await initializeDb();
      }
      
      return await DatabaseService.executeQuery(query, params);
    } catch (err: any) {
      const errorMessage = err?.message || 'Erreur lors de l\'exécution de la requête SQL';
      logger.error(errorMessage, err);
      
      // En dev, propager l'erreur, en prod renvoyer un tableau vide
      if (__DEV__) {
        setError(errorMessage);
        throw err;
      }
      return [];
    }
  };

  return (
    <DatabaseContext.Provider 
      value={{ 
        executeQuery, 
        isInitialized, 
        initializeDb,
        error 
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

// Hook personnalisé pour accéder au contexte de base de données
export const useDatabase = () => {
  return useContext(DatabaseContext);
};
