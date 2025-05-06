#!/usr/bin/env node

/**
 * Script pour générer un APK de test distributable
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obtenir les chemins du projet
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Console styling
const INFO = '\x1b[36m%s\x1b[0m';  // Cyan
const SUCCESS = '\x1b[32m%s\x1b[0m';  // Green
const WARNING = '\x1b[33m%s\x1b[0m';  // Yellow
const ERROR = '\x1b[31m%s\x1b[0m';  // Red

console.log(INFO, '🚀 Préparation de la génération d\'un APK pour la distribution...');

async function buildApk() {
  try {
    // S'assurer que les dossiers natifs sont générés
    console.log(INFO, '📦 Étape 1/5: Préparation des fichiers natifs...');
    
    const prebuildResult = spawnSync('npx', ['expo', 'prebuild', '--clean', '--platform', 'android'], {
      stdio: 'inherit',
      shell: true
    });
    
    if (prebuildResult.status !== 0) {
      console.error(ERROR, '❌ Échec de la préparation des fichiers natifs');
      return 1;
    }
    
    console.log(SUCCESS, '✅ Fichiers natifs générés avec succès');
    
    // Nettoyer les builds précédents
    console.log(INFO, '🧹 Étape 2/5: Nettoyage des builds précédents...');
    
    const androidPath = path.resolve(__dirname, 'android');
    const cleanResult = spawnSync('gradlew', ['clean'], {
      cwd: androidPath,
      stdio: 'inherit',
      shell: true
    });
    
    if (cleanResult.status !== 0) {
      console.log(WARNING, '⚠️ Le nettoyage a échoué, mais nous continuons');
    } else {
      console.log(SUCCESS, '✅ Nettoyage terminé');
    }
    
    // Générer l'APK en mode release
    console.log(INFO, '🔨 Étape 3/5: Compilation de l\'APK...');
    console.log(INFO, '⏳ Cette étape peut prendre quelques minutes, veuillez patienter...');
    
    const buildResult = spawnSync('gradlew', ['assembleRelease', '--info'], {
      cwd: androidPath,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        REACT_NATIVE_OFFLINE_MODE: 'false'
      }
    });
    
    if (buildResult.status !== 0) {
      console.error(ERROR, '❌ Échec de la compilation. Consultez les logs ci-dessus pour plus de détails');
      return 1;
    }
    
    console.log(SUCCESS, '✅ APK compilé avec succès');
    
    // Vérifier si l'APK existe
    const apkPath = path.resolve(androidPath, 'app/build/outputs/apk/release/app-release.apk');
    
    if (!fs.existsSync(apkPath)) {
      console.error(ERROR, `❌ APK non trouvé à l'emplacement attendu: ${apkPath}`);
      return 1;
    }
    
    // Copier l'APK à la racine pour un accès facile
    console.log(INFO, '📋 Étape 4/5: Copie de l\'APK à la racine du projet...');
    
    const destPath = path.resolve(__dirname, 'ksmall-release.apk');
    fs.copyFileSync(apkPath, destPath);
    
    console.log(SUCCESS, `✅ APK copié à: ${destPath}`);
    
    // Afficher les étapes pour la distribution
    console.log(INFO, '📱 Étape 5/5: Préparation pour la distribution...');
    console.log(SUCCESS, `
🎉 Succès! Votre APK est prêt à être distribué.

📂 Emplacement de l'APK: ${destPath}

Pour distribuer l'APK à vos testeurs:
1. Envoyez-leur le fichier directement via email, chat ou service de partage
2. Demandez-leur d'activer "Installation d'applications de sources inconnues" dans les paramètres
3. L'application s'installera sans signature Google Play (c'est normal pour les tests)

Pour une distribution plus professionnelle:
- Utilisez Firebase App Distribution: npx firebase appdistribution:distribute "${destPath}" --app [votre-app-id]
- Ou partagez via un service comme Diawi.com

⚠️ Note: Cet APK utilise une clé de signature de débogage et n'est pas signé pour le Google Play Store.
`);
    
    return 0;
  } catch (error) {
    console.error(ERROR, '❌ Une erreur s\'est produite:');
    console.error(error);
    return 1;
  }
}

// Exécuter le script
buildApk().then(code => {
  process.exit(code);
});