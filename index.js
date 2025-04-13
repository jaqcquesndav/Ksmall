import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';

// Register the app for React Native
AppRegistry.registerComponent('main', () => App);

// Register for Expo
registerRootComponent(App);
