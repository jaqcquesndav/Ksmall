/**
 * Configuration Metro optimisée pour une application offline-first
 * Format CommonJS pour permettre l'interopérabilité avec les scripts ES Modules
 */

const path = require('path');
const os = require('os');
const { getDefaultConfig } = require('expo/metro-config');
const nodeLibs = require('node-libs-react-native');

// Obtenir la racine du projet
const projectRoot = path.resolve(__dirname, '..');

// Créer la configuration par défaut
const config = getDefaultConfig(projectRoot);

// Optimize bundling for offline-first
config.resolver.sourceExts = [
  'jsx', 'js', 'tsx', 'ts', 'mjs', 'json'
];

// Important polyfills for offline functionality
config.resolver.extraNodeModules = {
  ...nodeLibs,
  'crypto': path.resolve(projectRoot, 'node_modules/react-native-crypto'),
  'stream': path.resolve(projectRoot, 'node_modules/readable-stream'),
  'vm': path.resolve(projectRoot, 'node_modules/vm-browserify'),
  'process': path.resolve(projectRoot, 'node_modules/process'),
  'buffer': path.resolve(projectRoot, 'node_modules/buffer'),
  'path': path.resolve(projectRoot, 'node_modules/path-browserify'),
  'fs': path.resolve(projectRoot, 'src/utils/fs-mock.js'),
  'zlib': path.resolve(projectRoot, 'src/utils/zlib-mock.js'),
};

// Priorité aux polyfills importants
config.resolver.resolverMainFields = [
  'react-native',
  'browser',
  'main',
  'module'
];

// Remove the blacklist configuration (now deprecated) and use blockList instead
delete config.resolver.blacklistRE;
config.resolver.blockList = [/\.git\/.*/, /android\/.*\/build\/.*/];

// Add all project folders to watchFolders
config.watchFolders = [projectRoot];

// Setup transformer with more memory and optimizations
config.transformer = {
  ...config.transformer,
  babelTransformerPath: path.resolve(projectRoot, 'node_modules/metro-react-native-babel-transformer/src/index.js'),
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
      reserved: ['require', 'global', '__r', 'process'],
    },
  },
  inlineRequires: false,
  globalDefines: {
    'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
    '__OFFLINE_FIRST__': process.env.REACT_NATIVE_OFFLINE_MODE === 'true',
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
    './src/utils/pre-init.js'
  ],
  createModuleIdFactory: () => {
    // Garantir que les modules critiques ont des IDs stables
    const criticalModules = {
      './src/utils/pre-init.js': 0,
      './index.js': 1,
    };
    
    return (path) => {
      if (criticalModules[path] !== undefined) {
        return criticalModules[path];
      }
      
      // Hash stable pour les autres modules
      let hash = 0;
      for (let i = 0; i < path.length; i++) {
        hash = (hash * 31 + path.charCodeAt(i)) % 2147483648;
      }
      return hash + 1000; // Offset pour éviter les conflits
    };
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

// Configuration pour détecter et améliorer la transition online/offline
if (process.env.REACT_NATIVE_OFFLINE_MODE === 'true') {
  console.log('⚡ Configuration optimisée pour le mode OFFLINE');
  // Réglages spécifiques au mode offline
  config.transformer.experimentalImportSupport = false;
} else {
  console.log('🌐 Configuration optimisée pour le mode ONLINE');
  // Réglages spécifiques au mode online
  config.transformer.experimentalImportSupport = true;
}

// Ajouter plus de support pour ES modules
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['import', 'require', 'react-native', 'browser', 'default'];

// Exporter la configuration (format CommonJS)
module.exports = config;