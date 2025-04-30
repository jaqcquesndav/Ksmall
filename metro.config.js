const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Create default config
const config = getDefaultConfig(__dirname);

// Add more extensions to support all file types
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];
config.resolver.extraNodeModules = {
  'react-native-crypto': path.resolve(__dirname, 'node_modules/react-native-crypto'),
  // Add core modules needed for initialization
  'react-native/Libraries/Core/InitializeCore': path.resolve(__dirname, 'node_modules/react-native/Libraries/Core/InitializeCore.js'),
  // Add shims for node core modules
  ...require('node-libs-react-native')
};

// Remove the blacklist configuration (now deprecated) and use blockList instead
delete config.resolver.blacklistRE;
config.resolver.blockList = /\.git\/.*/;

// Add the root directory to watchFolders
config.watchFolders = [__dirname];

// Keep transformer setup simple
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

// Reset cache settings
config.cacheVersion = Date.now().toString();

module.exports = config;