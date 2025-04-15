import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import logger from '../utils/logger';
import DatabaseService from './DatabaseService';
import AccountingService from './AccountingService';

interface ServiceInitializerProps {
  children: React.ReactNode;
}

const ServiceInitializer: React.FC<ServiceInitializerProps> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        logger.info('Initializing services...');
        
        // Initialisation de la base de données
        await DatabaseService.initDatabase();
        
        // Initialisation des tables comptables
        await DatabaseService.initAccountingTables();
        
        // Chargement des données de démonstration pour la comptabilité
        await AccountingService.initializeDemoData();
        
        // Autres services à initialiser
        // await NotificationService.initialize();
        // await AnalyticsService.initialize();
        
        // Simulate service initialization delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        logger.info('Services initialized successfully');
        setInitialized(true);
      } catch (error) {
        logger.error('Failed to initialize services', error);
        // Continue anyway to not block the app
        setInitialized(true);
      }
    };

    initializeServices();
  }, []);

  if (!initialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ServiceInitializer;
