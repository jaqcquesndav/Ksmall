/**
 * Polyfills pour React Native
 * Ce fichier résout les problèmes courants avec des modules manquants ou incomplets
 */

// Assurer que EventEmitter est disponible
import { EventEmitter } from 'events';
if (global.EventEmitter === undefined) {
  global.EventEmitter = EventEmitter;
}

// Autres polyfills peuvent être ajoutés ici si nécessaire