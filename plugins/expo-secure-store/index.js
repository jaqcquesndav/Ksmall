// Plugin de configuration personnalisé pour expo-secure-store
import { withAndroidManifest, withInfoPlist } from '@expo/config-plugins';
import withSecureStore from './withSecureStore.js';
import SecureStoreAPI from './SecureStoreWrapper.js';

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

// Export par défaut pour Expo (recherche un export par défaut pour les plugins de configuration)
export default withExpoSecureStore;

// API SecureStore exportée comme propriétés individuelles
export const setItemAsync = SecureStoreAPI.setItemAsync;
export const getItemAsync = SecureStoreAPI.getItemAsync;
export const deleteItemAsync = SecureStoreAPI.deleteItemAsync;
export const isAvailableAsync = SecureStoreAPI.isAvailableAsync;