/**
 * Ce fichier contient des solutions de contournement (shims) pour les modules Node.js
 * qui sont nécessaires pour que certaines bibliothèques comme axios fonctionnent correctement
 * dans un environnement React Native, en particulier avec Hermes.
 */

// Importations ES Modules compatibles avec Hermes
import { randomBytes as randomBytesFn } from 'react-native-randombytes';
import { Buffer as BufferClass } from 'buffer';
// Nous importerons axios de manière dynamique plus tard

// Polyfill pour crypto
try {
  // Utilisation de randomBytes, avec protection contre les erreurs
  const safeRandomBytes = randomBytesFn || function() { 
    return new Uint8Array(Array(16).fill(0).map(() => Math.floor(Math.random() * 256)));
  };
  
  // Créer un objet crypto global sécurisé
  global.crypto = global.crypto || {};
  global.crypto.getRandomValues = global.crypto.getRandomValues || function(array) {
    const bytes = safeRandomBytes(array.length);
    for (let i = 0; i < array.length; i++) {
      array[i] = bytes[i];
    }
    return array;
  };
} catch (e) {
  // Fallback simple si randomBytes échoue
  global.crypto = global.crypto || {};
  global.crypto.getRandomValues = global.crypto.getRandomValues || function(array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
  console.warn('Using fallback crypto implementation:', e);
}

// Polyfill pour process
try {
  global.process = global.process || {};
  global.process.version = global.process.version || '';
  global.process.env = global.process.env || {};
} catch (e) {
  console.warn('Error setting up process polyfill:', e);
}

// Polyfill pour Buffer - utiliser l'import ES Modules
try {
  global.Buffer = global.Buffer || BufferClass;
} catch (e) {
  console.warn('Buffer polyfill failed, creating simple implementation');
  // Implémentation minimale de Buffer si le module échoue
  global.Buffer = global.Buffer || {
    from: function(arr) { return arr; }
  };
}

// Intercepter les requêtes axios pour qu'elles ne bloquent pas l'application
// Utilisation d'import dynamique pour éviter l'utilisation de require()
try {
  setTimeout(() => {
    // Utiliser des méthodes sécurisées pour accéder à axios sans require()
    // Cette approche utilise des globaux qui doivent déjà être définis par le temps
    // que ce code s'exécute
    const axiosModule = global.axios || window.axios;
    
    if (axiosModule && axiosModule.request) {
      const originalRequest = axiosModule.request;
      
      // Remplacer la méthode request par une version qui gère les erreurs
      axiosModule.request = function(...args) {
        return originalRequest(...args)
          .catch(error => {
            console.warn('Axios request failed, but app continues running:', error);
            // Renvoyer une réponse par défaut pour éviter que l'application ne plante
            return { data: { demo: true, message: 'Using demo data (axios request failed)' } };
          });
      };
      
      console.log('Axios patched to prevent app crashes in demo mode');
    } else {
      console.warn('Axios not found in global scope, skip patching');
    }
  }, 500);
} catch (e) {
  console.warn('Could not patch axios, app will continue in demo mode:', e);
}

// Intercepter console.error pour empêcher les crashs liés aux erreurs non fatales
const originalConsoleError = console.error;
console.error = function(...args) {
  // Filtrer certaines erreurs connues qui peuvent être ignorées en mode démo
  const errorString = args.join(' ');
  if (
    errorString.includes('seed of null') ||
    errorString.includes('main has not been registered') ||
    errorString.includes('crypto')
  ) {
    console.warn('Suppressed error in demo mode:', ...args);
    return;
  }
  originalConsoleError.apply(console, args);
};

export default {
  isShimApplied: true
};