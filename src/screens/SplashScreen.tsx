import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import logger from '../utils/logger';
import { useDatabase } from '../context/DatabaseContext';

const SplashScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isInitialized, initializeDb, error } = useDatabase();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    logger.info('SplashScreen monté');
    
    // Si la base de données n'est pas initialisée, on tente une initialisation
    if (!isInitialized && retryCount === 0) {
      logger.debug('Tentative initiale d\'initialisation de la base de données');
      initializeDb();
    }
    
    return () => {
      logger.info('SplashScreen démonté');
    };
  }, []);

  const handleRetry = async () => {
    logger.info('Tentative de réinitialisation de la base de données');
    setRetryCount(prev => prev + 1);
    await initializeDb();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>KSMall</Text>
      
      {!isInitialized && !error && (
        <>
          <ActivityIndicator 
            size="large" 
            color={theme.colors.primary} 
            style={styles.loader}
          />
          <Text style={styles.loadingText}>
            {t('initializing_database')}...
          </Text>
        </>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            {t('database_error')}
          </Text>
          <Text style={styles.errorMessage}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>
              {t('retry')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E53935',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SplashScreen;
