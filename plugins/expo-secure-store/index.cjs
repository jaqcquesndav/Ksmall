// Plugin de configuration personnalisé pour expo-secure-store
const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');
const withSecureStore = require('./withSecureStore.cjs');
const SecureStoreAPI = require('./SecureStoreWrapper.cjs');

// Ce module doit exporter une fonction de plugin par défaut pour être reconnu par Expo
const withExpoSecureStore = (config) => {
  // On applique d'abord le plugin de base
  config = withSecureStore(config);
  
  // Puis on ajoute les configurations spécifiques à Android
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    // Vérifier si les permissions ne sont pas déjà présentes
    if (!androidManifest.manifest.hasOwnProperty('uses-permission')) {
      androidManifest.manifest['uses-permission'] = [];
    }
    
    // Ajouter les permissions nécessaires pour le stockage sécurisé
    const permissions = androidManifest.manifest['uses-permission'];
    const hasStoragePermission = permissions.some(
      (permission) => permission.$?.['android:name'] === 'android.permission.WRITE_EXTERNAL_STORAGE'
    );
    
    if (!hasStoragePermission) {
      permissions.push({
        $: { 'android:name': 'android.permission.WRITE_EXTERNAL_STORAGE' },
      });
    }
    
    return config;
  });
  
  // Puis les modifications pour iOS
  config = withInfoPlist(config, (config) => {
    // Aucune modification spécifique n'est nécessaire pour iOS dans ce cas
    return config;
  });
  
  return config;
};

// Expo recherche un export par défaut pour les plugins de configuration
module.exports = withExpoSecureStore;

// API SecureStore exportée comme propriétés de l'exportation par défaut
module.exports.setItemAsync = SecureStoreAPI.setItemAsync;
module.exports.getItemAsync = SecureStoreAPI.getItemAsync;
module.exports.deleteItemAsync = SecureStoreAPI.deleteItemAsync;
module.exports.isAvailableAsync = SecureStoreAPI.isAvailableAsync;