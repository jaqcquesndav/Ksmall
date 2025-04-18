import 'react-native-gesture-handler';
import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';

// Get name directly to avoid potential circular dependencies
const appName = require('./app.json').name;

// Register the app with both names
AppRegistry.registerComponent('main', () => App);
AppRegistry.registerComponent(appName, () => App);

export default App;
