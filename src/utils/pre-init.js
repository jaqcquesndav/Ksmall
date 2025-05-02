/**
 * PRE-INIT: Résoud les erreurs critiques avant tout autre chargement
 * Ce fichier DOIT être importé avant tout autre module
 * Version ES Modules compatible avec Hermes
 */

// Récupérer les informations initialisées par index.js
const isHermesSecured = typeof global !== 'undefined' && global.__HERMES_ENVIRONMENT_SECURED__ === true;

// Sécurisation du moteur Hermes avec la détection du runtime
if (typeof global !== 'undefined') {
  // Si nous n'avons pas déjà sécurisé l'environnement dans index.js
  if (!isHermesSecured) {
    console.log('Pre-init: Sécurisation supplémentaire de l\'environnement Hermes');
    
    // Approche ES Modules compatible avec Hermes
    // Au lieu d'utiliser require, on se base sur l'état global
    
    // Patch global.process avant tout autre code (toujours nécessaire)
    if (typeof global.process === 'undefined') {
      global.process = {};
    }
    
    // Fixer l'erreur 'Cannot read property domain of undefined'
    if (typeof global.process.domain === 'undefined') {
      global.process.domain = null;
    }
    
    // Assurer que nextTick est disponible
    if (typeof global.process.nextTick === 'undefined') {
      global.process.nextTick = function(cb) { setTimeout(cb, 0); };
    }

    // Assurer que env existe
    if (typeof global.process.env === 'undefined') {
      global.process.env = {};
    }
  }

  // Variables globales pour suivre l'état d'initialisation
  global.__PRELOAD_COMPLETE__ = true;
  global.__GLOBAL_PATCHED__ = Date.now();
  global.__RUNTIME_READY__ = true; // État du runtime pour compatibilité
  
  // Indicateur spécifique pour le moteur Hermes
  global.__HERMES_RUNTIME_READY__ = typeof global.HermesInternal !== 'undefined';
  
  // Ajouter une méthode de diagnostic pour aider au débogage
  if (typeof global.__diagnosePotentialHermesIssues !== 'function') {
    global.__diagnosePotentialHermesIssues = function() {
      console.log('---- Diagnostic Hermes ----');
      console.log('HermesInternal présent:', typeof global.HermesInternal !== 'undefined');
      console.log('setTimeout disponible:', typeof global.setTimeout === 'function');
      console.log('clearTimeout disponible:', typeof global.clearTimeout === 'function');
      console.log('process disponible:', typeof global.process === 'object');
      console.log('-------------------------');
      return {
        hermesAvailable: typeof global.HermesInternal !== 'undefined',
        runtimeReady: global.__RUNTIME_READY__ === true
      };
    };
  }
}

// Export un flag pour signaler que le pré-chargement est terminé
export const preloadComplete = true;

// Exposer une fonction pour vérifier l'état du runtime
export const isRuntimeReady = () => {
  return typeof global !== 'undefined' && global.__RUNTIME_READY__ === true;
};

// Version améliorée qui vérifie aussi Hermes
export const isHermesRuntimeReady = () => {
  return (
    typeof global !== 'undefined' && 
    global.__RUNTIME_READY__ === true && 
    global.__HERMES_RUNTIME_READY__ === true
  );
};

// Permet d'obtenir des informations sur l'état du runtime
export const getRuntimeInfo = () => {
  if (typeof global === 'undefined') {
    return { available: false };
  }
  
  return {
    available: true,
    hermes: typeof global.HermesInternal !== 'undefined',
    runtimeReady: global.__RUNTIME_READY__ === true,
    hermesReady: global.__HERMES_RUNTIME_READY__ === true,
    globalPatched: global.__GLOBAL_PATCHED__ || 0,
    preloadComplete: global.__PRELOAD_COMPLETE__ === true
  };
};

// Afficher les informations pour le débogage
if (typeof global !== 'undefined' && typeof console !== 'undefined') {
  const isHermes = typeof global.HermesInternal !== 'undefined';
  console.log(`[PRE-INIT] Initialisation terminée - Moteur: ${isHermes ? 'Hermes' : 'JSC'}`);
}