/**
 * Définitions de types personnalisées pour Expo
 * Ce fichier aide à résoudre les problèmes de types manquants dans Expo
 */

// Types pour les assets Expo
declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module '*.svg' {
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

// Définition de types pour les modules Expo sans déclarations
declare module 'expo-asset' {
  export class Asset {
    static loadAsync(moduleIds: number[]): Promise<Asset[]>;
    static fromModule(moduleId: number): Asset;
    downloadAsync(): Promise<Asset>;
  }
}

// Polyfill pour la compatibilité de certaines fonctionnalités Expo
interface ExpoConstants {
  appOwnership: 'expo' | 'standalone' | 'guest';
  expoVersion: string;
  installationId: string;
  manifest: any;
  deviceName?: string;
  deviceYearClass?: number;
  platform?: {
    ios?: {
      buildNumber: string;
    };
    android?: {
      versionCode: string;
    };
  };
}

declare global {
  namespace NodeJS {
    interface Global {
      __expo?: any;
      expo?: any;
    }
  }
}