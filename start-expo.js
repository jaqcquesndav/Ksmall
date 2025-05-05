#!/usr/bin/env node

/**
 * Script de démarrage Expo pour projets 100% ES modules
 * Solution contournant les limitations de Metro avec les modules ES
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawnSync } from 'child_process';

// Obtenir les chemins du projet
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Informer l'utilisateur
console.log('🚀 Démarrage Expo avec support ES modules...');

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);

/**
 * Contenu du fichier temporaire adapté pour Metro
 * Ce fichier est en CommonJS pour compatibilité avec Metro
 */
const tempFileContent = `// Fichier temporaire généré automatiquement
// NE PAS MODIFIER OU COMMITTER CE FICHIER

// Utiliser un modèle simplifié de configuration compatible avec Metro
// qui chargera la vraie configuration située dans config/metro.js
const path = require('path');

// Charger la configuration Metro depuis le dossier config
const metroConfig = require('./config/metro.js');

// Exporter la configuration pour Metro
module.exports = metroConfig;
`;

// Fonction principale
async function startExpo() {
  // Chemin du fichier temporaire CommonJS
  const tempConfigPath = path.resolve(__dirname, 'metro.config.cjs');
  
  try {
    // Créer le fichier temporaire
    fs.writeFileSync(tempConfigPath, tempFileContent, 'utf8');
    console.log('📦 Adaptateur CommonJS créé temporairement');
    
    // Configurer les variables d'environnement
    const env = {
      ...process.env,
      EXPO_METRO_CONFIG: tempConfigPath,
      EXPO_USE_METRO_WORKSPACE_ROOT: '1',
      REACT_NATIVE_PACKAGER_RESET_CACHE: '1'
    };
    
    // Arrêter les processus Metro existants
    try {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/f', '/im', 'node.exe'], { stdio: 'ignore' });
      }
    } catch (e) {
      // Ignorer les erreurs
    }
    
    // Démarrer l'application Expo
    console.log('🚀 Démarrage de l\'application...');
    const result = spawnSync('npx', ['expo', ...args], {
      stdio: 'inherit',
      env
    });
    
    return result.status || 0;
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution:', error);
    return 1;
  } finally {
    // Nettoyer le fichier temporaire
    try {
      if (fs.existsSync(tempConfigPath)) {
        fs.unlinkSync(tempConfigPath);
        console.log('🧹 Fichier temporaire supprimé');
      }
    } catch (e) {
      console.warn('⚠️ Impossible de supprimer le fichier temporaire:', e.message);
    }
  }
}

// Exécuter le script principal
startExpo().then(code => {
  process.exit(code);
});