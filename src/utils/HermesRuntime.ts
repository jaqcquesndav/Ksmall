/**
 * HermesRuntime.ts - Gestion du runtime Hermes
 * 
 * Ce module centralise la gestion de l'état du runtime Hermes et offre 
 * des utilitaires pour vérifier si le runtime est prêt avant d'exécuter 
 * des opérations critiques.
 */

import { Platform } from 'react-native';
import logger from './logger';

// Type d'environnement JavaScript détecté
type JsEngine = 'hermes' | 'jsc' | 'v8' | 'unknown';

// Interface pour suivre l'état du runtime
interface RuntimeStatus {
  engine: JsEngine;
  isReady: boolean;
  supportsRequire: boolean;
  supportsImport: boolean;
  initialized: boolean;
  initTimestamp: number;
}

/**
 * Gestion centralisée du runtime JavaScript (Hermes/JSC)
 */
class HermesRuntime {
  private static _instance: HermesRuntime;
  private _status: RuntimeStatus = {
    engine: 'unknown',
    isReady: false,
    supportsRequire: false,
    supportsImport: false,
    initialized: false,
    initTimestamp: 0
  };

  private _readyCallbacks: Array<() => void> = [];

  /**
   * Constructeur privé pour Singleton
   */
  private constructor() {
    this._detectEngine();
    this._monitorReadiness();
  }

  /**
   * Obtenir l'instance unique
   */
  public static getInstance(): HermesRuntime {
    if (!HermesRuntime._instance) {
      HermesRuntime._instance = new HermesRuntime();
    }
    return HermesRuntime._instance;
  }

  /**
   * Identifier le moteur JavaScript utilisé
   */
  private _detectEngine(): void {
    try {
      if (typeof global.HermesInternal !== 'undefined') {
        this._status.engine = 'hermes';
        logger.info('Runtime JavaScript: Hermes détecté');
      } else if ((global as any).nativeFabricUIManager) {
        this._status.engine = 'jsc';
        logger.info('Runtime JavaScript: JSC (avec Fabric) détecté');
      } else if ((global as any)._v8runtime) {
        this._status.engine = 'v8';
        logger.info('Runtime JavaScript: V8 détecté');
      } else {
        this._status.engine = 'jsc';
        logger.info('Runtime JavaScript: JSC (supposé par défaut)');
      }
    } catch (error) {
      logger.warn('Impossible de détecter précisément le moteur JavaScript', error);
      this._status.engine = 'unknown';
    }
  }

  /**
   * Vérifier et surveiller l'état de préparation du runtime
   */
  private _monitorReadiness(): void {
    const checkRequireSupport = () => {
      try {
        // Vérifier si require existe dans l'environnement global
        this._status.supportsRequire = typeof global.require === 'function';
        
        // Pour Hermes, vérifier également __r qui est une implémentation interne
        if (this._status.engine === 'hermes' && !this._status.supportsRequire) {
          if (typeof (global as any).__r === 'function') {
            // Si __r existe mais pas require, essayer de le rendre disponible
            (global as any).require = (global as any).__r;
            this._status.supportsRequire = true;
            logger.info('Support require activé via __r pour Hermes');
          }
        }
      } catch (e) {
        this._status.supportsRequire = false;
        logger.warn('Vérification de require a échoué', e);
      }

      return this._status.supportsRequire;
    };

    const checkImportSupport = () => {
      try {
        // Vérifier le support de import dynamique en essayant de l'évaluer
        // Note: On ne peut pas vraiment tester cela directement sans exécuter
        this._status.supportsImport = true; // Supposer que c'est supporté
      } catch (e) {
        this._status.supportsImport = false;
        logger.warn('Vérification de import a échoué', e);
      }

      return this._status.supportsImport;
    };

    // Essayer de détecter le support immédiatement
    const requireSupported = checkRequireSupport();
    const importSupported = checkImportSupport();

    if (requireSupported && importSupported) {
      this._status.isReady = true;
      this._status.initialized = true;
      this._status.initTimestamp = Date.now();
      logger.info('Runtime JavaScript prêt immédiatement');
      this._notifyReady();
    } else {
      // Si pas prêt, configurer une vérification périodique
      logger.warn(`Runtime pas entièrement prêt: require=${requireSupported}, import=${importSupported}`);
      
      // Vérifier toutes les 100ms pendant 5 secondes au maximum
      let attempts = 0;
      const maxAttempts = 50; // 5 secondes
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        const reqSupported = checkRequireSupport();
        const impSupported = checkImportSupport();
        
        if (reqSupported && impSupported) {
          clearInterval(checkInterval);
          this._status.isReady = true;
          this._status.initialized = true;
          this._status.initTimestamp = Date.now();
          logger.info(`Runtime JavaScript prêt après ${attempts} tentatives`);
          this._notifyReady();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          logger.error(`Runtime pas prêt après ${attempts} tentatives, utilisation risquée`);
          
          // Même si tout n'est pas supporté, marquer comme initialisé pour continuer
          this._status.initialized = true;
          this._status.initTimestamp = Date.now();
          
          // Marquer ready même si incomplet pour ne pas bloquer l'application
          this._status.isReady = true;
          this._notifyReady();
        }
      }, 100);
    }
  }

  /**
   * Notifier les callbacks en attente que le runtime est prêt
   */
  private _notifyReady(): void {
    this._readyCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        logger.error('Erreur dans un callback de runtime ready', error);
      }
    });
    this._readyCallbacks = []; // Vider la liste après notification
  }

  /**
   * Obtenir l'état actuel du runtime
   */
  public getStatus(): RuntimeStatus {
    return { ...this._status };
  }

  /**
   * Vérifier si le runtime est prêt
   */
  public isReady(): boolean {
    return this._status.isReady;
  }

  /**
   * Vérifier si require est supporté
   */
  public supportsRequire(): boolean {
    return this._status.supportsRequire;
  }

  /**
   * Vérifier si import dynamique est supporté
   */
  public supportsImport(): boolean {
    return this._status.supportsImport;
  }

  /**
   * Exécuter une fonction de manière sécurisée
   * @param fn Fonction à exécuter
   * @param fallback Fonction à exécuter en cas d'échec
   */
  public safeExec<T>(fn: () => T, fallback?: () => T): T | undefined {
    try {
      return fn();
    } catch (error) {
      logger.error('Erreur lors de l\'exécution sécurisée', error);
      if (fallback) {
        try {
          return fallback();
        } catch (fallbackError) {
          logger.error('Erreur également dans le fallback', fallbackError);
        }
      }
      return undefined;
    }
  }

  /**
   * Exécuter une fonction une fois que le runtime est prêt
   */
  public onReady(callback: () => void): void {
    if (this._status.isReady) {
      // Si déjà prêt, exécuter immédiatement
      setTimeout(() => callback(), 0);
    } else {
      // Sinon ajouter à la liste d'attente
      this._readyCallbacks.push(callback);
    }
  }

  /**
   * Exécuter une fonction asynchrone une fois que le runtime est prêt
   */
  public async whenReady<T>(asyncFn: () => Promise<T>): Promise<T> {
    if (!this._status.isReady) {
      // Attendre que le runtime soit prêt
      await new Promise<void>(resolve => this.onReady(resolve));
    }
    
    return asyncFn();
  }
}

// Exporter une instance unique
const hermesRuntime = HermesRuntime.getInstance();
export default hermesRuntime;