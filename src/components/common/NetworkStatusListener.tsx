import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { API } from '../../services/API';
import { setOfflineMode } from '../../services/auth/TokenStorage';
import { useTheme } from 'react-native-paper';
import logger from '../../utils/logger';
import syncOrchestrator from '../../services/sync/SyncOrchestrator';

/**
 * Component qui surveille l'état du réseau et gère la transition entre les modes
 * en ligne et hors ligne de manière transparente pour l'utilisateur
 */
const NetworkStatusListener: React.FC = () => {
  const netInfo = useNetInfo();
  const prevConnected = useRef<boolean | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const animatedValue = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  const syncInProgressRef = useRef<boolean>(false);
  
  // Afficher/masquer la bannière de notification
  const showNotification = (show: boolean, message: string = '') => {
    setStatusMessage(message);
    setVisible(show);
    
    Animated.timing(animatedValue, {
      toValue: show ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Masquer automatiquement après 2.5 secondes (plus rapide pour être moins intrusif)
    if (show) {
      setTimeout(() => {
        hideNotification();
      }, 2500);
    }
  };
  
  // Masquer la notification
  const hideNotification = () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };
  
  // Déclencher la synchronisation en arrière-plan
  const triggerBackgroundSync = async () => {
    // Éviter les synchronisations multiples simultanées
    if (syncInProgressRef.current) {
      logger.debug('Une synchronisation est déjà en cours, ignoré');
      return;
    }
    
    syncInProgressRef.current = true;
    
    try {
      logger.debug('Démarrage de la synchronisation en arrière-plan...');
      
      // Traiter d'abord la file d'attente hors ligne (prioritaire)
      await API.processOfflineQueue();
      
      // Lancer la synchronisation complète en arrière-plan
      await syncOrchestrator.synchronizeAll({
        forceFullSync: false,           // Utiliser les timestamps pour optimiser
        showNotifications: false,       // Pas de notifications intrusives
        resumeFromCheckpoint: true,     // Reprendre si interrompu
        batchProcessing: true,          // Traiter par lots pour économiser batterie/données
        syncTransactions: true          // S'assurer que les transactions sont synchronisées (critique)
      });
      
    } catch (error) {
      logger.error('Erreur lors de la synchronisation en arrière-plan', error);
      // Ne pas notifier l'utilisateur des erreurs de synchronisation en arrière-plan
      // mais enregistrer pour le dépannage
    } finally {
      syncInProgressRef.current = false;
    }
  };
  
  useEffect(() => {
    // Configurer un écouteur pour les changements d'état du réseau
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      try {
        // Mettre à jour l'état hors ligne dans le stockage
        await setOfflineMode(!state.isConnected);
        
        // Gérer le retour en ligne
        if (state.isConnected && prevConnected.current === false) {
          logger.info('🌐 Connexion réseau restaurée');
          
          // Informer l'utilisateur de manière très discrète
          showNotification(true, '🌐 Connexion réseau restaurée');
          
          // Lancer la synchronisation en arrière-plan avec un léger délai
          // pour ne pas ralentir l'expérience utilisateur immédiate
          setTimeout(() => {
            triggerBackgroundSync();
          }, 2000);
        }
        
        // Gérer le passage hors ligne
        if (!state.isConnected && prevConnected.current !== false) {
          logger.warn('📴 Connexion réseau perdue');
          
          // Informer l'utilisateur de manière discrète mais rassurante
          showNotification(true, '📴 Mode hors ligne activé - Vos données sont sécurisées');
        }
        
        prevConnected.current = state.isConnected;
      } catch (error) {
        logger.error('Erreur dans l\'écouteur réseau', error);
      }
    });
    
    // Vérifier l'état initial et synchroniser si nécessaire
    const checkInitialState = async () => {
      try {
        const state = await NetInfo.fetch();
        
        // Si connecté au démarrage et des données pourraient être à synchroniser
        if (state.isConnected) {
          // Démarrer une synchronisation silencieuse après un délai
          // pour ne pas ralentir le démarrage de l'application
          setTimeout(() => {
            triggerBackgroundSync();
          }, 5000);
        }
      } catch (error) {
        logger.error('Erreur lors de la vérification de l\'état réseau initial', error);
      }
    };
    
    // Exécuter la vérification initiale
    checkInitialState();
    
    // Nettoyage à la désinscription du composant
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Ce composant affiche une notification temporaire lors des changements d'état réseau
  return visible ? (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: statusMessage.includes('hors ligne') ? 
            theme.colors.error :  // Using error color instead of notification
            theme.colors.primary,
          opacity: animatedValue,
          transform: [{ translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0]
          })}]
        }
      ]}
    >
      <Text style={styles.text}>{statusMessage}</Text>
    </Animated.View>
  ) : null;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 8,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default NetworkStatusListener;