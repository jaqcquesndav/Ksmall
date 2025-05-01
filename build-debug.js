// Local build script to help diagnose build problems
const fs = require('fs');
const { execSync } = require('child_process');

function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    return { success: true, output };
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('Starting Android build diagnostic...');
  
  // Check Android SDK environment
  console.log('\n=== Checking Android SDK environment ===');
  runCommand('echo %ANDROID_HOME%');
  
  // Navigate to android directory and run gradlew tasks to see if basic gradle setup works
  console.log('\n=== Testing basic Gradle configuration ===');
  runCommand('cd android && .\\gradlew tasks');
  
  // Try to assemble debug build
  console.log('\n=== Attempting to build debug APK ===');
  const buildResult = runCommand('cd android && .\\gradlew assembleDebug --info');
  
  console.log('\n=== Build Diagnostic Complete ===');
}

main().catch(err => {
  console.error('Build diagnostic failed:', err);
});