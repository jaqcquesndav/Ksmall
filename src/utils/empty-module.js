/**
 * Module vide pour remplacer les modules Node.js qui ne sont pas disponibles dans React Native
 */

module.exports = {
  // Crypto functions
  randomBytes: function() { return new Uint8Array(16); },
  createHash: function() { 
    return { 
      update: function() { return this; },
      digest: function() { return ''; }
    }; 
  },
  createHmac: function() { 
    return { 
      update: function() { return this; },
      digest: function() { return ''; }
    }; 
  },
  
  // HTTP functions
  request: function() { 
    return { 
      on: function() { return this; },
      end: function() {}
    };
  },
  
  // Empty implementations for other modules
  connect: function() {},
  write: function() {},
  read: function() {},
  end: function() {},
  createServer: function() {},
  createClient: function() {}
};