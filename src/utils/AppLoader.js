/**
 * AppLoader - Composant d'initialisation de l'application
 * Optimisé pour le démarrage rapide et la gestion des données préchargées
 */

import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { DatabaseContext } from '../context/DatabaseContext';
import HermesDebug from './hermes-debug';
import logger from './logger';

// Composant de contextualisation des données préchargées
const AppLoader = ({ children, initialData }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const { setDatabase, database } = useContext(DatabaseContext);

  // Initialisation des données essentielles au démarrage
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Vérifier si nous avons reçu des données préchargées pour le démarrage rapide
        if (initialData) {
          logger.info('AppLoader: Injection des données préchargées');
          
          // 1. Vérifier une dernière fois si Hermes fonctionne correctement
          if (HermesDebug.isHermesEnabled() && !HermesDebug.isRuntimeReady()) {
            logger.warn('AppLoader: Problème Hermes détecté, application du correctif');
            HermesDebug.fixHermesRequireIssue();
          }
          
          // 2. Injecter les données préchargées dans le contexte de base de données
          if (setDatabase && typeof setDatabase === 'function') {
            setDatabase(prevState => ({
              ...prevState,
              ...initialData,
              _fastBootInjected: true,
              lastFastBootTime: Date.now()
            }));
          } else {
            logger.error('AppLoader: setDatabase non disponible dans le contexte');
          }
          
          // 3. Marquer comme prêt immédiatement - le chargement complet est déjà planifié en arrière-plan
          setIsReady(true);
        } else {
          // Aucune donnée préchargée, l'app devrait avoir été initialisée normalement
          logger.info('AppLoader: Fonctionnement en mode normal (sans préchargement)');
          setIsReady(true);
        }
      } catch (err) {
        logger.error('AppLoader: Erreur lors de l\'initialisation', err);
        setError(err.message || 'Erreur lors du chargement de l\'application');
        
        // Même en cas d'erreur, permettre à l'application de continuer
        setIsReady(true);
      }
    };

    initializeApp();
  }, [initialData, setDatabase]);

  // Écran de chargement en cas de retard
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={{ marginTop: 20 }}>Chargement des ressources...</Text>
      </View>
    );
  }

  // Alerte en cas d'erreur, mais continuer l'affichage
  if (error) {
    // Diagnostic supplémentaire Hermes en cas d'erreur
    const isHermesEnabled = HermesDebug.isHermesEnabled();
    const runtimeInfo = isHermesEnabled ? HermesDebug.collectRuntimeInfo() : {};
    
    logger.error('Diagnostic Hermes après erreur:', {
      isHermesEnabled,
      requireAvailable: typeof global.require === 'function',
      ...runtimeInfo
    });
  }

  // Afficher l'application avec les données injectées
  return <>{children}</>;
};

export default AppLoader;