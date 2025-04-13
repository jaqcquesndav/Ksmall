const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 Configuration de l\'environnement de développement KSMall...');

// Vérifier si npm est disponible
try {
  console.log('Vérifiant la version de npm...');
  execSync('npm --version', { stdio: 'inherit' });
} catch (e) {
  console.error('❌ npm n\'est pas installé ou accessible. Veuillez l\'installer et réessayer.');
  process.exit(1);
}

// Créer le fichier .npmrc s'il n'existe pas
const npmrcPath = path.join(__dirname, '.npmrc');
if (!fs.existsSync(npmrcPath)) {
  console.log('📝 Création du fichier .npmrc avec legacy-peer-deps...');
  fs.writeFileSync(npmrcPath, 'legacy-peer-deps=true\n');
} else {
  console.log('✅ Fichier .npmrc trouvé');
  // Vérifier et ajouter legacy-peer-deps si nécessaire
  const npmrcContent = fs.readFileSync(npmrcPath, 'utf8');
  if (!npmrcContent.includes('legacy-peer-deps=true')) {
    fs.appendFileSync(npmrcPath, '\nlegacy-peer-deps=true\n');
    console.log('📝 Ajout de legacy-peer-deps au fichier .npmrc existant');
  }
}

// Installer les dépendances avec les flags appropriés
try {
  console.log('📦 Installation des dépendances avec legacy-peer-deps...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  console.log('✅ Dépendances installées avec succès!');
} catch (e) {
  console.error('❌ Erreur lors de l\'installation des dépendances:', e);
  console.log('\n🔍 Tentative alternative avec --force...');
  
  try {
    execSync('npm install --force', { stdio: 'inherit' });
    console.log('✅ Dépendances installées avec succès en utilisant --force!');
  } catch (e2) {
    console.error('❌ L\'installation a échoué même avec --force:', e2);
    console.log('\n👉 Recommandations:');
    console.log('1. Essayez de nettoyer le cache npm: npm cache clean --force');
    console.log('2. Supprimez le dossier node_modules et réessayez');
    console.log('3. Consultez le rapport d\'erreur pour plus de détails');
    process.exit(1);
  }
}

// Vérifier la création du dossier assets si nécessaire
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  console.log('📁 Création du dossier assets...');
  fs.mkdirSync(assetsDir);
  
  // Création de fichiers d'assets de base
  console.log('🖼 Génération des fichiers d\'assets par défaut...');
  
  // Créer un fichier image de base (un rectangle coloré comme placeholder)
  const createPlaceholderImage = (filename, color = '#6200EE') => {
    // Cette fonction est un placeholder - normalement nous utiliserions 
    // une bibliothèque pour générer des images réelles
    console.log(`   - Création de ${filename} (placeholder)`);
    fs.writeFileSync(
      path.join(assetsDir, filename),
      `Placeholder pour ${filename}. Ce n'est pas une véritable image.`
    );
  };
  
  createPlaceholderImage('icon.png');
  createPlaceholderImage('splash.png');
  createPlaceholderImage('adaptive-icon.png');
  createPlaceholderImage('favicon.png');
}

console.log('\n🎉 Configuration terminée! Vous pouvez maintenant démarrer l\'application:');
console.log('   npx expo start');
