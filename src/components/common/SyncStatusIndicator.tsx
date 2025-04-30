import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme, Text, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import syncOrchestrator from '../../services/sync/SyncOrchestrator';
import offlineQueueService, { QueueItemStatus } from '../../services/OfflineQueueService';
import { useTranslation } from 'react-i18next';
import { useNetInfo } from '@react-native-community/netinfo';
import logger from '../../utils/logger';

/**
 * Indicateur discret de statut de synchronisation
 * Affiche uniquement un petit indicateur dans un coin de l'écran sans interférer avec l'UX
 */
const SyncStatusIndicator: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const netInfo = useNetInfo();
  const [syncState, setSyncState] = useState({
    isRunning: false,
    pendingItemsCount: 0,
    progress: 0
  });
  const [rotation] = useState(new Animated.Value(0));

  // Animation de rotation pour l'icône de synchronisation
  const startRotationAnimation = () => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  };

  // Arrêter l'animation de rotation
  const stopRotationAnimation = () => {
    rotation.stopAnimation();
    rotation.setValue(0);
  };

  // Effet pour vérifier périodiquement l'état de synchronisation
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const checkSyncStatus = async () => {
      try {
        if (!isMounted) return;

        // Vérifier si une synchronisation est en cours
        const isSyncing = syncOrchestrator.isSyncing;
        
        // Obtenir le nombre d'éléments en attente dans la file d'attente
        const pendingCount = await offlineQueueService.getQueueCount(QueueItemStatus.PENDING);
        
        // Obtenir les statistiques de synchronisation
        const stats = await syncOrchestrator.getSyncStats();
        
        if (isMounted) {
          setSyncState({
            isRunning: isSyncing,
            pendingItemsCount: pendingCount,
            progress: stats.syncProgress
          });
          
          // Gérer l'animation selon l'état
          if (isSyncing) {
            startRotationAnimation();
          } else {
            stopRotationAnimation();
          }
        }
      } catch (error) {
        logger.error('Erreur lors de la vérification du statut de synchronisation:', error);
      }
    };

    // Vérifier immédiatement l'état
    checkSyncStatus();
    
    // Puis vérifier périodiquement (toutes les 3 secondes)
    intervalId = setInterval(checkSyncStatus, 3000);

    // Nettoyage
    return () => {
      isMounted = false;
      clearInterval(intervalId);
      stopRotationAnimation();
    };
  }, []);

  // Interpolation pour l'animation de rotation
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Si l'application est hors ligne ET qu'il n'y a rien en file d'attente, ne rien afficher
  if (!netInfo.isConnected && syncState.pendingItemsCount === 0) {
    return null;
  }

  // Afficher un indicateur discret selon l'état
  return (
    <View style={[
      styles.container, 
      { backgroundColor: theme.colors.surface }
    ]}>
      {syncState.isRunning ? (
        // Synchronisation en cours
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Icon
            name="sync"
            size={16}
            color={theme.colors.primary}
          />
        </Animated.View>
      ) : syncState.pendingItemsCount > 0 ? (
        // Éléments en attente de synchronisation
        <View style={styles.pendingContainer}>
          <Icon
            name="clock-outline"
            size={16}
            color={theme.colors.notification}
          />
          <Text style={[styles.pendingText, { color: theme.colors.notification }]}>
            {syncState.pendingItemsCount}
          </Text>
        </View>
      ) : !netInfo.isConnected ? (
        // Mode hors ligne - afficher un indicateur discret
        <Icon
          name="cloud-off-outline"
          size={16}
          color={theme.colors.placeholder}
        />
      ) : (
        // Tout est synchronisé
        <Icon
          name="check-circle-outline"
          size={16}
          color={theme.colors.primary}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    zIndex: 999,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingText: {
    fontSize: 10,
    marginLeft: 2,
    fontWeight: 'bold',
  }
});

export default SyncStatusIndicator;