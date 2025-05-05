#!/usr/bin/env node

/**
 * Script de démarrage minimal utilisant dotenv
 * Charge les variables d'environnement à partir de .env
 */

import { config } from 'dotenv';
import { spawnSync } from 'child_process';

// Charger les variables d'environnement depuis .env
config();

// Récupérer les arguments
const args = process.argv.slice(2);

// Exécuter Expo avec les variables d'environnement chargées depuis .env
console.log('🚀 Démarrage avec configuration depuis .env...');
spawnSync('npx', ['expo', ...args], {
  stdio: 'inherit',
  env: process.env
});