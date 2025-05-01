/**
 * Point d'entrée de l'application Ksmall
 * Implémente une stratégie d'initialisation robuste pour le mode offline-first
 */

// Technique d'interception d'erreur pour le runtime Hermes
try {
  // Protection pour les environnements avec le moteur Hermes
  if (typeof global !== 'undefined' && typeof global.HermesInternal !== 'undefined') {
    // Sécuriser l'accès à require pour Hermes
    if (typeof global.require === 'undefined' && typeof __r === 'function') {
      global.require = __r;
    }
  }
} catch (e) {
  // Ignorer les erreurs à ce stade, elles seront gérées par pre-init
}

// IMPORTANT: Importer le pré-init avant tout autre module
import './src/utils/pre-init';

// Imports fondamentaux
import { AppRegistry } from 'react-native';
import { registerRootComponent } from 'expo';

// Ensuite importer l'app
import App from './App';

// Vérifier si le mode offline est activé
const isOfflineMode = global && 
  global.process && 
  global.process.env && 
  global.process.env.REACT_NATIVE_OFFLINE_MODE === 'true';

// Fonction d'enregistrement sécurisée
function safeRegister() {
  try {
    // Enregistrer explicitement en tant que 'main' et 'ksmall'
    AppRegistry.registerComponent('main', () => App);
    AppRegistry.registerComponent('ksmall', () => App);
    
    // Utiliser également la méthode Expo (bonne pratique)
    registerRootComponent(App);
    
    // Marquer que l'enregistrement a réussi
    if (global) {
      global.__REGISTRATION_COMPLETE__ = true;
    }
    
    console.log(`Application initialisée avec succès (mode ${isOfflineMode ? 'OFFLINE' : 'ONLINE'})`);
  } catch (error) {
    // En cas d'erreur, nouvelle tentative avec un délai
    console.error('Erreur lors du premier enregistrement:', error);
    setTimeout(() => {
      try {
        // Deuxième tentative d'enregistrement
        AppRegistry.registerComponent('main', () => App);
        registerRootComponent(App);
        
        console.log('Enregistrement réussi lors de la deuxième tentative');
      } catch (retryError) {
        console.error('Échec de la deuxième tentative d\'enregistrement:', retryError);
      }
    }, 100);
  }
}

// Exécuter l'enregistrement immédiatement
safeRegister();