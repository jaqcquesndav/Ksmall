import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Pressable } from 'react-native';
import { useTheme as useNavigationTheme } from '@react-navigation/native';
import eventEmitter from '../../utils/EventEmitter';
import { SYNC_EVENTS } from '../../services/api/ApiService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface SyncIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
}

// Interface pour les données de synchronisation
interface SyncProgressData {
  completed: number;
  total: number;
}

interface SyncStartData {
  actionsCount: number;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({ position = 'top', showDetails = false }) => {
  const theme = useNavigationTheme();
  const { colors } = theme;
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgressData>({ completed: 0, total: 0 });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showSyncInfo, setShowSyncInfo] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Couleurs personnalisées
  const customColors = {
    success: '#4CAF50',
    cardBackground: colors.card
  };

  useEffect(() => {
    // S'abonner aux événements de synchronisation
    const startListener = eventEmitter.on(SYNC_EVENTS.SYNC_STARTED, (data: SyncStartData) => {
      setIsSyncing(true);
      setSyncProgress({ completed: 0, total: data.actionsCount });
      fadeIn();
    });

    const progressListener = eventEmitter.on(SYNC_EVENTS.SYNC_PROGRESS, (data: SyncProgressData) => {
      setSyncProgress({ completed: data.completed, total: data.total });
    });

    const completedListener = eventEmitter.on(SYNC_EVENTS.SYNC_COMPLETED, () => {
      setIsSyncing(false);
      setLastSyncTime(new Date());
      // Déclencher une animation de fondu pour montrer que la synchronisation est terminée
      setTimeout(() => fadeOut(), 3000);
    });

    const errorListener = eventEmitter.on(SYNC_EVENTS.SYNC_ERROR, () => {
      setIsSyncing(false);
    });

    return () => {
      // Se désabonner des événements lors du démontage du composant
      startListener();
      progressListener();
      completedListener();
      errorListener();
    };
  }, []);

  // Animations
  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const toggleSyncInfo = () => {
    setShowSyncInfo(!showSyncInfo);
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Jamais synchronisé';
    
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    
    // Moins d'une minute
    if (diff < 60 * 1000) {
      return 'À l\'instant';
    }
    
    // Moins d'une heure
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    // Moins d'un jour
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    
    // Plus d'un jour
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  };

  const progressPercent = syncProgress.total > 0 
    ? Math.floor((syncProgress.completed / syncProgress.total) * 100)
    : 0;

  return (
    <Animated.View 
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        { opacity: fadeAnim, backgroundColor: customColors.cardBackground }
      ]}
    >
      <Pressable style={styles.content} onPress={toggleSyncInfo}>
        {isSyncing ? (
          <>
            <ActivityIndicator size="small" color={colors.primary} style={styles.icon} />
            <Text style={[styles.text, { color: colors.text }]}>
              Synchronisation en cours {progressPercent > 0 && `(${progressPercent}%)`}
            </Text>
          </>
        ) : (
          <>
            <Icon 
              name="check-circle" 
              size={16} 
              color={customColors.success} 
              style={styles.icon} 
            />
            <Text style={[styles.text, { color: colors.text }]}>
              Dernière synchronisation: {formatLastSyncTime()}
            </Text>
          </>
        )}
      </Pressable>

      {showDetails && showSyncInfo && (
        <View style={[styles.detailsContainer, { backgroundColor: customColors.cardBackground }]}>
          <Text style={[styles.detailsText, { color: colors.text }]}>
            {isSyncing 
              ? `Synchronisation de ${syncProgress.completed}/${syncProgress.total} éléments`
              : `Dernière synchronisation complète : ${lastSyncTime ? lastSyncTime.toLocaleString() : 'Jamais'}`
            }
          </Text>
          
          {isSyncing && syncProgress.total > 0 && (
            <View style={styles.progressContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { backgroundColor: colors.primary, width: `${progressPercent}%` }
                ]} 
              />
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 1000,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  topPosition: {
    top: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  bottomPosition: {
    bottom: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsContainer: {
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 6,
  },
  detailsText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  }
});

export default SyncIndicator;