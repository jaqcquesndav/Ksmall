/**
 * Point d'entrée de l'application Ksmall
 * Implémente une stratégie d'initialisation robuste pour le mode offline-first
 */

// IMPORTANT: Importer le pré-init avant tout autre module
import './src/utils/pre-init';

// Imports fondamentaux
import { AppRegistry } from 'react-native';
import { registerRootComponent } from 'expo';

// Ensuite importer l'app
import App from './App';

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