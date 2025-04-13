const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Démarrage du diagnostic KSMall...');

// Vérifier la version de Node et npm
try {
  const nodeVersion = execSync('node --version').toString().trim();
  const npmVersion = execSync('npm --version').toString().trim();
  console.log(`✅ Node.js: ${nodeVersion}`);
  console.log(`✅ npm: ${npmVersion}`);
} catch (e) {
  console.error('❌ Impossible de déterminer les versions de Node/npm:', e.message);
}

// Vérifier la structure des dossiers essentiels
const criticalPaths = [
  './node_modules/expo',
  './node_modules/react',
  './node_modules/react-native',
  './assets',
  './src'
];

console.log('\n📁 Vérification des dossiers critiques:');
criticalPaths.forEach(dir => {
  if (fs.existsSync(path.resolve(__dirname, dir))) {
    console.log(`✅ ${dir} existe`);
  } else {
    console.log(`❌ ${dir} MANQUANT!`);
  }
});

// Vérifier les fichiers de configuration importants
const configFiles = [
  './app.json',
  './package.json',
  './babel.config.js',
  './tsconfig.json'
];

console.log('\n📄 Vérification des fichiers de configuration:');
configFiles.forEach(file => {
  if (fs.existsSync(path.resolve(__dirname, file))) {
    console.log(`✅ ${file} existe`);
  } else {
    console.log(`❌ ${file} MANQUANT!`);
  }
});

// Créer des assets simples s'ils sont manquants
const assetsDir = path.resolve(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  console.log('\n🖼️ Création du dossier assets manquant...');
  fs.mkdirSync(assetsDir, { recursive: true });
}

const assetFiles = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];
assetFiles.forEach(file => {
  const assetPath = path.resolve(assetsDir, file);
  if (!fs.existsSync(assetPath)) {
    console.log(`⚠️ Création d'un fichier ${file} simple...`);
    // Créer un fichier texte comme placeholder
    fs.writeFileSync(assetPath, `Placeholder for ${file}`);
  }
});

// Vérifier expo-cli
try {
  console.log('\n🧰 Vérification d\'expo-cli...');
  execSync('npx expo --version', { stdio: 'inherit' });
} catch (e) {
  console.error('❌ Problème avec expo-cli. Tentative d\'installation...');
  try {
    execSync('npm install -g expo-cli', { stdio: 'inherit' });
  } catch (installError) {
    console.error('❌ Impossible d\'installer expo-cli. Essayez manuellement: npm install -g expo-cli');
  }
}

// Vérifier le app.json pour les références d'assets
try {
  const appJsonPath = path.resolve(__dirname, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Corriger les chemins d'assets si nécessaire
    if (appJson.expo) {
      let modified = false;

      // Vérifier et réparer les références d'assets
      if (appJson.expo.icon && !fs.existsSync(path.resolve(__dirname, appJson.expo.icon))) {
        appJson.expo.icon = './assets/icon.png';
        modified = true;
      }
      
      if (appJson.expo.splash?.image && !fs.existsSync(path.resolve(__dirname, appJson.expo.splash.image))) {
        appJson.expo.splash.image = './assets/splash.png';
        modified = true;
      }
      
      if (appJson.expo.android?.adaptiveIcon?.foregroundImage && 
          !fs.existsSync(path.resolve(__dirname, appJson.expo.android.adaptiveIcon.foregroundImage))) {
        appJson.expo.android.adaptiveIcon.foregroundImage = './assets/adaptive-icon.png';
        modified = true;
      }
      
      if (appJson.expo.web?.favicon && !fs.existsSync(path.resolve(__dirname, appJson.expo.web.favicon))) {
        appJson.expo.web.favicon = './assets/favicon.png';
        modified = true;
      }
      
      if (modified) {
        console.log('⚠️ Correction des chemins d\'assets dans app.json...');
        fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
        console.log('✅ app.json corrigé');
      }
    }
  }
} catch (e) {
  console.error('❌ Impossible de vérifier/corriger app.json:', e);
}

console.log('\n🚀 Étapes recommandées:');
console.log('1. Nettoyer le cache: npx expo start -c');
console.log('2. Installer les dépendances: npm install --legacy-peer-deps');
console.log('3. Démarrer en mode verbose: npx expo start --verbose');
