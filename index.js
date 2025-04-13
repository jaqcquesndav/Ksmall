/**
 * @format
 */

import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register the main component
AppRegistry.registerComponent('main', () => App);

// This is for Expo
registerRootComponent(App);
