/**
 * Script pour nettoyer le cache et redémarrer l'application
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Nettoyage du cache et redémarrage...');

try {
  // Arrêter tous les processus Metro actifs
  console.log('Arrêt des processus Metro en cours...');
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
    } else {
      execSync("pkill -f 'metro'", { stdio: 'ignore' });
    }
  } catch (e) {
    // Ignorer les erreurs si aucun processus n'est trouvé
  }

  // Nettoyer les dossiers de cache Metro
  console.log('Suppression des caches...');
  const cacheDirs = [
    path.join(__dirname, 'node_modules', '.cache'),
    path.join(__dirname, '.expo'),
    path.join(__dirname, '.metro')
  ];

  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✅ Cache supprimé: ${dir}`);
      } catch (err) {
        console.error(`❌ Erreur lors de la suppression de ${dir}:`, err);
      }
    }
  });

  // Redémarrer l'application avec un cache réinitialisé
  console.log('🚀 Redémarrage de l\'application...');
  process.env.NODE_OPTIONS = '--max_old_space_size=4096';
  execSync('npx react-native start --reset-cache', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Erreur lors du redémarrage:', error);
  console.log('\n🔄 Essayez d\'exécuter ces commandes manuellement:');
  console.log('1. npx react-native start --reset-cache');
  console.log('2. Dans un autre terminal: npx react-native run-android');
  process.exit(1);
}