// Module de compatibilité pour expo-secure-store
// Ce fichier aide à résoudre le problème d'importation ES6

// Utilisation de require pour éviter les problèmes d'importation ES6
const { withPlugins } = require('@expo/config-plugins');

/**
 * Plugin de configuration pour expo-secure-store qui évite les problèmes d'importation ES6
 * @param {object} config - Configuration Expo
 * @returns {object} Configuration mise à jour
 */
function withSecureStore(config) {
  // S'assurer que les dépendances nécessaires sont bien présentes dans le projet
  if (!config.dependencies) {
    config.dependencies = {};
  }
  
  // On s'assure que expo-secure-store est bien défini dans les dépendances
  if (!config.dependencies['expo-secure-store']) {
    console.warn('expo-secure-store n\'est pas déclaré dans les dépendances. Assurez-vous de l\'installer avec: npm install expo-secure-store');
  }
  
  return withPlugins(config, [
    // Ici, vous pouvez ajouter d'autres plugins spécifiques si nécessaire
  ]);
}

// Utiliser module.exports au lieu de export default pour la compatibilité
module.exports = withSecureStore;