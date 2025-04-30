const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Chemin vers le package.json
const packageJsonPath = path.join(__dirname, 'package.json');

console.log('🔍 Analyse du projet KSmall...');

try {
  // Lire le package.json actuel
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // 1. Corriger le point d'entrée
  packageJson.main = 'index.js';
  console.log('✅ Point d\'entrée défini sur "index.js"');

  // 2. Fixer les versions des dépendances problématiques pour Expo SDK 48
  const dependencies = packageJson.dependencies;
  
  // Versions correctes pour Expo SDK 48
  const correctVersions = {
    'expo': '~48.0.18',
    'expo-random': '~13.1.1',
    'expo-web-browser': '~12.1.1',
    'react': '18.2.0',
    'react-native': '0.71.8',
  };

  // Mettre à jour les versions
  Object.keys(correctVersions).forEach(pkg => {
    if (dependencies[pkg]) {
      dependencies[pkg] = correctVersions[pkg];
      console.log(`✅ Version de ${pkg} fixée à ${correctVersions[pkg]}`);
    }
  });

  // 3. Supprimer les dépendances problématiques
  const packagesToRemove = ['@react-native-metro-config'];
  packagesToRemove.forEach(pkg => {
    if (dependencies[pkg]) {
      delete dependencies[pkg];
      console.log(`✅ Suppression de la dépendance problématique: ${pkg}`);
    }
  });

  // 4. Mettre à jour les devDependencies
  const devDependencies = packageJson.devDependencies;
  devDependencies['metro-config'] = '0.76.7';
  console.log('✅ Version de metro-config fixée à 0.76.7');

  // 5. Mise à jour des scripts pour inclure les commandes correctes
  packageJson.scripts = {
    ...packageJson.scripts,
    'start': 'expo start',
    'clear-cache': 'expo start --clear',
    'debug': 'expo start --dev-client',
    'android-clear': 'expo start --android --clear'
  };
  console.log('✅ Scripts de démarrage mis à jour');

  // 6. Écrire le package.json mis à jour
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Fichier package.json mis à jour');

  // 7. S'assurer que les fichiers d'entrée sont correctement configurés
  const indexJsPath = path.join(__dirname, 'index.js');
  const appJsPath = path.join(__dirname, 'app.js');
  const appEntryJsPath = path.join(__dirname, 'AppEntry.js');

  // Vérifier/créer index.js
  const indexJsContent = `import { registerRootComponent } from 'expo';
import App from './App';

// Point d'entrée de l'application Expo
registerRootComponent(App);`;
  fs.writeFileSync(indexJsPath, indexJsContent);
  console.log('✅ Fichier index.js créé/mis à jour');

  // Créer une copie de sauvegarde en app.js au cas où
  fs.writeFileSync(appJsPath, indexJsContent);
  console.log('✅ Fichier app.js créé comme sauvegarde');

  // Supprimer AppEntry.js s'il existe pour éviter la confusion
  if (fs.existsSync(appEntryJsPath)) {
    fs.unlinkSync(appEntryJsPath);
    console.log('✅ Fichier AppEntry.js supprimé pour éviter les conflits');
  }

  // 8. Créer un fichier metro.config.js simplifié
  const metroConfigPath = path.join(__dirname, 'metro.config.js');
  const simplifiedMetroConfig = `const { getDefaultConfig } = require('expo/metro-config');

// Créer la configuration par défaut
const config = getDefaultConfig(__dirname);

// Améliorer la résolution des modules
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'mjs', 'cjs']
};

// Ajouter le dossier racine aux watchFolders
config.watchFolders = [__dirname];

module.exports = config;`;
  
  fs.writeFileSync(metroConfigPath, simplifiedMetroConfig);
  console.log('✅ Fichier metro.config.js simplifié créé');

  // 9. Nettoyer les caches manuellement
  console.log('🧹 Nettoyage des caches...');
  try {
    // Supprimer le dossier de cache de node_modules
    const cacheDir = path.join(__dirname, 'node_modules', '.cache');
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
    console.log('✅ Cache node_modules/.cache supprimé');
    
    // Supprimer le dossier .expo
    const expoDir = path.join(__dirname, '.expo');
    if (fs.existsSync(expoDir)) {
      fs.rmSync(expoDir, { recursive: true, force: true });
    }
    console.log('✅ Dossier .expo supprimé');
  } catch (e) {
    console.warn('⚠️ Impossible de supprimer certains caches:', e.message);
  }

  console.log('\n✨ Configuration du projet terminée avec succès!');
  console.log('\n📋 Étapes suivantes recommandées:');
  console.log('1. Exécutez: npm install');
  console.log('2. Puis: npm run clear-cache');

} catch (error) {
  console.error('❌ Une erreur est survenue:', error);
  process.exit(1);
}