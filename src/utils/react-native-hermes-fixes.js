/**
 * React Native Hermes Engine Fixes
 * This file provides specific fixes for common issues with React Native and Hermes
 */

// Make sure global.performance exists (needed by some React Native internals)
if (global.performance === undefined) {
  global.performance = {
    now: () => Date.now(),
  };
}

// Fix issues with Function.prototype binding in Hermes
if (global.Function && global.Function.prototype) {
  const originalBind = global.Function.prototype.bind;
  
  // Only patch if there might be issues
  if (originalBind && String(originalBind).indexOf('[native code]') >= 0) {
    try {
      // Test if the original bind works correctly
      const testFn = function() { return this.value; };
      const boundFn = testFn.bind({ value: 'test' });
      
      // If bind is broken (returns undefined), replace it
      if (boundFn() !== 'test') {
        global.Function.prototype.bind = function(thisArg, ...args) {
          const fn = this;
          return function(...callArgs) {
            return fn.apply(thisArg, [...args, ...callArgs]);
          };
        };
        console.log('[DEBUG] Function.prototype.bind patched for Hermes');
      }
    } catch (e) {
      console.warn('[WARN] Error while checking Function.prototype.bind:', e);
    }
  }
}

// Ensure components can be properly registered
if (!global.__fbBatchedBridgeConfig) {
  global.__fbBatchedBridgeConfig = {
    remoteModuleConfig: {},
  };
}

console.log('[DEBUG] React Native Hermes fixes loaded');