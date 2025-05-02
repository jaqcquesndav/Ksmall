/**
 * FastBootManager - Système de démarrage rapide avec gestion Hermes intégrée
 * 
 * Ce module unifie la gestion du démarrage rapide et la synchronisation
 * des états du runtime Hermes pour garantir la stabilité de l'application.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HermesDebug from './hermes-debug';

// Clés de stockage
const STORAGE_KEYS = {
  LAST_BOOT_TIME: '@fastboot/last_boot_time',
  BOOT_HISTORY: '@fastboot/history',
  PRELOADED_DATA: '@fastboot/preloaded_data',
  HERMES_STATE: '@fastboot/hermes_state'
};

// États du démarrage
const BOOT_STATES = {
  COLD_BOOT: 'cold_boot',        // Premier démarrage/démarrage après longtemps
  WARM_BOOT: 'warm_boot',        // Démarrage récent, données en cache
  RECOVERY_BOOT: 'recovery_boot' // Démarrage après erreur
};

/**
 * Synchronise tous les états liés à Hermes pour garantir la cohérence
 * Cela unifie les marqueurs d'état à travers les différentes couches de l'application
 */
export const synchronizeHermesState = () => {
  if (typeof global === 'undefined') {
    console.warn('[FastBootManager] Impossible de synchroniser Hermes: global non défini');
    return false;
  }
  
  try {
    // Utiliser HermesDebug pour la synchronisation
    const syncResult = HermesDebug.synchronizeWithFastBoot();
    
    // Enregistrer le dernier moment de synchronisation
    global.__HERMES_STATE_SYNCHRONIZED__ = Date.now();
    
    // Enregistrer l'état pour référence future
    AsyncStorage.setItem(
      STORAGE_KEYS.HERMES_STATE, 
      JSON.stringify({
        timestamp: global.__HERMES_STATE_SYNCHRONIZED__,
        hermesEnabled: HermesDebug.isHermesEnabled(),
        runtimeReady: HermesDebug.isRuntimeReady(),
        syncActions: syncResult.actions
      })
    ).catch(e => console.warn('[FastBootManager] Erreur lors de l\'enregistrement de l\'état:', e));
    
    return true;
  } catch (error) {
    console.error('[FastBootManager] Erreur lors de la synchronisation Hermes:', error);
    // Tenter une réparation d'urgence
    try {
      HermesDebug.fixHermesRequireIssue(true);
    } catch (e) {
      // Dernier recours
      console.error('[FastBootManager] Échec de la réparation d\'urgence:', e);
    }
    return false;
  }
};

/**
 * Configurer un détecteur d'erreurs en temps réel pour Hermes
 */
export const setupHermesErrorDetector = () => {
  if (typeof global === 'undefined' || typeof global.ErrorUtils === 'undefined') {
    return false;
  }
  
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Vérifier si l'erreur est liée à Hermes
    const isHermesIssue = error && (
      (error.message && (
        error.message.includes('Hermes') || 
        error.message.includes('require') || 
        error.message.includes('undefined is not an object')
      )) ||
      (error.name && error.name.includes('Hermes'))
    );
    
    // Si c'est une erreur Hermes, essayer de la corriger et la journaliser
    if (isHermesIssue) {
      console.warn('[FastBootManager] Erreur Hermes détectée, tentative de correction...');
      
      // Journaliser l'erreur
      HermesDebug.logHermesError(error, { 
        isFatal, 
        detectedBy: 'FastBootManager',
        timestamp: Date.now()
      }).catch(() => {});
      
      // Tenter une réparation immédiate
      try {
        synchronizeHermesState();
        HermesDebug.fixHermesRequireIssue(true);
      } catch (repairError) {
        console.error('[FastBootManager] Échec de la réparation:', repairError);
      }
    }
    
    // Appeler le gestionnaire d'erreurs original
    if (typeof originalHandler === 'function') {
      originalHandler(error, isFatal);
    }
  });
  
  return true;
};

/**
 * Détermine le type de démarrage à effectuer
 */
