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
      // Ajout de plugins pour résoudre les problèmes de dépendances circulaires
      "@babel/plugin-transform-flow-strip-types",
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-optional-chaining",
      "@babel/plugin-proposal-nullish-coalescing-operator"
    ],
    // Options pour préserver les commentaires et améliorer la gestion des erreurs
    compact: false,
    comments: true,
    retainLines: true,
    sourceType: 'unambiguous',
    // Options pour améliorer la stabilité du bundling
    minified: false,
    sourceMaps: true,
    // Configuration pour les fichiers problématiques
    overrides: [
      {
        test: /\.ts$/,
        sourceType: 'unambiguous',
        plugins: [
          ['@babel/plugin-transform-typescript', {
            allowNamespaces: true,
            onlyRemoveTypeImports: true
          }]
        ]
      },
      // Gérer spécifiquement les modules problématiques
      {
        test: /node_modules[\/\\](react-native|@react-native-community|@react-navigation|react-native-reanimated)/,
        sourceType: 'unambiguous'
      }
    ]
  };
};
