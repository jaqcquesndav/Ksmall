/**
 * HermesInit - Solution compatible ES Modules pour Hermes
 * Version sans require() pour éviter l'erreur "Property 'require' doesn't exist"
 */

// Fonction d'initialisation auto-exécutante pour isoler la portée
(function() {
  // Vérifier si nous sommes dans un environnement Hermes
  const isHermes = typeof global.HermesInternal !== 'undefined';
  
  // Stocker cette information dans la portée globale
  if (typeof global !== 'undefined') {
    global.__HERMES__ = isHermes;
    
    // Si nous sommes dans Hermes, initialiser l'environnement
    if (isHermes) {
      // IMPORTANT: Ne pas essayer de créer un polyfill pour require()
      // C'est ce qui cause l'erreur "Property 'require' doesn't exist"
      
      // Au lieu de cela, exposer directement les fonctionnalités nécessaires
      
      // Garantir que process existe
      if (typeof global.process === 'undefined') {
        global.process = {
          env: {},
          nextTick: function(cb) { setTimeout(cb, 0); },
          domain: null
        };
      }
      
      // Ajouter des utilitaires de chemin de fichier directement dans l'environnement global
      global.__pathUtils = {
        join: function() { 
          return Array.prototype.join.call(arguments, '/').replace(/\/\//g, '/');
        },
        resolve: function(p) { return p; },
        dirname: function(p) { return p.split('/').slice(0, -1).join('/'); }
      };
      
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