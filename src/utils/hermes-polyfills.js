/**
 * hermes-polyfills.js - Solution spécifique pour Expo Go avec Hermes
 * Version compatible ES Modules sans référence à require
 */

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
      
      // IMPORTANT: Ne pas essayer de créer un polyfill pour require()
      // C'est ce qui cause l'erreur "Property 'require' doesn't exist"
      // Au lieu de cela, utiliser des alternatives comme l'importation dynamique
      
      // Mettre à disposition les fonctionnalités nécessaires directement dans l'environnement global
      
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
      
      // Ajouter des utilitaires courants directement disponibles globalement
      global.__pathUtils = {
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