// Importer nos shims en premier avant tout autre module
import './src/utils/shim';

// Ensuite les autres modules
import 'react-native-gesture-handler';

import React from 'react';
import { AppRegistry, Text } from 'react-native';
import App from './App';

// Définir un composant de secours simple au cas où App ne pourrait pas être chargé
const FallbackApp = () => {
  return <Text style={{padding: 20, fontSize: 16}}>Chargement de l'application en mode démo...</Text>;
};

// Fonction d'enregistrement sécurisée qui utilise App ou FallbackApp en cas d'erreur
const registerApp = () => {
  try {
    return App;
  } catch (e) {
    console.warn('Error loading main App component, using FallbackApp:', e);
    return FallbackApp;
  }
};

// Get name directly to avoid potential circular dependencies
const appName = require('./app.json').name;

// Wrapper qui utilise la fonction sécurisée pour l'enregistrement
const AppWrapper = registerApp();

// S'assurer que les composants sont enregistrés
AppRegistry.registerComponent('main', () => AppWrapper);
AppRegistry.registerComponent(appName, () => AppWrapper);

export default App;
