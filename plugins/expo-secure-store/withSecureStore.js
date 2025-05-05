// Module de compatibilité pour expo-secure-store avec syntaxe ES6
// Ce fichier aide à résoudre le problème d'importation ES6

// Utilisation d'import au lieu de require
import { withPlugins } from '@expo/config-plugins';

/**
 * Plugin de configuration pour expo-secure-store
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

// Utiliser export default au lieu de module.exports
export default withSecureStore;