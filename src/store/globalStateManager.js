/**
 * Gestionnaire d'état global simplifié pour l'application
 * Permet aux données préchargées d'être partagées entre les composants
 */

// État global de l'application
const globalState = {
  userData: null,
  appSettings: null,
  lastSync: null,
  offlineMode: true,
  syncProgress: null,
};

// Abonnés qui seront notifiés des changements
const subscribers = [];

/**
 * Met à jour l'état global de l'application
 * @param {string} key La clé à mettre à jour
 * @param {any} value La nouvelle valeur
 */
export const setGlobalState = (key, value) => {
  if (key in globalState) {
    globalState[key] = value;
    notifySubscribers(key, value);
  } else {
    console.warn(`Tentative de définir une propriété non déclarée dans l'état global: ${key}`);
  }
};

/**
 * Obtient l'état global actuel de l'application
 * @param {string|null} key La clé spécifique à récupérer, ou null pour tout l'état
 * @returns {any} La valeur de l'état
 */
export const getGlobalState = (key = null) => {
  if (key === null) {
    return { ...globalState };
  }
  return globalState[key];
};

/**
 * S'abonne aux changements d'état global
 * @param {Function} callback La fonction à appeler lorsque l'état change
 * @returns {Function} Une fonction pour se désabonner
 */
export const subscribeToGlobalState = (callback) => {
  subscribers.push(callback);
  return () => {
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  };
};

/**
 * Notifie les abonnés des changements d'état
 * @param {string} key La clé qui a changé
 * @param {any} value La nouvelle valeur
 */
const notifySubscribers = (key, value) => {
  subscribers.forEach(callback => {
    try {
      callback(key, value, { ...globalState });
    } catch (error) {
      console.error('Erreur dans un abonné au state global:', error);
    }
  });
};

/**
 * Réinitialise l'état global aux valeurs par défaut
 */
export const resetGlobalState = () => {
  Object.keys(globalState).forEach(key => {
    globalState[key] = null;
  });
  globalState.offlineMode = true;
  notifySubscribers('reset', null);
};

export default {
  setGlobalState,
  getGlobalState,
  subscribeToGlobalState,
  resetGlobalState,
};