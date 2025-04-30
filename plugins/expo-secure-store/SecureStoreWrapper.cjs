// Wrapper pour le module SecureStore utilisant la syntaxe CommonJS
// Implémentation compatible avec l'environnement CommonJS

// Créer une classe d'erreur personnalisée au lieu d'utiliser UnavailabilityError
class UnavailabilityError extends Error {
  constructor(moduleName, functionName) {
    super(`The method or property ${functionName} is not available on ${moduleName}. Make sure you're using the correct API.`);
    this.name = 'UnavailabilityError';
  }
}

// Définition des méthodes de SecureStore
let SecureStore;

try {
  // Au lieu d'importer directement le module qui utilise ES6, nous allons
  // implémenter une version simplifiée du SecureStore
  SecureStore = {
    /**
     * Stocke une valeur associée à une clé dans le stockage sécurisé
     */
    setItemAsync: async (key, value, options = {}) => {
      console.warn('SecureStore: using mock implementation');
      // Implémentation simplifiée qui utilise localStorage si disponible
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return true;
      }
      return false;
    },
    
    /**
     * Récupère une valeur associée à une clé dans le stockage sécurisé
     */
    getItemAsync: async (key, options = {}) => {
      console.warn('SecureStore: using mock implementation');
      // Implémentation simplifiée qui utilise localStorage si disponible
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    },
    
    /**
     * Supprime une valeur associée à une clé dans le stockage sécurisé
     */
    deleteItemAsync: async (key, options = {}) => {
      console.warn('SecureStore: using mock implementation');
      // Implémentation simplifiée qui utilise localStorage si disponible
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return true;
      }
      return false;
    },

    /**
     * Vérifie si SecureStore est disponible sur la plateforme actuelle
     */
    isAvailableAsync: async () => {
      console.warn('SecureStore: using mock implementation');
      // Retourne true pour indiquer que notre implémentation est disponible
      return true;
    }
  };
} catch (error) {
  console.error('Failed to initialize SecureStore wrapper:', error);
  SecureStore = {
    setItemAsync: async () => Promise.reject(new UnavailabilityError('SecureStore', 'setItemAsync')),
    getItemAsync: async () => Promise.reject(new UnavailabilityError('SecureStore', 'getItemAsync')),
    deleteItemAsync: async () => Promise.reject(new UnavailabilityError('SecureStore', 'deleteItemAsync')),
    isAvailableAsync: async () => Promise.reject(new UnavailabilityError('SecureStore', 'isAvailableAsync'))
  };
}

module.exports = SecureStore;