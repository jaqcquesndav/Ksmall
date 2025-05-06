#!/usr/bin/env node

/**
 * Script de démarrage Expo unifié
 * Supporte à la fois le mode standard et le mode Hermes
 * Compatible avec les environnements offline et online
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

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);
const modeArg = args.find(arg => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'standard';
const cleanArgs = args.filter(arg => !arg.startsWith('--mode='));
const isHermesMode = mode === 'hermes';
const isOfflineMode = args.includes('--offline');

console.log(INFO, `🚀 Initialisation du projet en mode ${isHermesMode ? 'HERMES' : 'STANDARD'}...`);
console.log(INFO, `📋 Mode ${isOfflineMode ? 'OFFLINE' : 'ONLINE'} détecté`);

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
      console.log(SUCCESS, '✅ Fichier babel.config.cjs trouvé');
    }
    
    // Supprimer toute variable d'environnement BABEL_CONFIG_FILE qui pourrait exister
    const cleanEnv = { ...process.env };
    if (cleanEnv.BABEL_CONFIG_FILE) {
      delete cleanEnv.BABEL_CONFIG_FILE;
      console.log(WARNING, '⚠️ Variable BABEL_CONFIG_FILE trouvée et supprimée pour éviter les conflits');
    }
    
    // Configurer les variables d'environnement de base
    const env = {
      ...cleanEnv,
      // Pointer vers le fichier .cjs pour que Metro puisse le charger correctement
      EXPO_METRO_CONFIG: metroConfigPath,
      // Définir explicitement le fichier de configuration Babel à utiliser
      BABEL_CONFIG_FILE: babelConfigCjsPath,
      EXPO_USE_METRO_WORKSPACE_ROOT: '1',
      // Définir le mode offline/online
      REACT_NATIVE_OFFLINE_MODE: isOfflineMode ? 'true' : 'false'
    };
    
    // Ajouter des variables spécifiques au mode Hermes si nécessaire
    if (isHermesMode) {
      env.REACT_NATIVE_USE_HERMES = '1';
      env.REACT_NATIVE_ENABLE_HERMES_BYTECODE = '1';
      env.EXPO_USE_HERMES = '1';
      console.log(SUCCESS, '✅ Variables d\'environnement Hermes configurées');
    } else {
      // S'assurer que Hermes est désactivé en mode standard
      env.REACT_NATIVE_USE_HERMES = '0';
      env.EXPO_USE_HERMES = '0';
      console.log(SUCCESS, '✅ Mode standard sans Hermes configuré');
    }
    
    console.log(INFO, `🌐 Mode ${isOfflineMode ? 'OFFLINE' : 'ONLINE'} configuré`);
    
    // Démarrer l'application avec Expo
    console.log(INFO, `🚀 Démarrage de l'application en mode ${isHermesMode ? 'Hermes' : 'Standard'}...`);
    
    // Ajout de l'option --clear pour nettoyer le cache si nécessaire
    const finalArgs = [...cleanArgs];
    if (!cleanArgs.includes('--clear') && (cleanArgs.length === 0 || cleanArgs[0] === 'start')) {
      console.log(INFO, '🧹 Ajout de l\'option --clear pour éviter les problèmes de cache');
      finalArgs.push('--clear');
    }
    
    // Si aucun argument n'est fourni, ajouter 'start' par défaut
    if (finalArgs.length === 0) {
      finalArgs.unshift('start');
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