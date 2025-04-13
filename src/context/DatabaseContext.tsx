import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import DatabaseService from '../services/DatabaseService';
import logger from '../utils/logger';

interface DatabaseContextValue {
  isInitialized: boolean;
  db: any; // Using any for now - ideally should be properly typed
  executeQuery: (query: string, params?: any[]) => Promise<any>;
  initializeDb: () => Promise<void>; // Added this missing property
  error: Error | null; // Added this missing property
}

const DatabaseContext = createContext<DatabaseContextValue>({
  isInitialized: false,
  db: null,
  executeQuery: async () => null,
  initializeDb: async () => {}, // Default implementation
  error: null, // Default value
});

export const DatabaseProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [db, setDb] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  // Define the initializeDb function
  const initializeDb = async () => {
    try {
      // Initialize the database
      await DatabaseService.initDatabase();
      
      // Get the database connection
      const dbConnection = await DatabaseService.getDBConnection();
      setDb(dbConnection);
      
      // Set initialization to true
      setIsInitialized(true);
      setError(null);
      
      logger.info('Database initialized successfully');
    } catch (err) {
      const dbError = err instanceof Error ? err : new Error('Unknown database error');
      logger.error('Failed to initialize database:', dbError);
      setError(dbError);
      // Even if initialization fails, we set isInitialized to true
      // to allow the app to continue, potentially with reduced functionality
      setIsInitialized(true);
    }
  };

  // Execute queries using our database service
  const executeQuery = async (query: string, params: any[] = []) => {
    if (!db) {
      logger.error('Database not initialized');
      throw new Error('Database not initialized');
    }

    try {
      const [result, error] = await DatabaseService.executeQuery(db, query, params);
      
      if (error) {
        throw error;
      }
      
      return result;
    } catch (error) {
      logger.error(`Query execution failed: ${query}`, error);
      throw error;
    }
  };

  // Initialize the database on the first render
  useEffect(() => {
    initializeDb();
  }, []);

  return (
    <DatabaseContext.Provider value={{ 
      isInitialized, 
      db, 
      executeQuery, 
      initializeDb, // Expose the function
      error // Expose the error state
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => useContext(DatabaseContext);

export default DatabaseContext;
