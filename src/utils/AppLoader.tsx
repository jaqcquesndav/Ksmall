import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { isLoadingComplete } from '../navigation/isLoadingComplete';
import logger from './logger';
import syncService from '../services/sync/SyncService';
import offlineQueueService from '../services/OfflineQueueService';

/**
 * Modes de démarrage de l'application
 */
enum StartupMode {
  OFFLINE_FIRST = 'offline_first', // Priorité au contenu local, synchronisation en arrière-plan
  ONLINE_FIRST = 'online_first',   // Priorité à la synchronisation, puis affiche le contenu
  FORCE_OFFLINE = 'force_offline', // Force le mode hors ligne (pas de sync)
  FORCE_SYNC = 'force_sync'        // Force la synchronisation complète
}

/**
 * Contexte de démarrage de l'application
 */
interface AppStartupContext {
  isOnline: boolean;
  startupMode: StartupMode;
  pendingOperations: number;
  lastSyncTime: Date | null;
  errors: string[];
}

/**
 * Composant qui gère le chargement initial de l'application
 * avec une gestion intelligente du mode online/offline
 */
export const AppLoader = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<string>('Initialisation...');
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<AppStartupContext>({
    isOnline: false,
    startupMode: StartupMode.OFFLINE_FIRST,
    pendingOperations: 0,
    lastSyncTime: null,
    errors: []
  });

  useEffect(() => {
    const prepareApp = async () => {
      try {
        setStatus('Vérification du réseau...');
        
        // 1. Vérifier l'état du réseau
        const networkState = await NetInfo.fetch();
        const isOnline = !!networkState.isConnected;
        
        // 2. Charger les préférences de démarrage
        setStatus('Chargement des préférences...');
        const storedMode = await AsyncStorage.getItem('startup_mode');
        const startupMode = (storedMode as StartupMode) || StartupMode.OFFLINE_FIRST;
        
        // 3. Charger les informations de synchronisation
        const lastSyncTimeStr = await AsyncStorage.getItem('last_sync_time');
        const lastSyncTime = lastSyncTimeStr ? new Date(lastSyncTimeStr) : null;
        
        // 4. Vérifier s'il y a des opérations en attente
        let pendingOps = 0;
        try {
          pendingOps = await offlineQueueService.getQueueCount(undefined);
        } catch (e) {
          logger.warn('Impossible de vérifier la file d\'attente:', e);
        }
        
        // 5. Mettre à jour le contexte
        setContext({
          isOnline,
          startupMode,
          pendingOperations: pendingOps,
          lastSyncTime,
          errors: []
        });
        
        // 6. Lancer les opérations en fonction du mode de démarrage
        if (isOnline) {
          if (startupMode === StartupMode.FORCE_SYNC) {
            setStatus('Synchronisation forcée en cours...');
            try {
              await syncService.sync({
                forceFullSync: true,
                onProgress: (current, total) => {
                  setStatus(`Synchronisation complète (${current}/${total})...`);
                }
              });
            } catch (syncError) {
              logger.error('Erreur lors de la synchronisation forcée:', syncError);
              setContext(prev => ({
                ...prev,
                errors: [...prev.errors, 'Échec de la synchronisation initiale']
              }));
            }
          } else if (startupMode === StartupMode.ONLINE_FIRST) {
            setStatus('Synchronisation des données...');
            try {
              await syncService.sync();
            } catch (syncError) {
              logger.error('Erreur lors de la synchronisation initiale:', syncError);
            }
          } else if (pendingOps > 0) {
            // En mode OFFLINE_FIRST, mais si on a des opérations en attente et qu'on est connecté,
            // lancer la synchronisation en arrière-plan
            setStatus('Préparation des données locales...');
            setTimeout(() => {
              syncService.sync().catch(error => {
                logger.error('Erreur lors de la synchronisation en arrière-plan:', error);
              });
            }, 2000);
          }
        }
        
        // 7. Finaliser le chargement de l'application
        setStatus('Finalisation...');
        await isLoadingComplete();
        
        // 8. Prêt à afficher l'application
        setIsReady(true);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Erreur inconnue';
        logger.error('Erreur lors du chargement de l\'application:', errorMsg);
        setError(`Erreur lors du chargement: ${errorMsg}`);
        
        // Même en cas d'erreur, essayer de démarrer l'application après un délai
        setTimeout(() => {
          setIsReady(true);
        }, 3000);
      }
    };

    prepareApp();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.message}>L'application va démarrer en mode dégradé...</Text>
        <ActivityIndicator size="large" color="#0000ff" style={styles.spinner} />
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>KSmall</Text>
        <ActivityIndicator size="large" color="#0000ff" style={styles.spinner} />
        <Text style={styles.status}>{status}</Text>
      </View>
    );
  }

  // L'application est prête à être affichée
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
  spinner: {
    marginVertical: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },
});

export default AppLoader;