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
        "blacklist": null,
        "whitelist": null,
        "safe": false,
        "allowUndefined": true
      }]
    ],
    // Options pour préserver les commentaires et améliorer la gestion des erreurs
    compact: false,
    comments: true,
    retainLines: true,
    sourceType: 'unambiguous',
    // Nouvelles options pour améliorer la gestion des caractères spéciaux
    minified: false,
    inputSourceMap: true,
    sourceMaps: true,
    // Options spécifiques pour les fichiers problématiques
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
      }
    ]
  };
};
