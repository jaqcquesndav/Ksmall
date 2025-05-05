/**
 * Mock pour le module zlib dans l'environnement React Native
 * Ce module fournit des implémentations simulées des fonctions de Node.js zlib
 * pour que les bibliothèques comme Jimp puissent fonctionner sans erreur
 */

const zlib = {
  // Fonctions de compression
  deflate: function(buffer, callback) {
    console.log('[zlib-mock] deflate appelé');
    setTimeout(() => {
      if (callback) callback(null, Buffer.from([]));
    }, 0);
  },
  
  deflateSync: function(buffer) {
    console.log('[zlib-mock] deflateSync appelé');
    return Buffer.from([]);
  },
  
  gzip: function(buffer, callback) {
    console.log('[zlib-mock] gzip appelé');
    setTimeout(() => {
      if (callback) callback(null, Buffer.from([]));
    }, 0);
  },
  
  gzipSync: function(buffer) {
    console.log('[zlib-mock] gzipSync appelé');
    return Buffer.from([]);
  },
  
  // Fonctions de décompression
  inflate: function(buffer, callback) {
    console.log('[zlib-mock] inflate appelé');
    setTimeout(() => {
      if (callback) callback(null, Buffer.from([]));
    }, 0);
  },
  
  inflateSync: function(buffer) {
    console.log('[zlib-mock] inflateSync appelé');
    return Buffer.from([]);
  },
  
  gunzip: function(buffer, callback) {
    console.log('[zlib-mock] gunzip appelé');
    setTimeout(() => {
      if (callback) callback(null, Buffer.from([]));
    }, 0);
  },
  
  gunzipSync: function(buffer) {
    console.log('[zlib-mock] gunzipSync appelé');
    return Buffer.from([]);
  },
  
  // Constantes
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1
};

export default zlib;