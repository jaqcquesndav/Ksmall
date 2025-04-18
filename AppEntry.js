import React from 'react';
import 'expo/build/Expo.fx';
import { AppRegistry, Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// First register the component with the 'main' name which is expected by Hermes
if (App) {
  AppRegistry.registerComponent('main', () => App);
  
  // Then register with the app name from app.json
  const appName = require('./app.json').name; // Get name directly to avoid potential circular dependencies
  AppRegistry.registerComponent(appName, () => App);
  
  // Use Expo's registerRootComponent for Expo compatibility
  registerRootComponent(App);
}

export default App;