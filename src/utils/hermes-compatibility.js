/**
 * Hermes Compatibility Layer
 * Adds necessary polyfills and fixes for the Hermes JavaScript engine
 */

// Ensure Function.prototype is available and properly configured for Hermes
if (typeof Function.prototype.bind === 'undefined') {
  Function.prototype.bind = function(context) {
    const fn = this;
    return function() {
      return fn.apply(context, arguments);
    };
  };
}

// Ensure Object.prototype methods are available
if (!Object.hasOwnProperty('setPrototypeOf')) {
  Object.setPrototypeOf = function(obj, proto) {
    obj.__proto__ = proto;
    return obj;
  };
}

// Add Function.name support if missing
if (Object.defineProperty && Object.getOwnPropertyDescriptor) {
  const descriptors = {};
  [
    { obj: Function.prototype, prop: 'name', fallback: '' }
  ].forEach(({ obj, prop, fallback }) => {
    if (!Object.getOwnPropertyDescriptor(obj, prop)) {
      descriptors[prop] = { 
        configurable: true, 
        get: function() { return this._name || fallback; },
        set: function(name) { this._name = name; }
      };
    }
  });
  
  try {
    Object.defineProperties(Function.prototype, descriptors);
  } catch (e) {
    console.warn('Failed to define Function.prototype.name:', e);
  }
}

// Log that Hermes compatibility layer has initialized
console.log('[DEBUG] Hermes compatibility layer initialized');