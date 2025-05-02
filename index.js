/**
 * Point d'entrée de l'application Ksmall
 * Implémente une stratégie d'initialisation robuste pour le mode offline-first
 */

// PRIORITÉ ABSOLUE: Importer le patch Jimp en tout premier
// Compatible avec ES Modules et Hermes
import './src/utils/jimpPatcher.js';

// IMPORTANT: Ne rien faire avant ce bloc de sécurisation du runtime Hermes
(function secureHermesRuntime() {
  try {
    // Polyfill pour global si nécessaire
    if (typeof global === 'undefined' && typeof window !== 'undefined') {
      window.global = window;
    }
    
    // Vérifier si nous sommes dans un environnement Hermes
    const isHermes = () => !!global.HermesInternal;
    
    if (isHermes()) {
      console.log('Environnement Hermes détecté - Initialisation de sécurité');
      
      // Marquer l'environnement Hermes comme sécurisé sans utiliser require
      global.__HERMES_ENVIRONMENT_SECURED__ = true;
      
      // Assurer que process est défini pour éviter des erreurs courantes
      if (!global.process) {
        global.process = {
          env: {},
          nextTick: (callback) => setTimeout(callback, 0),
          domain: null
        };
      }
    }
  } catch (err) {
    console.error('Erreur lors de la sécurisation du runtime:', err);
  }
})();

// IMPORTANT: Importer le pré-init après la sécurisation de Hermes
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