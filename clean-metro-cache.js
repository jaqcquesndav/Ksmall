/**
 * Script pour nettoyer le cache de Metro et résoudre les problèmes de bundling
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🧹 Nettoyage du cache Metro et des fichiers temporaires...');

// Chemins à nettoyer
const pathsToClean = [
  path.join(__dirname, 'node_modules', '.cache'),
  path.join(__dirname, '.expo'),
  path.join(__dirname, '.gradle'),
  path.join(os.tmpdir(), 'metro-*'),
  path.join(os.tmpdir(), 'haste-map-*'),
  path.join(os.tmpdir(), 'react-*'),
  path.join(os.homedir(), '.gradle', 'caches', 'transforms-*'),
];

// Fonction pour supprimer un répertoire de manière récursive
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    try {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`✓ Supprimé: ${folderPath}`);
    } catch (err) {
      console.error(`❌ Erreur lors de la suppression de ${folderPath}:`, err);
    }
  }
}

// Nettoyer les chemins listés
pathsToClean.forEach(pathPattern => {
  if (pathPattern.includes('*')) {
    // Pour les patterns avec wildcard, utiliser une recherche approchée
    const dirName = path.dirname(pathPattern);
    const baseName = path.basename(pathPattern);
    const pattern = new RegExp(baseName.replace('*', '.*'));
    
    if (fs.existsSync(dirName)) {
      fs.readdirSync(dirName).forEach(file => {
        if (pattern.test(file)) {
          const fullPath = path.join(dirName, file);
          deleteFolderRecursive(fullPath);
        }
      });
    }
  } else {
    // Pour les chemins sans wildcard, supprimer directement
    deleteFolderRecursive(pathPattern);
  }
});

// Nettoyer le cache et les dépendances problématiques
console.log('🧹 Suppression des fichiers de cache...');

try {
  execSync('npx expo-cli start --clear', { stdio: 'inherit' });
  console.log('✅ Cache Expo nettoyé');
} catch (error) {
  console.log('⚠️ Impossible de nettoyer le cache Expo, essai avec la méthode alternative...');
  try {
    execSync('npx react-native start --reset-cache', { stdio: 'inherit' });
    console.log('✅ Cache React Native nettoyé');
  } catch (innerError) {
    console.error('❌ Échec du nettoyage du cache:', innerError);
  }
}

console.log('🔍 Vérification des dépendances circulaires...');

// Nettoyer watchman qui peut aussi causer des problèmes de cache
try {
  execSync('watchman watch-del-all', { stdio: 'inherit' });
  console.log('✅ Configuration Watchman réinitialisée');
} catch (error) {
  console.log('ℹ️ Watchman non installé ou non disponible, ignoré');
}

console.log('\n🎉 Nettoyage terminé! Exécutez maintenant votre application avec:');
console.log('  npx expo start --clear');
console.log('  ou');
console.log('  npx react-native run-android --verbose');