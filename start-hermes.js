#!/usr/bin/env node

/**
 * Script de démarrage Expo optimisé pour Hermes
 * Solution utilisant un fichier .cjs pour résoudre le problème de compatibilité
 * tout en gardant les ES modules dans le runtime Hermes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawnSync } from 'child_process';

// Obtenir les chemins du projet
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Console styling
const INFO = '\x1b[36m%s\x1b[0m';  // Cyan
const SUCCESS = '\x1b[32m%s\x1b[0m';  // Green
const WARNING = '\x1b[33m%s\x1b[0m';  // Yellow
const ERROR = '\x1b[31m%s\x1b[0m';  // Red

console.log(INFO, '🚀 Initialisation du projet avec support ES modules pour Hermes...');

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);
console.log(INFO, `📋 Arguments reçus: ${args.join(' ')}`);

// Fonction principale
async function startExpo() {
  try {
    // Vérifier que le fichier metro.config.cjs existe
    const metroConfigPath = path.resolve(__dirname, 'metro.config.cjs');
    console.log(INFO, `📂 Chemin du fichier Metro config: ${metroConfigPath}`);
    
    if (!fs.existsSync(metroConfigPath)) {
      console.error(ERROR, '❌ Erreur: Le fichier metro.config.cjs est introuvable');
      return 1;
    } else {
      console.log(SUCCESS, '✅ Fichier metro.config.cjs trouvé');
    }
    
    // Vérifier si babel.config.cjs existe
    const babelConfigCjsPath = path.resolve(__dirname, 'babel.config.cjs');
    console.log(INFO, `📂 Chemin du fichier Babel config: ${babelConfigCjsPath}`);
    
    if (!fs.existsSync(babelConfigCjsPath)) {
      console.error(ERROR, '❌ Erreur: Le fichier babel.config.cjs est introuvable');
      return 1;
    } else {
      console.log(SUCCESS, '✅ Fichier babel.config.cjs trouvé, utilisation de celui-ci');
    }
    
    // Sauvegarder l'ancienne configuration babel.config.js.bak si elle existe
    try {
      const oldBackupPath = path.resolve(__dirname, 'babel.config.js.bak');
      if (fs.existsSync(oldBackupPath)) {
        console.log(INFO, '🔄 Une sauvegarde précédente de babel.config.js existe déjà');
      }
    } catch (e) {
      console.log(WARNING, '⚠️ Impossible de vérifier la sauvegarde de babel.config.js');
    }
    
    // Supprimer toute variable d'environnement BABEL_CONFIG_FILE qui pourrait exister
    const cleanEnv = { ...process.env };
    if (cleanEnv.BABEL_CONFIG_FILE) {
      delete cleanEnv.BABEL_CONFIG_FILE;
      console.log(WARNING, '⚠️ Variable BABEL_CONFIG_FILE trouvée et supprimée pour éviter les conflits');
    }
    
    // Configurer les variables d'environnement
    const env = {
      ...cleanEnv,
      // Pointer vers le fichier .cjs pour que Metro puisse le charger correctement
      EXPO_METRO_CONFIG: metroConfigPath,
      // Définir explicitement le fichier de configuration Babel à utiliser
      BABEL_CONFIG_FILE: path.resolve(__dirname, 'babel.config.cjs'),
      EXPO_USE_METRO_WORKSPACE_ROOT: '1',
      // Activer Hermes
      REACT_NATIVE_USE_HERMES: '1',
      REACT_NATIVE_ENABLE_HERMES_BYTECODE: '1'
    };
    
    console.log(SUCCESS, '✅ Variables d\'environnement configurées');
    
    // Mode offline ou online
    if (process.env.REACT_NATIVE_OFFLINE_MODE === 'true') {
      console.log(INFO, '⚡ Mode OFFLINE activé - Optimisations pour mode hors-ligne');
    } else {
      console.log(INFO, '🌐 Mode ONLINE activé - Optimisations pour mode connecté');
    }
    
    // Démarrer l'application avec Expo
    console.log(INFO, '🚀 Démarrage de l\'application avec Hermes et ES modules...');
    console.log(SUCCESS, '📦 Utilisation de la configuration Metro depuis metro.config.cjs');
    console.log(SUCCESS, '📦 Utilisation de la configuration Babel depuis babel.config.cjs');
    
    // Ajout de l'option --clear pour nettoyer le cache si nécessaire
    const finalArgs = [...args];
    if (!args.includes('--clear') && args[0] === 'start') {
      console.log(INFO, '🧹 Ajout de l\'option --clear pour éviter les problèmes de cache');
      finalArgs.push('--clear');
    }
    
    console.log(INFO, `📱 Lancement de la commande: npx expo ${finalArgs.join(' ')}`);
    
    // Exécuter la commande avec une sortie détaillée
    const result = spawnSync('npx', ['expo', ...finalArgs], {
      stdio: 'inherit',
      env,
      shell: true // Utiliser le shell pour une meilleure compatibilité sous Windows
    });
    
    if (result.error) {
      console.error(ERROR, '❌ Erreur lors de l\'exécution de la commande:');
      console.error(result.error);
      return 1;
    }
    
    console.log(INFO, `🏁 Processus terminé avec le code: ${result.status}`);
    return result.status || 0;
  } catch (error) {
    console.error(ERROR, '❌ Erreur lors de l\'exécution:');
    console.error(error);
    return 1;
  }
}

// Exécuter le script principal
console.log(INFO, '🏃 Démarrage du script principal...');
startExpo().then(code => {
  console.log(INFO, `🛑 Fin du script avec code: ${code}`);
  process.exit(code);
});