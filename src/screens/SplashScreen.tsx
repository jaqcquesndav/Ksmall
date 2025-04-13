import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ActivityIndicator, Surface, Title, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDatabase } from '../context/DatabaseContext';
import logger from '../utils/logger';

const SplashScreen: React.FC = () => {
  const { isInitialized, initializeDb, error } = useDatabase();
  const theme = useTheme();
  
  useEffect(() => {
    const init = async () => {
      if (!isInitialized) {
        try {
          await initializeDb();
          logger.info('Database initialized from SplashScreen');
        } catch (err) {
          logger.error('Error initializing database from SplashScreen:', err);
        }
      }
    };
    
    init();
  }, [isInitialized, initializeDb]);
  
  return (
    <View style={styles.container}>
      <Surface style={styles.logoContainer}>
        <MaterialCommunityIcons 
          name="calculator-variant" 
          size={120} 
          color={theme.colors.primary} 
        />
        <Title style={styles.appName}>KSmall</Title>
      </Surface>
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      
      {error && (
        <Text style={styles.errorText}>
          Une erreur est survenue. Veuillez redémarrer l'application.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    marginBottom: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    marginTop: 20,
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
});

export default SplashScreen;
