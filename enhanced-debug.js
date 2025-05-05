// enhanced-debug.js
// Script de diagnostic avancé pour les builds Android
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ANDROID_DIR = path.join(process.cwd(), 'android');

// Fonction pour exécuter des commandes avec gestion d'erreurs
function runCommand(command, options = {}) {
  console.log(`Exécution: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options });
    return { success: true, output };
  } catch (error) {
    console.error(`Erreur lors de l'exécution de: ${command}`);
    console.error(error.message);
    if (error.stdout) console.log("Sortie standard:", error.stdout);
    if (error.stderr) console.log("Erreur standard:", error.stderr);
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

// Vérifier la structure du projet
function checkProjectStructure() {
  console.log('\n=== Vérification de la structure du projet ===');
  
  // Vérification des fichiers essentiels
  const requiredFiles = [
    'android/settings.gradle',
    'android/build.gradle',
    'android/app/build.gradle',
    'android/gradle/wrapper/gradle-wrapper.properties'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} existe`);
    } else {
      console.log(`❌ ${file} n'existe pas`);
    }
  });
  
  // Vérification des modules node essentiels
  console.log('\n=== Vérification des modules node essentiels ===');
  const nodeModulePaths = [
    'node_modules/react-native',
    'node_modules/@react-native-community/cli-platform-android',
    'node_modules/react-native-vector-icons'
  ];
  
  nodeModulePaths.forEach(modulePath => {
    const fullPath = path.join(process.cwd(), modulePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${modulePath} existe`);
    } else {
      console.log(`❌ ${modulePath} n'existe pas`);
    }
  });
}

// Afficher les informations Java
function checkJavaEnvironment() {
  console.log("\n=== Vérification de l'environnement Java ===");
  runCommand('java -version');
  console.log('JAVA_HOME:', process.env.JAVA_HOME || 'Non défini');
}

// Afficher les informations Android
function checkAndroidEnvironment() {
  console.log("\n=== Vérification de l'environnement Android ===");
  console.log('ANDROID_HOME:', process.env.ANDROID_HOME || 'Non défini');
  
  if (process.env.ANDROID_HOME) {
    const toolsExist = fs.existsSync(path.join(process.env.ANDROID_HOME, 'tools'));
    const platformToolsExist = fs.existsSync(path.join(process.env.ANDROID_HOME, 'platform-tools'));
    
    console.log(`✅ tools existe: ${toolsExist}`);
    console.log(`✅ platform-tools existe: ${platformToolsExist}`);
  }
}

// Lancer un build Gradle en mode debug
function runGradleDebugBuild() {
  console.log('\n=== Test de compilation Gradle ===');
  process.chdir(ANDROID_DIR);
  
  // Vérifier la commande ./gradlew
  const gradlewCmd = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
  runCommand(`${gradlewCmd} --version`);
  
  // Nettoyer le projet
  console.log('\n=== Nettoyage du projet Gradle ===');
  runCommand(`${gradlewCmd} clean`);
  
  // Assembler la version debug (moins d'étapes que la release)
  console.log('\n=== Assemblage de la version debug ===');
  const buildResult = runCommand(`${gradlewCmd} assembleDebug --stacktrace`);
  
  return buildResult;
}

// Fonction principale
async function main() {
  console.log('=== Démarrage du diagnostic de compilation Android ===');
  
  checkProjectStructure();
  checkJavaEnvironment();
  checkAndroidEnvironment();
  
  const buildResult = runGradleDebugBuild();
  
  console.log('\n=== Résultat du diagnostic ===');
  if (buildResult.success) {
    console.log("✅ Build Gradle réussi localement. Le problème est probablement lié à la configuration EAS ou aux différences d'environnement.");
  } else {
    console.log('❌ Build Gradle a échoué localement.');
    console.log('Vérifiez les erreurs ci-dessus et consultez les logs EAS pour plus de détails.');
  }
  
  console.log('\n=== Suggestions pour résoudre les problèmes communs ===');
  console.log('1. Vérifiez que votre fichier settings.gradle référence correctement les modules React Native et Vector Icons');
  console.log('2. Assurez-vous que les versions de Gradle et des plugins Gradle sont compatibles');
  console.log('3. Vérifiez que les chemins dans build.gradle sont corrects et que les fichiers existent');
  console.log('4. Si le build local réussit mais que EAS échoue, essayez de modifier eas.json pour simplifier la configuration');
}

main().catch(err => {
  console.error('Le diagnostic a échoué:', err);
});