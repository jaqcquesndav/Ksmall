// Polyfills pour les modules Node.js manquants
import { randomBytes } from 'react-native-randombytes';
import { Buffer } from '@craftzdog/react-native-buffer';

// Initialisation de crypto global pour randombytes
if (typeof global.crypto !== 'object') {
  global.crypto = {};
}

if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = function(array) {
    const bytes = randomBytes(array.length);
    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes[i];
    }
    return array;
  };
}

// Ajouter Buffer global nécessaire pour beaucoup de modules Node.js
global.Buffer = global.Buffer || Buffer;

// Autres polyfills qui pourraient être nécessaires
global.process = global.process || require('process/browser');
global.process.env = global.process.env || {};

// Polyfill pour btoa et atob (utilisé par certains modules)
if (typeof global.btoa !== 'function') {
  global.btoa = function(str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

if (typeof global.atob !== 'function') {
  global.atob = function(b64Encoded) {
    return Buffer.from(b64Encoded, 'base64').toString('binary');
  };
}