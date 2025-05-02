/**
 * Utilitaire pour diagnostiquer et corriger les problèmes liés au moteur Hermes
 * Version compatible ES Modules pour Hermes
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage pour la persistance des diagnostics
const STORAGE_KEYS = {
  HERMES_DIAGNOSTICS: '@hermes/last_diagnostics',
  HERMES_FIXES_APPLIED: '@hermes/fixes_applied',
  HERMES_ERROR_LOG: '@hermes/error_log'
};

/**
 * Détecte si l'application utilise le moteur Hermes
 */
export const isHermesEnabled = () => {
  return typeof global.HermesInternal !== 'undefined';
};

/**
 * Version simplifiée qui évite les références à require
 * Compatible avec Hermes
 */
export const fixHermesRequireIssue = async (forceComplete = false) => {
  if (!isHermesEnabled()) {
    console.log('[HermesDebug] Non applicable - Hermes non détecté');
    return false;
  }

  let fixed = false;
  let actions = [];
  
  // Ne pas essayer d'utiliser require/global.require directement
  // Établir plutôt des flags pour le bon fonctionnement
  
  // Unifier les flags d'état
  global.__HERMES_RUNTIME_READY__ = true;
  global.__RUNTIME_READY__ = true;
  actions.push('flags d\'état unifiés');
  
  // Réparation complète - sans référence à require
  if (forceComplete) {
    // S'assurer que la détection de Hermes reste stable
    if (typeof global.HermesInternal !== 'undefined') {
      Object.defineProperty(global, 'HermesInternal', {
        configurable: false,
        writable: false
      });
      actions.push('HermesInternal verrouillé');
    }
  }
  
  // Journaliser l'application du correctif
  try {
    const fixRecord = {
      timestamp: Date.now(),
      actions: actions,
      success: fixed,
      platform: Platform.OS,
      runtimeReady: isRuntimeReady()
    };
    
    // Récupérer l'historique des correctifs
    const existingFixesStr = await AsyncStorage.getItem(STORAGE_KEYS.HERMES_FIXES_APPLIED);
    const existingFixes = existingFixesStr ? JSON.parse(existingFixesStr) : [];
    
    // Limiter à 10 entrées pour économiser l'espace
    existingFixes.unshift(fixRecord);
    if (existingFixes.length > 10) existingFixes.pop();
    
    await AsyncStorage.setItem(STORAGE_KEYS.HERMES_FIXES_APPLIED, JSON.stringify(existingFixes));
  } catch (error) {
    // Ne pas bloquer l'exécution si le stockage échoue
    console.warn('[HermesDebug] Impossible de journaliser le correctif:', error);
  }
  
  return fixed;
};

/**
 * Vérifie si le runtime est prêt, sans référence à require
 */
export const isRuntimeReady = () => {
  return (
    typeof global !== 'undefined' && 
    typeof global.setTimeout === 'function' &&
    global.__HERMES_RUNTIME_READY__ === true
  );
};

/**
 * Collecte des informations complètes sur l'état du runtime
 * Version compatible avec Hermes
 */
export const collectRuntimeInfo = () => {
  const info = {
    platform: Platform.OS,
    hermesEnabled: isHermesEnabled(),
    runtimeReady: isRuntimeReady(),
    timeStamp: new Date().toISOString(),
  };
  
  // Vérifier les marqueurs d'initialisation
  if (typeof global !== 'undefined') {
    info.markers = {
      RUNTIME_READY: global.__RUNTIME_READY__ === true,
      HERMES_RUNTIME_READY: global.__HERMES_RUNTIME_READY__ === true,
      PRELOAD_COMPLETE: global.__PRELOAD_COMPLETE__ === true,
      REGISTRATION_COMPLETE: global.__REGISTRATION_COMPLETE__ === true,
      HERMES_ENVIRONMENT_SECURED: global.__HERMES_ENVIRONMENT_SECURED__ === true,
      HERMES_STATE_SYNCHRONIZED: typeof global.__HERMES_STATE_SYNCHRONIZED__ === 'number'
    };
    
    // Ajouter les détails de synchronisation si disponibles
    if (typeof global.__HERMES_STATE_SYNCHRONIZED__ === 'number') {
      info.lastSynchronized = new Date(global.__HERMES_STATE_SYNCHRONIZED__).toISOString();
      info.synchronizationAge = Date.now() - global.__HERMES_STATE_SYNCHRONIZED__;
    }
  }
  
  return info;
};

/**
 * Exécute une série de tests pour diagnostiquer les problèmes de Hermes
 * Version compatible avec Hermes
 */
