/**
 * This file helps ensure that React Native core modules are properly initialized
 * It solves the "react-native_librairies_core_initializeCore" error
 */

// Import global polyfills
import 'node-libs-react-native/globals';
import { Text } from 'react-native';

// Make sure Text component gets registered early (prevents another common error)
// @ts-ignore - Force early registration
Text.render;

// Polyfill console if needed
if (!global.console) {
  global.console = {
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
  };
}

// Ensure global Buffer is available
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Fix for some libraries that require process.nextTick
if (typeof global.process === 'undefined' || !global.process.nextTick) {
  global.process = global.process || {};
  global.process.nextTick = setImmediate;
}

export default {
  // Export a flag that can be checked to confirm this file was loaded
  initialized: true
};