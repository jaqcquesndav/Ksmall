/**
 * PRE-INIT: Résoud les erreurs critiques avant tout autre chargement
 * Ce fichier DOIT être importé avant tout autre module
 */

// Sécurisation du moteur Hermes avec la détection du runtime
if (typeof global !== 'undefined') {
  // Sauvegarder les références importantes
  const originalRequire = typeof global.require === 'function' ? global.require : undefined;
  const internalRequire = typeof global.__r === 'function' ? global.__r : undefined;

  // Garantir que require est disponible, même en cas de réinitialisation
  if (typeof global.require === 'undefined' && internalRequire) {
    global.require = internalRequire;
  }

  // Créer un require sécurisé qui vérifie si le runtime est prêt
  const safeRequire = function(path) {
    try {
      if (typeof global.require === 'function') {
        return global.require(path);
      } else if (internalRequire) {
        return internalRequire(path);
      } 
      throw new Error(`Require non disponible lors de l'accès à ${path}`);
    } catch (e) {
      console.error(`[RUNTIME ERROR] Échec du require de ${path}:`, e);
      return null;
    }
  };

  // Si require est redéfini, revenir à notre version sécurisée
  Object.defineProperty(global, 'require', {
    configurable: true,
    enumerable: false,
    get: function() {
      return safeRequire;
    },
    set: function(newRequire) {
      // Nous permettons la redéfinition mais gardons une référence
      if (typeof newRequire === 'function') {
        safeRequire._originalImpl = newRequire;
      }
    }
  });

  // Patch global.process avant tout autre code
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

  // Variables globales pour suivre l'état d'initialisation
  global.__PRELOAD_COMPLETE__ = true;
  global.__GLOBAL_PATCHED__ = Date.now();
  global.__RUNTIME_READY__ = true; // État du runtime pour compatibilité
  
  // Indicateur spécifique pour le moteur Hermes
  global.__HERMES_RUNTIME_READY__ = typeof global.HermesInternal !== 'undefined';
}

// Export un flag pour signaler que le pré-chargement est terminé
export const preloadComplete = true;

// Exposer une fonction pour vérifier l'état du runtime
export const isRuntimeReady = () => {
  return typeof global !== 'undefined' && global.__RUNTIME_READY__ === true;
};