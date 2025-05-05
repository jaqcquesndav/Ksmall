#!/usr/bin/env node

/**
 * Script d'initialisation Metro adapté pour les projets 100% ES modules
 * Utilise un fichier temporaire CommonJS (.cjs) pour Metro
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawnSync } from 'child_process';

// Obtenir les chemins du projet
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = __dirname;

// Informer l'utilisateur
console.log('🚀 Initialisation de Metro avec support complet ES modules...');

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);

// Fonctions pour manipuler la configuration
async function generateTempConfig() {
  try {
    // Importer la configuration ES modules
    const { default: esConfig } = await import('./metro.config.js');
    
    // Créer le contenu du fichier temporaire .cjs
    return `// Fichier temporaire généré automatiquement pour compatibilité avec Metro
// NE PAS MODIFIER OU COMMITTER CE FICHIER

module.exports = ${JSON.stringify(esConfig, function(key, value) {
      // Traiter les fonctions spécialement
      if (typeof value === 'function') {
        return value.toString();
      }
      // Traiter les expressions régulières
      if (value instanceof RegExp) {
        return { __REGEXP__: value.toString() };
      }
      return value;
    }, 2)}

// Convertir les chaînes de fonctions en fonctions réelles
const convertFunctions = (obj) => {
  if (!obj) return;
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    if (typeof value === 'string' && 
        (value.startsWith('function') || 
         value.includes('=>') || 
         value.match(/^\\([^)]*\\)\\s*=>/))) {
      try {
        // eslint-disable-next-line no-new-func
        obj[key] = new Function('return ' + value)();
      } catch (e) {
        console.warn('Impossible de convertir:', value);
      }
    } else if (value && typeof value === 'object') {
      // Convertir les RegExp
      if (value.__REGEXP__) {
        const m = value.__REGEXP__.match(/^\\/(.*)\\/(.*)/);
        if (m) {
          obj[key] = new RegExp(m[1], m[2] || '');
        }
      } else {
        // Traverser récursivement les objets
        convertFunctions(value);
      }
    }
  });
};

// Convertir toutes les fonctions et RegExp
convertFunctions(module.exports);
`;
  } catch (error) {
    console.error('Erreur lors de la génération de la configuration temporaire:', error);
    process.exit(1);
  }
}

// Créer et configurer les fichiers temporaires
async function setupTempFiles() {
  // Utiliser .cjs pour CommonJS
  const tempConfigPath = path.resolve(PROJECT_ROOT, 'metro.config.cjs');
  
  try {
    // Générer le contenu du fichier temporaire
    const tempConfigContent = await generateTempConfig();
    
    // Écrire le fichier temporaire
    fs.writeFileSync(tempConfigPath, tempConfigContent, 'utf8');
    console.log('📦 Fichier temporaire CommonJS créé');
    
    return tempConfigPath;
  } catch (error) {
    console.error('Erreur lors de la création des fichiers temporaires:', error);
    process.exit(1);
  }
}

// Nettoyer les fichiers temporaires
function cleanupTempFiles(tempConfigPath) {
  try {
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
      console.log('🧹 Fichiers temporaires nettoyés');
    }
  } catch (error) {
    console.warn('Avertissement: Impossible de nettoyer les fichiers temporaires:', error.message);
  }
}

// Fonction principale
async function runExpo() {
  let tempConfigPath = null;
  
  try {
    // Configurer les fichiers temporaires
    tempConfigPath = await setupTempFiles();
    
    // Configurer les variables d'environnement
    const env = {
      ...process.env,
      EXPO_METRO_CONFIG: tempConfigPath,
      EXPO_USE_METRO_WORKSPACE_ROOT: '1',
      REACT_NATIVE_PACKAGER_RESET_CACHE: '1'
    };
    
    // Démarrer l'application
    console.log('🚀 Démarrage de l\'application avec modules ES...');
    const result = spawnSync('npx', ['expo', ...args], {
      stdio: 'inherit',
      env
    });
    
    return result.status || 0;
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution:', error);
    return 1;
  } finally {
    // Nettoyer les fichiers temporaires
    if (tempConfigPath) {
      cleanupTempFiles(tempConfigPath);
    }
  }
}

// Exécuter le script principal
runExpo().then(exitCode => {
  process.exit(exitCode);
});