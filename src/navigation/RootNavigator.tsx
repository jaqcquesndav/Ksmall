import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import AppNavigator from './AppNavigator';
import LoadingScreen from '../screens/common/LoadingScreen';
import { RootStackParamList } from './types';
import SyncStatusIndicator from '../components/common/SyncStatusIndicator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import syncOrchestrator from '../services/sync/SyncOrchestrator';
import NetInfo from '@react-native-community/netinfo';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Vérifier si c'est le premier lancement
        const firstLaunch = await AsyncStorage.getItem('first_launch') === null;
        setIsFirstLaunch(firstLaunch);
        
        if (firstLaunch) {
          await AsyncStorage.setItem('first_launch', 'false');
        }

        // Pour le premier lancement, augmenter légèrement le délai pour permettre
        // une meilleure expérience utilisateur
        const delay = firstLaunch ? 1500 : 800;
        
        // Timer réduit pour améliorer l'expérience de chargement
        const timer = setTimeout(() => {
          setIsInitializing(false);
        }, delay);

        // Vérifier la connectivité réseau
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected && user && !firstLaunch) {
          // Pour les lancements suivants, démarrer une synchronisation simplifiée
          // au lieu d'utiliser optimizedInitialSync qui pose problème
          setTimeout(() => {
            // Utiliser startBackgroundSync qui est plus fiable que optimizedInitialSync
            syncOrchestrator.startBackgroundSync({
              technical: { batchProcessing: true, batchSize: 20 }
            }).catch(err => {
              logger.error('Erreur lors de la synchronisation initiale:', err);
            });
          }, 2000); // Démarrer après un délai pour ne pas surcharger le lancement
        }

        return () => clearTimeout(timer);
      } catch (error) {
        logger.error('Erreur lors de l\'initialisation:', error);
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [user]);

  if (isInitializing || loading) {
    return <LoadingScreen firstLaunch={isFirstLaunch} />;
  }

  return (
    <>
      <AppNavigator />
      <SyncStatusIndicator />
    </>
  );
};

export default RootNavigator;
