const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting dependency fix script...');

// Install correct Expo compatible versions
const packages = [
  '@react-native-community/netinfo@9.3.7',
  'expo-barcode-scanner@~12.3.2',
  'expo-clipboard@~4.1.2',
  'expo-image-manipulator@~11.1.1',
  'react-native-svg@13.4.0',
  '@types/react@~18.0.27',
  'typescript@^4.9.4',
  '@react-native/metro-config@^0.72.11'
];

try {
  console.log('📦 Installing compatible package versions...');
  execSync(`npx expo install ${packages.join(' ')}`, { stdio: 'inherit' });
  
  console.log('✨ Dependencies successfully fixed!');
  console.log('🚀 You can now run your app with: npx expo start');
} catch (error) {
  console.error('❌ Error fixing dependencies:', error);
  process.exit(1);
}