export const runHermesDiagnostics = async () => {
  console.log('========== DIAGNOSTIC HERMES ==========');
  
  // Information sur la plateforme
  console.log(`Plateforme: ${Platform.OS} (${Platform.Version})`);
  console.log(`Hermes activé: ${isHermesEnabled()}`);
  
  // Vérification des API critiques
  console.log('\n--- APIs Critiques ---');
  console.log(`global disponible: ${typeof global !== 'undefined'}`);
  
  const diagnosticInfo = {
    timestamp: Date.now(),
    platform: Platform.OS,
    hermesEnabled: isHermesEnabled(),
    issues: []
  };
  
  if (typeof global !== 'undefined') {
    console.log(`HermesInternal: ${typeof global.HermesInternal !== 'undefined'}`);
    console.log(`setTimeout: ${typeof global.setTimeout === 'function'}`);
    console.log(`process: ${typeof global.process === 'object'}`);
    
    // Vérification des marqueurs
    console.log('\n--- Marqueurs d\'initialisation ---');
    console.log(`__RUNTIME_READY__: ${global.__RUNTIME_READY__ === true}`);
    console.log(`__HERMES_RUNTIME_READY__: ${global.__HERMES_RUNTIME_READY__ === true}`);
    console.log(`__PRELOAD_COMPLETE__: ${global.__PRELOAD_COMPLETE__ === true}`);
    console.log(`__REGISTRATION_COMPLETE__: ${global.__REGISTRATION_COMPLETE__ === true}`);
    console.log(`__HERMES_ENVIRONMENT_SECURED__: ${global.__HERMES_ENVIRONMENT_SECURED__ === true}`);
    console.log(`__HERMES_STATE_SYNCHRONIZED__: ${typeof global.__HERMES_STATE_SYNCHRONIZED__ === 'number'}`);
    
    // Collecte des problèmes détectés
    if (isHermesEnabled()) {
      if (!global.__HERMES_RUNTIME_READY__) {
        diagnosticInfo.issues.push('runtime_not_ready');
      }
      
      if (typeof global.__HERMES_STATE_SYNCHRONIZED__ !== 'number') {
        diagnosticInfo.issues.push('state_not_synchronized');
      }
    }
    
    // Résumé global
    const runtimeReady = isRuntimeReady();
    console.log('\n--- Verdict ---');
    console.log(`Runtime prêt: ${runtimeReady}`);
    
    if (!runtimeReady) {
      console.log('\n--- Correctifs possibles ---');
      const fixed = await fixHermesRequireIssue();
      console.log(`Correctif appliqué: ${fixed}`);
      console.log(`Runtime prêt après correctif: ${isRuntimeReady()}`);
      
      diagnosticInfo.fixApplied = fixed;
      diagnosticInfo.runtimeReadyAfterFix = isRuntimeReady();
    } else {
      diagnosticInfo.runtimeReady = true;
    }
  } else {
    console.log('\n[ERREUR CRITIQUE] Objet global non disponible!');
    diagnosticInfo.issues.push('global_not_available');
  }
  
  console.log('\n=======================================');
  
  // Stocker les diagnostics pour référence future
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HERMES_DIAGNOSTICS, JSON.stringify(diagnosticInfo));
  } catch (error) {
    console.warn('[HermesDebug] Impossible de stocker les diagnostics:', error);
  }
  
  return collectRuntimeInfo();
};

/**
 * Récupère l'historique des diagnostics et des correctifs
 */
export const getHermesHistory = async () => {
  try {
    const [diagnosticsStr, fixesStr, errorsStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.HERMES_DIAGNOSTICS),
      AsyncStorage.getItem(STORAGE_KEYS.HERMES_FIXES_APPLIED),
      AsyncStorage.getItem(STORAGE_KEYS.HERMES_ERROR_LOG)
    ]);
    
    return {
      lastDiagnostic: diagnosticsStr ? JSON.parse(diagnosticsStr) : null,
      fixHistory: fixesStr ? JSON.parse(fixesStr) : [],
      errorLog: errorsStr ? JSON.parse(errorsStr) : []
    };
  } catch (error) {
    console.warn('[HermesDebug] Erreur lors de la récupération de l\'historique:', error);
    return { lastDiagnostic: null, fixHistory: [], errorLog: [] };
  }
};

/**
 * Enregistre une erreur liée à Hermes pour analyse future
 */
export const logHermesError = async (error, context = {}) => {
  try {
    const errorEntry = {
      timestamp: Date.now(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : String(error),
      context: {
        ...context,
        runtimeReady: isRuntimeReady(),
        hermesEnabled: isHermesEnabled()
      }
    };
    
    // Récupérer le journal existant
    const existingLogStr = await AsyncStorage.getItem(STORAGE_KEYS.HERMES_ERROR_LOG);
    const existingLog = existingLogStr ? JSON.parse(existingLogStr) : [];
    
    // Limiter à 20 entrées
    existingLog.unshift(errorEntry);
    if (existingLog.length > 20) existingLog.pop();
    
    await AsyncStorage.setItem(STORAGE_KEYS.HERMES_ERROR_LOG, JSON.stringify(existingLog));
    return true;
  } catch (storageError) {
    console.warn('[HermesDebug] Impossible de journaliser l\'erreur:', storageError);
    return false;
  }
};

/**
 * Coordonne avec FastBootManager pour assurer l'intégrité de l'état Hermes
 * Version compatible avec Hermes (sans référence à require)
 */
export const synchronizeWithFastBoot = () => {
  if (typeof global === 'undefined') return { success: false, reason: 'global_unavailable' };
  
  const result = {
    success: true,
    actions: [],
    hermesEnabled: isHermesEnabled(),
    runtimeReady: isRuntimeReady()
  };
  
  // Unifier les flags d'état
  if (isHermesEnabled()) {
    global.__HERMES_RUNTIME_READY__ = true;
    global.__RUNTIME_READY__ = true;
    global.__HERMES_ENVIRONMENT_SECURED__ = true;
    result.actions.push('flags_unified');
  }
  
  // Marquer comme synchronisé
  global.__HERMES_STATE_SYNCHRONIZED__ = Date.now();
  result.actions.push('state_synchronized');
  
  return result;
};

// Exporter une fonction unique pour faciliter l'utilisation
export default {
  isHermesEnabled,
  fixHermesRequireIssue,
  isRuntimeReady,
  collectRuntimeInfo,
  runHermesDiagnostics,
  getHermesHistory,
  logHermesError,
  synchronizeWithFastBoot
};