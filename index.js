// Import our custom initialization file to fix core module errors
import './src/utils/initializeCore';

import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';

// Enregistrer explicitement avec les deux méthodes pour assurer la compatibilité
AppRegistry.registerComponent('main', () => App);
AppRegistry.registerComponent('ksmall', () => App);

// Point d'entrée de l'application Expo
registerRootComponent(App);