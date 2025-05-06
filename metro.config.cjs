/**
 * Configuration Metro pour Expo/React Native
 * Format CommonJS (.cjs) pour garantir la compatibilité avec Metro
 */

// Importer les dépendances en utilisant la syntaxe CommonJS
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const nodeLibs = require('node-libs-react-native');

// Obtenir le chemin racine du projet
const projectRoot = __dirname;

// Générer la configuration par défaut
const config = getDefaultConfig(projectRoot);

// Configuration des résolveurs
config.resolver.sourceExts = [
  'jsx', 'js', 'tsx', 'ts', 'mjs', 'json'
];

// Polyfills pour le fonctionnement hors ligne
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

// Ordre de résolution des modules
config.resolver.resolverMainFields = [
  'react-native',
  'browser',
  'main',
  'module'
];

// Liste d'exclusion pour le bundler
delete config.resolver.blacklistRE; // Déprécié
config.resolver.blockList = [/\.git\/.*/, /android\/.*\/build\/.*/];

// Dossiers à surveiller
config.watchFolders = [projectRoot];

// Configuration du transformer
config.transformer = {
  ...config.transformer,
  // Correction du chemin du transformateur
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
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

// Version du cache pour forcer la régénération au besoin
config.cacheVersion = '2.0.0-offline-first-' + Date.now().toString();

// Configuration des workers
const cpuCount = require('os').cpus().length;
config.maxWorkers = Math.max(1, Math.min(cpuCount - 1, 4));

// Configuration pour les modules initiaux
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [
    './src/utils/pre-init.js'
  ],
  createModuleIdFactory: () => {
    // IDs stables pour les modules critiques
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

// Configuration du serveur
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

// Support amélioré des modules ES
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['import', 'require', 'react-native', 'browser', 'default'];

// Configuration selon le mode offline/online
if (process.env.REACT_NATIVE_OFFLINE_MODE === 'true') {
  console.log('⚡ Configuration optimisée pour le mode OFFLINE');
  config.transformer.experimentalImportSupport = false;
} else {
  console.log('🌐 Configuration optimisée pour le mode ONLINE');
  config.transformer.experimentalImportSupport = true;
}

// Exporter la configuration en CommonJS
module.exports = config;