/**
 * Script pour construire une APK indépendamment d'EAS
 * Ceci permet de générer une APK de test localement.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Configuration
const ANDROID_DIR = path.join(process.cwd(), 'android');
const OUTPUT_DIR = path.join(process.cwd(), 'apk');
const GRADLE_CMD = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';

// Fonction pour exécuter des commandes avec log
function runCommand(command, message) {
  console.log(`${colors.blue}⏳ ${message}...${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`${colors.green}✅ Commande réussie${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de l'exécution de la commande:${colors.reset}`, error.message);
    return false;
  }
}

// Fonction principale
async function buildApk() {
  console.log(`${colors.cyan}🚀 Démarrage de la génération de l'APK...${colors.reset}`);

  // 1. S'assurer que le dossier dist existe
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // 2. Nettoyer les caches précédents
  runCommand('npx expo-doctor', 'Vérification de l\'environnement');
  runCommand('npx expo install --check', 'Vérification des dépendances');
  
  // 3. Générer l'APK via expo export
  console.log(`${colors.yellow}🔧 Préparation de l'export Android...${colors.reset}`);
  
  // Option 1: Utiliser expo export
  const exportResult = runCommand(
    'npx expo export --platform android --output-dir ./dist --dump-sourcemap --dev false',
    'Export du projet pour Android'
  );
  
  if (exportResult) {
    console.log(`${colors.green}✅ Export terminé avec succès!${colors.reset}`);
    console.log(`${colors.cyan}📲 L'APK devrait être disponible dans le dossier ./dist${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️ L'export a échoué, essayons une autre méthode...${colors.reset}`);
    
    // Option 2: Utiliser EAS build mais avec une configuration différente
    const updateEasJson = runCommand(
      'npx eas-cli build:configure',
      'Configuration de EAS'
    );
    
    if (updateEasJson) {
      runCommand(
        'npx eas-cli build -p android --profile preview --local',
        'Build local EAS'
      );
    }
  }
}

// Exécuter la fonction principale
buildApk().catch(error => {
  console.error(`${colors.red}❌ Erreur globale:${colors.reset}`, error);
});