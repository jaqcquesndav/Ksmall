/**
 * Configuration Babel pour projet Ksmall
 * Format CommonJS (.cjs) pour garantir la compatibilité avec Metro
 */

module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        disableImportExportTransform: false,
        // Désactiver les plugins JSX redondants qui sont déjà inclus dans le runtime automatique React
        jsxRuntime: 'automatic'
      }]
    ],
    plugins: [
      'react-native-reanimated/plugin',
      '@babel/plugin-transform-export-namespace-from',
      '@babel/plugin-proposal-export-default-from',
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env",
        "safe": true,
        "allowUndefined": true
      }],
      // Plugins de transformation avec Hermes compatibility - pas ceux qui interfèrent avec JSX automatic
      ["@babel/plugin-transform-class-properties", { "loose": false }],
      ["@babel/plugin-transform-private-methods", { "loose": false }],
      ["@babel/plugin-transform-private-property-in-object", { "loose": false }],
      // Plugins supplémentaires - non JSX-related
      "@babel/plugin-transform-flow-strip-types",
      "@babel/plugin-proposal-optional-chaining",
      "@babel/plugin-proposal-nullish-coalescing-operator"
    ],
    // Configuration pour l'environnement de production
    env: {
      production: {
        plugins: ['babel-plugin-transform-remove-console']
      },
      development: {
        // Ne pas inclure transform-react-jsx-self ou transform-react-jsx-source ici
        // car ils sont automatiquement inclus en mode development avec jsxRuntime: 'automatic'
      }
    }
  };
};