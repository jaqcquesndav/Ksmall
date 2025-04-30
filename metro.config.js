const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Create default config
const config = getDefaultConfig(__dirname);

// Add more extensions to support all file types
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Configure custom resolver to handle node modules properly
config.resolver.extraNodeModules = {
  // Add core node module shims
  ...require('node-libs-react-native'),
  'crypto': path.resolve(__dirname, 'node_modules/react-native-crypto'),
  'stream': path.resolve(__dirname, 'node_modules/readable-stream'),
  'vm': path.resolve(__dirname, 'node_modules/vm-browserify'),
};

// Remove the blacklist configuration (now deprecated) and use blockList instead
delete config.resolver.blacklistRE;
config.resolver.blockList = [/\.git\/.*/, /android\/.*/];

// Add all project folders to watchFolders
config.watchFolders = [__dirname];

// Setup transformer with more memory
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
};

// Reset cache with a more specific version identifier
config.cacheVersion = '1.0.0-' + Date.now().toString();

// Fix for circular dependencies
config.maxWorkers = 4;
config.resetCache = true;
config.transformer.enableBabelRuntimeTransform = true;

module.exports = config;