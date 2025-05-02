/**
 * Mock pour le module fs dans l'environnement React Native
 * Ce module fournit des implémentations simulées des fonctions de Node.js fs
 * pour que les bibliothèques comme Jimp puissent fonctionner sans erreur
 */

// Version minimale simulée du module fs
module.exports = {
  readFileSync: function(path) {
    console.log(`[fs-mock] readFileSync appelé pour: ${path}`);
    // Retourner un buffer vide au lieu de planter
    return Buffer.from([]);
  },
  
  readFile: function(path, options, callback) {
    console.log(`[fs-mock] readFile appelé pour: ${path}`);
    
    // Gérer le cas où options est une fonction (callback)
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    // Simuler une opération asynchrone
    setTimeout(() => {
      if (callback) {
        callback(null, Buffer.from([]));
      }
    }, 0);
  },
  
  writeFileSync: function(path, data) {
    console.log(`[fs-mock] writeFileSync appelé pour: ${path}`);
    // Ne rien faire, juste logger
    return;
  },
  
  writeFile: function(path, data, options, callback) {
    console.log(`[fs-mock] writeFile appelé pour: ${path}`);
    
    // Gérer le cas où options est une fonction (callback)
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    // Simuler une opération asynchrone
    setTimeout(() => {
      if (callback) {
        callback(null);
      }
    }, 0);
  },
  
  existsSync: function(path) {
    console.log(`[fs-mock] existsSync appelé pour: ${path}`);
    // Toujours retourner false pour éviter des comportements imprévus
    return false;
  },
  
  statSync: function(path) {
    console.log(`[fs-mock] statSync appelé pour: ${path}`);
    // Retourner un objet stat minimal
    return {
      isFile: () => true,
      isDirectory: () => false,
      size: 0,
      mtime: new Date()
    };
  },
  
  unlinkSync: function(path) {
    console.log(`[fs-mock] unlinkSync appelé pour: ${path}`);
    // Ne rien faire
    return;
  },
  
  mkdirSync: function(path, options) {
    console.log(`[fs-mock] mkdirSync appelé pour: ${path}`);
    // Ne rien faire
    return;
  },
  
  readdirSync: function(path) {
    console.log(`[fs-mock] readdirSync appelé pour: ${path}`);
    // Retourner un tableau vide
    return [];
  },
  
  // Ajouter d'autres méthodes selon les besoins
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1
  }
};