/**
 * Application Entry Point with Hermes compatibility fixes
 */

// Import React first to ensure it's available globally
import React from 'react';

// Import other necessary modules
import { AppRegistry } from 'react-native';
import 'expo/build/Expo.fx';

// Directly import the App component
import App from './App';

// Create a function component with correct prototype chain
// Note: Using React.createElement directly avoids JSX transformation issues with Hermes
function AppRoot(props) {
  return React.createElement(App, props);
}

// Important: Set these properties to ensure correct prototype behavior with Hermes
AppRoot.displayName = 'AppRoot';
Object.defineProperty(AppRoot, 'name', {
  value: 'AppRoot'
});

// Register the component using a direct return reference instead of an arrow function
// This helps Hermes establish the correct prototype chain
AppRegistry.registerComponent('main', function() { return AppRoot; });

// Also register with your app name for safety
AppRegistry.registerComponent('ksmall', function() { return AppRoot; });

// Export the App component as the default export
export default App;