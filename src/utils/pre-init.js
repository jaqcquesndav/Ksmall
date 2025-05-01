/**
 * PRE-INIT: Résoud les erreurs critiques avant tout autre chargement
 * Ce fichier DOIT être importé avant tout autre module
 */

// Patch global.process avant tout autre code
if (typeof global !== 'undefined') {
  // Garantir l'existence de process
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
}

// Variables globales pour suivre l'état d'initialisation
if (typeof global !== 'undefined') {
  global.__PRELOAD_COMPLETE__ = true;
  global.__GLOBAL_PATCHED__ = Date.now();
}

// Export un flag pour signaler que le pré-chargement est terminé
export const preloadComplete = true;