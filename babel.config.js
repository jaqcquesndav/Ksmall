module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        disableImportExportTransform: false
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
      // Plugins de transformation avec Hermes compatibility
      ["@babel/plugin-transform-class-properties", { "loose": false }],
      ["@babel/plugin-transform-private-methods", { "loose": false }],
      ["@babel/plugin-transform-private-property-in-object", { "loose": false }],
      // Plugins supplémentaires
      "@babel/plugin-transform-flow-strip-types",
      "@babel/plugin-proposal-optional-chaining",
      "@babel/plugin-proposal-nullish-coalescing-operator"
    ],
    // Ajouter cette section pour permettre la globalisation de require
    env: {
      production: {
        plugins: ['babel-plugin-transform-remove-console']  // Nom complet du plugin
      }
    }
  };
};
