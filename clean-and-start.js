/**
 * Script de nettoyage et lancement pour Ksmall
 * Ce script nettoie les caches, réinitialise les fichiers problématiques et relance l'application.
 * Version améliorée avec gestion des problèmes de synchronisation offline/online
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec, spawn } = require('child_process');
const os = require('os');

console.log('🧹 Nettoyage du projet Ksmall en cours...');

// Chemins à nettoyer (liste étendue pour couvrir plus de caches)
const criticalPaths = [
  'node_modules/.cache',
  '.expo',
  '.babel-cache',
  '.metro-cache',
  'android/app/build/intermediates/incremental',
  'ios/build',
  'ios/Pods'
];

// Supprimer les dossiers de cache
criticalPaths.forEach(cachePath => {
  const fullPath = path.join(__dirname, cachePath);
  if (fs.existsSync(fullPath)) {
    console.log(`Suppression de ${cachePath}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ ${cachePath} supprimé`);
    } catch (e) {
      console.error(`❌ Impossible de supprimer ${cachePath}: ${e.message}`);
    }
  }
});

// Supprimer les fichiers temporaires SQLite qui pourraient être corrompus
const tempDirPath = os.tmpdir();
try {
  const tempFiles = fs.readdirSync(tempDirPath);
  const sqliteTempFiles = tempFiles.filter(file => 
    file.includes('SQLite') || file.includes('ksmall.db') || file.endsWith('.db-journal')
  );
  
  sqliteTempFiles.forEach(file => {
    try {
      fs.unlinkSync(path.join(tempDirPath, file));
      console.log(`✅ Fichier temporaire supprimé: ${file}`);
    } catch (e) {
      console.log(`⚠️ Impossible de supprimer le fichier temporaire ${file}: ${e.message}`);
    }
  });
} catch (e) {
  console.log('⚠️ Erreur lors de la suppression des fichiers temporaires SQLite:', e.message);
}

// Nettoyer le cache de Watchman si disponible
try {
  console.log('Tentative de nettoyage du cache Watchman...');
  execSync('watchman watch-del-all', { stdio: 'inherit' });
  console.log('✅ Cache Watchman nettoyé');
} catch (e) {
  console.log('Watchman non installé ou non disponible, ignoré.');
}

// Nettoyer le cache Metro de manière plus fiable
console.log('Nettoyage du cache Metro...');
try {
  // Utiliser spawn au lieu d'execSync pour éviter les problèmes de timeout
  const metroCleanup = spawn('npx', ['react-native', 'start', '--reset-cache'], {
    detached: true,
    stdio: 'ignore'
  });
  
  // Détacher le processus pour qu'il continue en arrière-plan
  metroCleanup.unref();
  
  // Attendre un court moment puis le terminer
  setTimeout(() => {
    try {
      process.platform === 'win32' 
        ? exec(`taskkill /pid ${metroCleanup.pid} /f /t`) 
        : process.kill(-metroCleanup.pid);
      console.log('✅ Cache Metro nettoyé');
    } catch (e) {
      console.log('Remarque: Le processus Metro s\'est peut-être déjà terminé');
    }
  }, 3000);
} catch (e) {
  console.log('⚠️ Erreur lors du nettoyage du cache Metro:', e.message);
}

// Réparer potentiellement la base de données SQLite
console.log('🔧 Vérification de la base de données SQLite...');
const dbPath = path.join(__dirname, 'ksmall.db');
if (fs.existsSync(dbPath)) {
  try {
    // Créer une sauvegarde avant toute manipulation
    fs.copyFileSync(dbPath, `${dbPath}.backup-${Date.now()}`);
    console.log('✅ Sauvegarde de la base de données créée');

    // On pourrait ajouter ici une commande pour vérifier la structure de la BDD si besoin
  } catch (e) {
    console.error('⚠️ Erreur lors de la sauvegarde de la base de données:', e.message);
  }
}

console.log('🔍 Vérification de l\'installation des dépendances...');
try {
  // Vérifier si node_modules existe et contient des fichiers
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (!fs.existsSync(nodeModulesPath) || 
      fs.readdirSync(nodeModulesPath).length < 10) {
    console.log('⚠️ Dossier node_modules manquant ou incomplet, installation des dépendances...');
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
    console.log('✅ Dépendances installées');
  } else {
    console.log('✅ Dossier node_modules semble correct');
  }
} catch (e) {
  console.error('❌ Erreur lors de la vérification/installation des dépendances:', e.message);
}

// Vérifier les modules spécifiques liés à la synchronisation
const criticalModules = [
  '@react-native-community/netinfo',
  '@react-native-async-storage/async-storage',
  'expo-sqlite'
];

criticalModules.forEach(module => {
  try {
    require.resolve(module);
    console.log(`✅ Module ${module} correctement installé`);
  } catch (e) {
    console.error(`❌ Module ${module} est manquant ou corrompu, tentative d'installation...`);
    try {
      execSync(`npm install ${module} --legacy-peer-deps`, { stdio: 'inherit' });
    } catch (installError) {
      console.error(`❌ Impossible d'installer ${module}: ${installError.message}`);
    }
  }
});

// Vider le cache de AsyncStorage s'il semble problématique 
console.log('📱 Nettoyage potentiel du AsyncStorage pour les méta-données de synchronisation...');
const asyncStorageFilePath = path.join(__dirname, 'src/utils/resetAsyncStorage.js');
if (!fs.existsSync(asyncStorageFilePath)) {
  // Créer un script temporaire pour réinitialiser les métadonnées de synchronisation
  fs.writeFileSync(asyncStorageFilePath, `
// Script temporaire pour réinitialiser certaines clés AsyncStorage problématiques
import AsyncStorage from '@react-native-async-storage/async-storage';

const resetSyncMetadata = async () => {
  console.log('Réinitialisation des métadonnées de synchronisation...');
  const keysToReset = [
    'last_sync_time',
    'auto_sync_enabled',
    '@ksmall/offline_queue',
    '@ksmall/pending_conflicts',
    '@ksmall/last_sync_time',
    '@ksmall/connection_status'
  ];
  
  try {
    await Promise.all(keysToReset.map(key => AsyncStorage.removeItem(key)));
    console.log('Métadonnées de synchronisation réinitialisées avec succès');
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
  }
};

export default resetSyncMetadata;
  `);
  console.log('✅ Script de réinitialisation de AsyncStorage créé dans src/utils/resetAsyncStorage.js');
}

// Détecter la plateforme et suggérer la commande appropriée
const platform = os.platform();
console.log(`\n🚀 Nettoyage terminé! Vous pouvez maintenant lancer votre application avec:`);

if (platform === 'win32') {
  console.log('npx expo start --clear');
  console.log('\nVoulez-vous lancer l\'application maintenant? (Lance automatiquement dans 5 secondes)');
  setTimeout(() => {
    try {
      console.log('\nLancement de l\'application...');
      const childProcess = spawn('npx', ['expo', 'start', '--clear'], { 
        stdio: 'inherit',
        shell: true,
        detached: true
      });
      // Ne pas attendre la fin du processus
      childProcess.unref();
    } catch (e) {
      console.error('❌ Erreur lors du lancement de l\'application:', e.message);
    }
  }, 5000);
} else {
  console.log('npx expo start --clear');
}

console.log("\n💡 Conseils pour résoudre les problèmes persistants:");
console.log("- Si l'application ne démarre toujours pas, exécutez: node debug-app.js");
console.log("- Pour isoler les erreurs de synchronisation: npm start --offline-mode");
console.log("- Pour réinitialiser les données de synchronisation, importez et appelez resetAsyncStorage dans votre code");