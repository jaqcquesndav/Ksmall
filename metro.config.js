const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Créer la configuration par défaut
const config = getDefaultConfig(__dirname);

// Liste des modules problématiques à exclure du bundle
const modulesToExclude = [
  'axios',
  'follow-redirects',
  'form-data'
];

// Configuration pour exclure les modules problématiques
config.resolver = {
  ...config.resolver,
  blockList: modulesToExclude.map(
    module => new RegExp(`node_modules[\\\\/]${module}[\\\\/].*`)
  )
};

module.exports = config;
