/**
 * Script unifié de gestion du projet Ksmall
 * Ce script remplace tous les scripts individuels précédents
 * Utilisez: node manage-project.js [commande]
 * 
 * Commandes disponibles:
 *  - clean : Nettoie les caches et redémarre l'application
 *  - offline : Démarre l'application en mode offline
 *  - android : Démarre l'application sur Android
 *  - fix : Tente de résoudre les problèmes de connexion au serveur de développement
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Arguments de la ligne de commande
const args = process.argv.slice(2);
const command = args[0] || 'help';

// Afficher l'aide
function showHelp() {
  console.log(`
${colors.bright}${colors.blue}Script de gestion du projet Ksmall${colors.reset}
${colors.bright}Usage: node manage-project.js [commande]${colors.reset}

${colors.bright}Commandes disponibles:${colors.reset}
  ${colors.green}clean${colors.reset}    : Nettoie les caches et prépare l'application
  ${colors.green}start${colors.reset}    : Démarre l'application normalement
  ${colors.green}offline${colors.reset}  : Démarre l'application en mode offline
  ${colors.green}android${colors.reset}  : Démarre l'application spécifiquement pour Android
  ${colors.green}fix${colors.reset}      : Tente de résoudre les problèmes de connexion
  ${colors.green}check${colors.reset}    : Vérifie l'état du projet
  ${colors.green}help${colors.reset}     : Affiche cette aide

${colors.bright}Exemples:${colors.reset}
  node manage-project.js clean
  node manage-project.js offline
  node manage-project.js fix
  `);
}

// Nettoyer les caches
function cleanCaches() {
  console.log(`${colors.cyan}Nettoyage des caches...${colors.reset}`);
  
  const cacheDirs = [
    path.join(__dirname, 'node_modules', '.cache'),
    path.join(__dirname, '.expo'),
    path.join(__dirname, '.metro'),
    path.join(os.tmpdir(), 'metro-*'),
    path.join(os.tmpdir(), 'haste-map-*')
  ];

  let cleaned = 0;
  cacheDirs.forEach(dirPattern => {
    try {
      // Gérer les patterns avec des wildcards
      if (dirPattern.includes('*')) {
        const baseDir = path.dirname(dirPattern);
        const pattern = path.basename(dirPattern);
        
        if (fs.existsSync(baseDir)) {
          const files = fs.readdirSync(baseDir);
          
          files.forEach(file => {
            if (file.startsWith(pattern.replace('*', ''))) {
              const fullPath = path.join(baseDir, file);
              if (fs.statSync(fullPath).isDirectory()) {
                fs.rmSync(fullPath, { recursive: true, force: true });
                cleaned++;
              }
            }
          });
        }
      } else if (fs.existsSync(dirPattern)) {
        fs.rmSync(dirPattern, { recursive: true, force: true });
        cleaned++;
      }
    } catch (err) {
      console.error(`${colors.yellow}⚠️ Impossible de nettoyer ${dirPattern}: ${err.message}${colors.reset}`);
    }
  });

  console.log(`${colors.green}✓ ${cleaned} caches nettoyés${colors.reset}`);
}

// Arrêter les processus
function stopProcesses() {
  console.log(`${colors.cyan}Arrêt des processus en cours...${colors.reset}`);
  
  try {
    if (process.platform === 'win32') {
      try {
        execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
      } catch (e) {
        // Ignorer les erreurs si aucun processus n'est trouvé
      }
    } else {
      try {
        execSync("pkill -f 'metro|expo'", { stdio: 'ignore' });
      } catch (e) {
        // Ignorer les erreurs si aucun processus n'est trouvé
      }
    }
    console.log(`${colors.green}✓ Processus arrêtés${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Erreur lors de l'arrêt des processus: ${error.message}${colors.reset}`);
  }
}

// Démarrer l'application
function startApp(mode = 'normal') {
  // Options pour différents modes
  let command = 'npx expo start';
  let env = { ...process.env };
  
  switch (mode) {
    case 'offline':
      command = 'npx expo start --clear';
      env.REACT_NATIVE_OFFLINE_MODE = 'true';
      console.log(`${colors.bright}${colors.blue}Démarrage en mode OFFLINE...${colors.reset}`);
      break;
    case 'android':
      command = 'npx expo start --android --lan --clear';
      console.log(`${colors.bright}${colors.blue}Démarrage pour Android...${colors.reset}`);
      break;
    case 'fix':
      command = 'npx expo start --clear --no-dev --minify';
      console.log(`${colors.bright}${colors.blue}Démarrage en mode minimal...${colors.reset}`);
      break;
    default:
      console.log(`${colors.bright}${colors.blue}Démarrage normal...${colors.reset}`);
  }
  
  // Configurer la mémoire max
  env.NODE_OPTIONS = '--max_old_space_size=4096';
  
  // Exécuter la commande
  console.log(`${colors.cyan}Exécution de: ${command}${colors.reset}`);
  const child = spawn(command, [], {
    stdio: 'inherit',
    shell: true,
    env
  });
  
  child.on('error', (error) => {
    console.error(`${colors.red}Erreur lors du démarrage: ${error.message}${colors.reset}`);
  });
}

// Vérifier l'état du projet
function checkProject() {
  console.log(`${colors.cyan}Vérification de l'état du projet...${colors.reset}`);
  
  try {
    // Vérifier la base de données
    const dbPath = path.join(__dirname, 'ksmall.db');
    if (fs.existsSync(dbPath)) {
      console.log(`${colors.green}✓ Base de données trouvée: ${path.basename(dbPath)}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️ Base de données non trouvée${colors.reset}`);
    }
    
    // Vérifier l'installation des dépendances
    if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
      console.log(`${colors.green}✓ Dépendances installées${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Dépendances non installées${colors.reset}`);
    }
    
    // Vérifier les fichiers de configuration
    console.log(`${colors.green}✓ Projet vérifié${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Erreur lors de la vérification: ${error.message}${colors.reset}`);
  }
}

// Exécuter la commande spécifiée
switch (command) {
  case 'clean':
    stopProcesses();
    cleanCaches();
    console.log(`${colors.green}✓ Nettoyage terminé${colors.reset}`);
    break;
  case 'start':
    stopProcesses();
    cleanCaches();
    startApp('normal');
    break;
  case 'offline':
    stopProcesses();
    cleanCaches();
    startApp('offline');
    break;
  case 'android':
    stopProcesses();
    cleanCaches();
    startApp('android');
    break;
  case 'fix':
    stopProcesses();
    cleanCaches();
    startApp('fix');
    break;
  case 'check':
    checkProject();
    break;
  case 'help':
  default:
    showHelp();
    break;
}