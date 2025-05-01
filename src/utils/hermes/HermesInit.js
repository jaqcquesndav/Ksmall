/**
 * HermesInit - Solution aux problèmes "require doesn't exist"
 * Ce fichier est conçu pour être le premier à s'exécuter dans un environnement Hermes
 */

// Fonction d'initialisation auto-exécutante pour isoler la portée
(function() {
  // Vérifier si nous sommes dans un environnement Hermes
  const isHermes = typeof global.HermesInternal !== 'undefined';
  
  // Stocker cette information dans la portée globale
  if (typeof global !== 'undefined') {
    global.__HERMES__ = isHermes;
    
    // Si nous sommes dans Hermes, nous avons besoin d'une implémentation sécurisée de require
    if (isHermes) {
      // Créer une implémentation de require qui est sûre et fonctionne
      // sans essayer d'utiliser le "require" natif qui n'existe pas dans Hermes
      if (typeof global.require === 'undefined') {
        // Cette version ne tente pas d'utiliser require, ce qui causerait une erreur
        global.require = function hermesRequirePolyfill(moduleId) {
          // Journaliser pour le débogage
          console.log(`[HermesPolyfill] require('${moduleId}') appelé, renvoi d'un stub`);
          
          // Retourner des stubs pour les modules courants
          if (moduleId === 'process') return global.process || {};
          if (moduleId === 'path') return { 
            join: function() { return Array.prototype.join.call(arguments, '/').replace(/\/\//g, '/'); },
            resolve: function(p) { return p; },
            dirname: function(p) { return p.split('/').slice(0, -1).join('/'); }
          };
          
          // Module par défaut pour éviter les erreurs
          return {};
        };
      }
      
      // Garantir que process existe
      if (typeof global.process === 'undefined') {
        global.process = {
          env: {},
          nextTick: function(cb) { setTimeout(cb, 0); },
          domain: null
        };
      }
      
      // Journaliser le succès de l'initialisation
      console.log('[HermesInit] Polyfills initialisés avec succès');
    }
    
    // Marquer l'initialisation comme terminée
    global.__RUNTIME_READY__ = true;
  }
  
  // Signaler que l'initialisation est terminée
  return true;
})();

// Exporter une fonction utilitaire pour détecter Hermes
export const isHermesEnabled = () => !!global.HermesInternal;

// Exporter une fonction pour vérifier si l'initialisation est terminée
export const isRuntimeReady = () => !!global.__RUNTIME_READY__;