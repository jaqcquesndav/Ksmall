// Global type definitions for React Native with Hermes engine
// and other global variables used in the app

declare global {
  // Hermes engine globals
  var HermesInternal: any;
  var __r: Function;
  
  // Global app state variables
  var __DEMO_MODE__: boolean;
  var __OFFLINE_MODE__: boolean;
  var __HERMES_RUNTIME_READY__: boolean;
}

// Déclarations de types pour les fichiers d'images
declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module '*.jpeg' {
  const content: any;
  export default content;
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.gif' {
  const content: any;
  export default content;
}

export {};