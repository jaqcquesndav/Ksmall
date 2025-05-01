/**
 * Configuration Metro optimisée pour une application offline-first
 * Résout les problèmes de chargement et d'initialisation
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const os = require('os');

// Create default config
const config = getDefaultConfig(__dirname);

// Optimize bundling for offline-first
config.resolver.sourceExts = [
  'jsx', 'js', 'tsx', 'ts', 'mjs', 'cjs', 'json'
];

// Important polyfills for offline functionality
config.resolver.extraNodeModules = {
  ...require('node-libs-react-native'),
  'crypto': path.resolve(__dirname, 'node_modules/react-native-crypto'),
  'stream': path.resolve(__dirname, 'node_modules/readable-stream'),
  'vm': path.resolve(__dirname, 'node_modules/vm-browserify'),
  'process': path.resolve(__dirname, 'node_modules/process'),
  'buffer': path.resolve(__dirname, 'node_modules/buffer'),
};

// Priorité aux polyfills importants
config.resolver.resolverMainFields = [
  'react-native',
  'browser',
  'main',
];

// Remove the blacklist configuration (now deprecated) and use blockList instead
delete config.resolver.blacklistRE;
config.resolver.blockList = [/\.git\/.*/, /android\/.*\/build\/.*/];

// Add all project folders to watchFolders
config.watchFolders = [__dirname];

// Setup transformer with more memory and optimizations
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
  // S'assurer que process.env est correctement géré
  inlineRequires: true,
  // Ajouter les define plugins pour les variables globales
  globalDefines: {
    'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
    '__OFFLINE_FIRST__': true,
  },
};

// Garantir l'unicité du cache après modification
const cacheVersion = '2.0.0-offline-first-' + Date.now().toString();
config.cacheVersion = cacheVersion;

// Configuration optimale des workers pour éviter les erreurs mémoire
const cpuCount = os.cpus().length;
config.maxWorkers = Math.max(1, Math.min(cpuCount - 1, 4));

// Force le chargement prioritaire du module pre-init
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [
    require.resolve('./src/utils/pre-init'),
  ],
  experimentalSerializerHook: (graph, delta) => {
    // Aucune modification requise ici
    return { graph, delta };
  },
};

// Optimiser le traitement des modules async
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Donner la priorité aux fichiers critiques
      if (req.url.includes('pre-init') || req.url.includes('index.js')) {
        req.headers['x-priority'] = 'high';
      }
      return middleware(req, res, next);
    };
  },
};

// Force le rechargement du cache pour cette session
config.resetCache = true;

module.exports = config;