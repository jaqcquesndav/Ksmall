import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { ActivityIndicator, Surface, Title, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDatabase } from '../context/DatabaseContext';
import logger from '../utils/logger';

// Type pour l'orientation de l'écran
type Orientation = 'portrait' | 'landscape';

const SplashScreen: React.FC = () => {
  const { isInitialized, initializeDb, error } = useDatabase();
  const theme = useTheme();
  
  // État pour stocker l'orientation actuelle
  const [orientation, setOrientation] = useState<Orientation>(
    getOrientation()
  );
  
  // Fonction pour déterminer l'orientation selon les dimensions
  function getOrientation(): Orientation {
    const { width, height } = Dimensions.get('window');
    return width > height ? 'landscape' : 'portrait';
  }
  
  // Effet pour surveiller les changements d'orientation
  useEffect(() => {
    // Fonction de callback pour mettre à jour l'orientation
    const updateOrientation = () => {
      setOrientation(getOrientation());
    };
    
    // S'abonner aux événements de changement de dimensions
    const dimensionsListener = Dimensions.addEventListener('change', updateOrientation);
    
    // Nettoyage lors du démontage du composant
    return () => {
      dimensionsListener.remove();
    };
  }, []);
  
  // Effet pour initialiser la base de données
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
  
  const isLandscape = orientation === 'landscape';
  
  return (
    <View style={styles.container}>
      <View style={isLandscape ? styles.contentLandscape : styles.contentPortrait}>
        <Surface style={[
          styles.logoContainer,
          isLandscape && styles.logoContainerLandscape
        ]}>
          <MaterialCommunityIcons 
            name="calculator-variant" 
            size={isLandscape ? 80 : 120} 
            color={theme.colors.primary} 
          />
          <Title style={[
            styles.appName,
            isLandscape && styles.appNameLandscape
          ]}>KSmall</Title>
        </Surface>
        
        <View style={styles.loaderContainer}>
          <ActivityIndicator 
            size={isLandscape ? "small" : "large"} 
            color={theme.colors.primary} 
            style={styles.loader} 
          />
          
          {error && (
            <Text style={styles.errorText}>
              Une erreur est survenue. Veuillez redémarrer l'application.
            </Text>
          )}
        </View>
      </View>
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
  contentPortrait: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  contentLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: '5%',
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
  logoContainerLandscape: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 0,
    marginRight: 40,
  },
  loaderContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  appNameLandscape: {
    fontSize: 20,
    marginTop: 8,
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
