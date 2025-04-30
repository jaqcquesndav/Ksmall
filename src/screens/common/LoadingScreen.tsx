import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as SplashScreen from 'expo-splash-screen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface LoadingScreenProps {
  firstLaunch?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ firstLaunch = false }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  // Générer un message de chargement basé sur le progrès
  useEffect(() => {
    const messages = [
      t('loading'),
      t('preparing_app'),
      t('loading_resources'),
      t('almost_ready'),
      t('finalizing')
    ];
    
    const loadingSequence = async () => {
      // Masquer l'écran de démarrage Expo si encore visible
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Ignorer si déjà masqué
      }
      
      // Animation de fondu
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      // Séquence de chargement simulée pour une meilleure UX
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.05;
        if (progress >= 1) {
          clearInterval(interval);
          progress = 1;
        }
        
        setLoadingProgress(progress);
        
        // Changer le message en fonction de l'avancement
        const messageIndex = Math.min(
          Math.floor(progress * messages.length),
          messages.length - 1
        );
        setLoadingMessage(messages[messageIndex]);
      }, firstLaunch ? 200 : 100); // Plus lent pour le premier lancement
      
      return () => clearInterval(interval);
    };
    
    loadingSequence();
  }, [t, firstLaunch, fadeAnim]);
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { opacity: fadeAnim, backgroundColor: theme.colors.background }
      ]}
    >
      <View style={styles.logoContainer}>
        {/* Remplacer l'image par une icône React Native */}
        <Icon 
          name="store" 
          size={120} 
          color={theme.colors.primary} 
        />
      </View>
      
      <ActivityIndicator 
        size="large" 
        color={theme.colors.primary} 
        style={styles.spinner} 
      />
      
      <Text style={[styles.text, { color: theme.colors.onBackground }]}>
        {loadingMessage}
      </Text>
      
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${loadingProgress * 100}%`,
              backgroundColor: theme.colors.primary
            }
          ]} 
        />
      </View>
      
      {firstLaunch && (
        <Text style={[styles.welcomeText, { color: theme.colors.secondary }]}>
          {t('welcome_first_launch')}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 4,
    width: '80%',
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default LoadingScreen;