export const determineBootType = async () => {
  try {
    const lastBootTimeStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_BOOT_TIME);
    const now = Date.now();
    
    if (!lastBootTimeStr) {
      return BOOT_STATES.COLD_BOOT;
    }
    
    const lastBootTime = parseInt(lastBootTimeStr, 10);
    const timeSinceLastBoot = now - lastBootTime;
    
    // Si le dernier démarrage date de moins de 30 minutes
    if (timeSinceLastBoot < 30 * 60 * 1000) {
      // Vérifier l'état Hermes pour décider si on fait un démarrage de récupération
      const hermesStateStr = await AsyncStorage.getItem(STORAGE_KEYS.HERMES_STATE);
      if (hermesStateStr) {
        const hermesState = JSON.parse(hermesStateStr);
        // Si l'état Hermes n'était pas prêt lors du dernier démarrage
        if (hermesState && !hermesState.runtimeReady) {
          return BOOT_STATES.RECOVERY_BOOT;
        }
      }
      return BOOT_STATES.WARM_BOOT;
    }
    
    return BOOT_STATES.COLD_BOOT;
  } catch (error) {
    console.error('[FastBootManager] Erreur lors de la détermination du type de démarrage:', error);
    return BOOT_STATES.COLD_BOOT; // Par défaut, démarrage à froid
  }
};

/**
 * Enregistre l'heure et le type du démarrage actuel
 */
export const recordBootEvent = async (bootType) => {
  const now = Date.now();
  
  try {
    // Enregistrer l'heure du démarrage
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_BOOT_TIME, now.toString());
    
    // Collecter des informations sur le démarrage
    const bootInfo = {
      timestamp: now,
      type: bootType,
      platform: Platform.OS,
      hermesEnabled: HermesDebug.isHermesEnabled(),
      runtimeReady: HermesDebug.isRuntimeReady()
    };
    
    // Récupérer l'historique des démarrages
    const bootHistoryStr = await AsyncStorage.getItem(STORAGE_KEYS.BOOT_HISTORY);
    const bootHistory = bootHistoryStr ? JSON.parse(bootHistoryStr) : [];
    
    // Ajouter le nouveau démarrage et limiter à 10 entrées
    bootHistory.unshift(bootInfo);
    if (bootHistory.length > 10) bootHistory.pop();
    
    // Enregistrer l'historique mis à jour
    await AsyncStorage.setItem(STORAGE_KEYS.BOOT_HISTORY, JSON.stringify(bootHistory));
    
    return true;
  } catch (error) {
    console.warn('[FastBootManager] Erreur lors de l\'enregistrement du démarrage:', error);
    return false;
  }
};

/**
 * Récupère les données préchargées pour un démarrage rapide
 */
export const getPreloadedData = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PRELOADED_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('[FastBootManager] Erreur lors de la récupération des données préchargées:', error);
    return null;
  }
};

/**
 * Enregistre les données pour un prochain démarrage rapide
 */
export const savePreloadedData = async (data) => {
  if (!data) return false;
  
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PRELOADED_DATA, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('[FastBootManager] Erreur lors de la sauvegarde des données:', error);
    return false;
  }
};

/**
 * Gère le processus complet de démarrage rapide
 * @param {Function} onDataLoaded Callback appelé avec les données préchargées
 * @param {Function} loadFreshData Fonction pour charger des données fraîches si nécessaire
 */
export const manageFastBoot = async (onDataLoaded, loadFreshData) => {
  // Synchroniser l'état Hermes avant tout
  synchronizeHermesState();
  
  // Configurer le détecteur d'erreurs Hermes
  setupHermesErrorDetector();
  
  // Déterminer le type de démarrage
  const bootType = await determineBootType();
  
  // Enregistrer le démarrage actuel
  recordBootEvent(bootType);
  
  // Tenter un démarrage rapide si c'est un démarrage à chaud
  if (bootType === BOOT_STATES.WARM_BOOT) {
    const preloadedData = await getPreloadedData();
    
    if (preloadedData) {
      // S'assurer que Hermes est dans un état stable avant d'utiliser les données
      synchronizeHermesState();
      
      // Fournir les données au callback
      onDataLoaded(preloadedData);
      
      // Retourner le résultat du démarrage
      return {
        type: bootType,
        usedCache: true,
        timestamp: Date.now()
      };
    }
  }
  
  // Si c'est un démarrage à froid ou si les données préchargées ne sont pas disponibles
  const freshData = await loadFreshData();
  
  // Stocker les données fraîches pour le prochain démarrage
  if (freshData) {
    savePreloadedData(freshData);
  }
  
  // Fournir les données au callback
  onDataLoaded(freshData);
  
  // Retourner le résultat du démarrage
  return {
    type: bootType,
    usedCache: false,
    timestamp: Date.now()
  };
};

// Synchronisation initiale au chargement du module
synchronizeHermesState();

export default {
  synchronizeHermesState,
  setupHermesErrorDetector,
  determineBootType,
  recordBootEvent,
  getPreloadedData,
  savePreloadedData,
  manageFastBoot,
  BOOT_STATES
};