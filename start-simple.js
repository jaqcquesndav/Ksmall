#!/usr/bin/env node

/**
 * Script de configuration minimal pour Ksmall
 * Définit simplement les variables d'environnement nécessaires
 */

import { spawnSync } from 'child_process';

// Configuration des variables d'environnement
const env = {
  ...process.env,
  // Pointer vers les fichiers .cjs
  EXPO_METRO_CONFIG: './metro.config.cjs',
  BABEL_CONFIG_FILE: './babel.config.cjs',
  // Activer Hermes
  REACT_NATIVE_USE_HERMES: '1',
  REACT_NATIVE_ENABLE_HERMES_BYTECODE: '1'
};

// Récupérer les arguments
const args = process.argv.slice(2);

// Exécuter Expo avec les variables d'environnement
console.log('🚀 Démarrage avec configuration simplifiée...');
spawnSync('npx', ['expo', ...args], {
  stdio: 'inherit',
  env
});