/**
 * hermes-polyfills.js - Solution spécifique pour Expo Go avec Hermes
 * Ce fichier corrige l'erreur : [runtime not ready]: ReferenceError: Property 'require' doesn't exist
 */

// ATTENTION: N'utilisez pas import/export dans ce fichier!
// Ce fichier doit fonctionner avec une inclusion simple sans dépendre de require/import

// Cache global pour les modules polyfills
var _hermesModuleCache = {};

// Ajouter les polyfills Hermes immédiatement (auto-exécutant)
(function() {
  try {
    console.log("[Polyfill] Initialisation des polyfills pour Hermes...");
    
    // Vérification de l'environnement Hermes
    var isHermes = typeof global.HermesInternal !== 'undefined';
    
    // Définir cette propriété pour que le reste du code sache que nous sommes dans Hermes
    if (typeof global !== 'undefined') {
      global.__HERMES__ = isHermes;
      
      // Si nous ne sommes pas dans Hermes, pas besoin des polyfills
      if (!isHermes) {
        console.log("[Polyfill] Pas d'environnement Hermes détecté, aucun polyfill nécessaire");
        global.__RUNTIME_READY__ = true;
        return;
      }
      
      // Créer un polyfill pour require() compatible avec Hermes
      if (typeof global.require === 'undefined') {
        global.require = function(id) {
          // Vérifier si nous avons déjà ce module en cache
          if (_hermesModuleCache[id]) {
            return _hermesModuleCache[id];
          }
          
          // Polyfills pour des modules standards
          var moduleContent = {};
          
          // Module 'process'
          if (id === 'process') {
            moduleContent = global.process || {
              env: { NODE_ENV: __DEV__ ? 'development' : 'production' },
              nextTick: function(cb) { setTimeout(cb, 0); },
              domain: null
            };
            global.process = moduleContent; // S'assurer que global.process existe aussi
          }
          
          // Module 'path'
          else if (id === 'path') {
            moduleContent = {
              join: function() {
                return Array.prototype.slice.call(arguments).join('/').replace(/\/+/g, '/');
              },
              resolve: function(p) { return p; },
              dirname: function(p) {
                var parts = p.split('/');
                parts.pop();
                return parts.join('/');
              }
            };
          }
          
          // Module 'crypto' minimal
          else if (id === 'crypto') {
            moduleContent = { randomBytes: function() { return new Uint8Array(16); } };
          }
          
          // Stocker en cache et retourner
          _hermesModuleCache[id] = moduleContent;
          return moduleContent;
        };
      }
      
      // Garantir que process existe et a les propriétés minimales nécessaires
      if (typeof global.process === 'undefined') {
        global.process = {};
      }
      if (typeof global.process.env === 'undefined') {
        global.process.env = { NODE_ENV: __DEV__ ? 'development' : 'production' };
      }
      if (typeof global.process.domain === 'undefined') {
        global.process.domain = null;
      }
      if (typeof global.process.nextTick === 'undefined') {
        global.process.nextTick = function(cb) { setTimeout(cb, 0); };
      }
      
      // Ajouter un indicateur global pour signaler que le runtime est prêt
      global.__RUNTIME_READY__ = true;
      global.__GLOBAL_PATCHED__ = Date.now();
      global.__OFFLINE_MODE__ = true; // Pour compatibilité avec votre code existant
      
      console.log("[Polyfill] Polyfills Hermes chargés avec succès (" + global.__GLOBAL_PATCHED__ + ")");
    }
  } catch (err) {
    console.error("[Polyfill] Erreur lors de l'initialisation des polyfills:", err);
    // Même en cas d'erreur, on marque comme prêt pour éviter les blocages
    if (typeof global !== 'undefined') {
      global.__RUNTIME_READY__ = true;
    }
  }
})();

// NE PAS ajouter d'exports ES modules ici!