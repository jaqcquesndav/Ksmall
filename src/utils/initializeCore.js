/**
 * This file helps ensure that React Native core modules are properly initialized
 * Version compatible avec Hermes - sans require()
 */

// Importer les polyfills avec ES Modules plutôt que require()
import 'node-libs-react-native/globals';
import { Buffer as BufferPolyfill } from 'buffer';
import { Text, AppRegistry } from 'react-native';

// Make sure Text component gets registered early (prevents another common error)
try {
  // @ts-ignore - Force early registration
  Text.render;
} catch (e) {
  // Ignorer les erreurs
}

// Polyfill console if needed - Hermes compatible
if (!global.console) {
  global.console = {
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
  };
}

// Fix for the domain property error - CRUCIAL FIX and Hermes-compatible
if (typeof global.process === 'undefined') {
  global.process = {};
}
if (global.process && typeof global.process.domain === 'undefined') {
  global.process.domain = null;
}

// Ensure global Buffer is available - with error handling for Hermes
if (typeof global.Buffer === 'undefined') {
  try {
    // Utiliser l'import ES Modules plutôt que require()
    global.Buffer = BufferPolyfill;
  } catch (e) {
    // Fournir une implémentation minimale du Buffer
    global.Buffer = {
      from: (data) => ({ data }),
      alloc: (size) => ({ size }),
      isBuffer: () => false
    };
  }
}

// Fix for some libraries that require process.nextTick - Hermes compatible
if (!global.process.nextTick) {
  global.process.nextTick = setImmediate;
}

// Détecter si nous sommes dans l'environnement Hermes
const isHermes = !!global.HermesInternal;

// Fix the AppRegistry issue with "main" not registered - adapter pour Hermes
try {
  const originalRegisterComponent = AppRegistry.registerComponent;
  
  AppRegistry.registerComponent = function(appKey, componentProvider) {
    try {
      // Enregistrer explicitement avec main si ce n'est pas déjà fait
      if (appKey !== 'main' && !global.__MAIN_REGISTERED__) {
        try {
          originalRegisterComponent.call(AppRegistry, 'main', componentProvider);
          global.__MAIN_REGISTERED__ = true;
        } catch (innerError) {
          console.warn(`Échec de l'enregistrement de 'main':`, innerError);
        }
      }
      
      return originalRegisterComponent.call(AppRegistry, appKey, componentProvider);
    } catch (error) {
      console.warn(`Échec de l'enregistrement de '${appKey}':`, error);
      
      // Retourner une fonction pour éviter les crashes
      return componentProvider;
    }
  };
} catch (e) {
  console.warn('Impossible de patcher AppRegistry:', e.message);
}

// Informations de débogage utiles
if (global.__DEV__) {
  console.info(`Environnement: ${isHermes ? 'Hermes' : 'JSC'}`);
  console.info('initializeCore: Core modules initialized successfully');
}

export default {
  // Export a flag that can be checked to confirm this file was loaded
  initialized: true,
  isHermes
};