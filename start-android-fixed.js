/**
 * Script optimisé pour démarrer l'application Android après avoir nettoyé le cache
 * et en contournant les problèmes potentiels de bundling
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Démarrage de l\'application Android avec optimisations...');

// 1. S'assurer que Metro n'est pas déjà en cours d'exécution
try {
  console.log('🔍 Vérification des processus Metro en cours...');
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    // Pour Windows, vérifier si le processus est en cours d'exécution
    try {
      execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
      console.log('✅ Processus Node.js précédents arrêtés');
    } catch (e) {
      // Ignore errors - no processes might be running
    }
  } else {
    // Pour macOS/Linux
    try {
      execSync("pkill -f 'metro'", { stdio: 'ignore' });
      console.log('✅ Processus Metro précédents arrêtés');
    } catch (e) {
      // Ignore errors - no processes might be running
    }
  }
} catch (error) {
  console.log('ℹ️ Aucun processus Metro n\'a été trouvé en cours d\'exécution');
}

// 2. Nettoyer le cache temporaire
console.log('🧹 Nettoyage des caches temporaires...');

// Supprimer le dossier .metro temporaire s'il existe
const tempMetroFolder = path.join(__dirname, '.metro');
if (fs.existsSync(tempMetroFolder)) {
  try {
    fs.rmSync(tempMetroFolder, { recursive: true, force: true });
    console.log('✅ Dossier .metro supprimé');
  } catch (err) {
    console.error('⚠️ Impossible de supprimer le dossier .metro', err);
  }
}

// 3. Mettre à jour la variable d'environnement pour une meilleure gestion de la mémoire
process.env.NODE_OPTIONS = '--max_old_space_size=4096';

// 4. Démarrer l'application avec les options optimisées
console.log('🚀 Démarrage de l\'application...');

try {
  execSync('node node_modules/react-native/cli.js start --reset-cache --max-workers=2', {
    stdio: 'inherit',
    env: {
      ...process.env,
      REACT_DEBUGGER: 'echo Débogage désactivé', // Désactiver temporairement le débogueur
      RCT_NO_LAUNCH_PACKAGER: 'true' // Important pour éviter les lancements multiples de Metro
    }
  });
} catch (error) {
  console.error('❌ Erreur lors du démarrage du bundler:', error);
  
  console.log('\n🔄 Tentative avec la méthode alternative...');
  try {
    execSync('npx expo start --android --clear', { stdio: 'inherit' });
  } catch (innerError) {
    console.error('❌ Erreur lors du démarrage avec Expo:', innerError);
    console.log('\n🔧 Suggestions de dépannage:');
    console.log('1. Exécutez "node clean-metro-cache.js" pour nettoyer le cache');
    console.log('2. Vérifiez votre connexion réseau');
    console.log('3. Vérifiez la configuration de votre émulateur ou appareil');
    process.exit(1);
  }
}