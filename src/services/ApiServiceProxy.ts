import { Platform } from 'react-native';
import logger from '../utils/logger';
import ApiServiceFallback from './ApiServiceFallback';

// Import statique conditionnel
let mainApiService: any = null;
// Ne pas tenter d'importer axios sur Android
if (Platform.OS !== 'android') {
  try {
    mainApiService = require('./ApiService').default;
  } catch (error) {
    logger.warn('Failed to load ApiService:', error);
  }
} else {
  logger.info('Android platform detected, using demo mode by default');
}

/**
 * Un proxy pour les services API qui permet d'utiliser le mode démo avec SQLite
 * ou le mode en ligne avec l'API backend selon les besoins et la plateforme.
 */
class ApiServiceProxy {
  private static instance: ApiServiceProxy;
  private fallbackApiService: typeof ApiServiceFallback;
  private useDemo: boolean;

  private constructor() {
    this.fallbackApiService = ApiServiceFallback;
    
    // Par défaut, utiliser le mode démo sur Android
    this.useDemo = Platform.OS === 'android' || !mainApiService || this.checkDemoModeEnabled();
    
    if (this.useDemo) {
      logger.info(`API Service initialized in demo mode (${Platform.OS})`);
      // Définir la variable globale pour le mode démo
      if (global) {
        // @ts-ignore
        global.__DEMO_MODE__ = true;
      }
    }
  }
  
  /**
   * Vérifier si le mode démo est explicitement activé
   */
  private checkDemoModeEnabled(): boolean {
    return typeof global !== 'undefined' && (global as any).__DEMO_MODE__ === true;
  }

  /**
   * Obtenir le service API approprié (principal ou démo)
   */
  private getApiService() {
    return this.useDemo ? this.fallbackApiService : mainApiService;
  }

  /**
   * Activer explicitement le mode démo
   */
  public enableDemoMode(enabled: boolean = true): void {
    this.useDemo = enabled;
    if (global) {
      // @ts-ignore
      global.__DEMO_MODE__ = enabled;
    }
    logger.info(`Demo mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Vérifier si le mode démo est activé
   */
  public isDemoMode(): boolean {
    return this.useDemo;
  }

  /**
   * Obtenir l'instance singleton du service
   */
  public static getInstance(): ApiServiceProxy {
    if (!ApiServiceProxy.instance) {
      ApiServiceProxy.instance = new ApiServiceProxy();
    }
    return ApiServiceProxy.instance;
  }

  /**
   * Effectuer une requête avec fallback automatique
   */
  private async executeWithFallback<T>(method: string, ...args: any[]): Promise<T> {
    try {
      const api = this.getApiService();
      if (!api) {
        throw new Error('No API service available');
      }
      // @ts-ignore
      return await api[method](...args);
    } catch (error) {
      logger.error(`Error in API ${method} call:`, error);
      
      // Si nous n'utilisons pas déjà le démo, essayer le démo
      if (!this.useDemo) {
        this.useDemo = true;
        logger.warn(`Switching to demo mode for ${method}`);
        // @ts-ignore
        return this.fallbackApiService[method](...args);
      }
      
      // Si le démo échoue aussi, propager l'erreur
      throw error;
    }
  }

  /**
   * Requête GET
   */
  public async get<T = any>(url: string, params?: any): Promise<T> {
    return this.executeWithFallback<T>('get', url, params);
  }

  /**
   * Requête POST
   */
  public async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.executeWithFallback<T>('post', url, data, config);
  }

  /**
   * Requête PUT
   */
  public async put<T = any>(url: string, data?: any): Promise<T> {
    return this.executeWithFallback<T>('put', url, data);
  }

  /**
   * Requête PATCH
   */
  public async patch<T = any>(url: string, data?: any): Promise<T> {
    return this.executeWithFallback<T>('patch', url, data);
  }

  /**
   * Requête DELETE
   */
  public async delete<T = any>(url: string): Promise<T> {
    return this.executeWithFallback<T>('delete', url);
  }

  /**
   * Upload de fichier
   */
  public async uploadFile<T = any>(
    url: string,
    fileUri: string,
    fileField: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<T> {
    return this.executeWithFallback<T>('uploadFile', url, fileUri, fileField, additionalData);
  }
}

export default ApiServiceProxy.getInstance();