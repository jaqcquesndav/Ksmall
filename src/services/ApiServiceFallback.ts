import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import * as SQLite from 'expo-sqlite';
import DatabaseService from './DatabaseService';

/**
 * ApiServiceFallback.ts
 * 
 * Service API de secours qui génère des données simulées.
 * Utilisé lorsque les autres services API ne sont pas disponibles.
 */

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * Service API de secours qui simule les réponses
 */
class ApiServiceFallback {
  private static instance: ApiServiceFallback;
  private demoMode: boolean = true; // Toujours en mode démo par défaut

  private constructor() {
    console.warn('Using API Fallback Service - no real API calls will be made');
  }

  /**
   * Obtenir l'instance singleton
   */
  public static getInstance(): ApiServiceFallback {
    if (!ApiServiceFallback.instance) {
      ApiServiceFallback.instance = new ApiServiceFallback();
    }
    return ApiServiceFallback.instance;
  }

  /**
   * Génère une réponse simulée
   */
  private async generateDemoResponse<T>(method: string, url: string, payload?: any): Promise<ApiResponse<T>> {
    // Simuler un délai de réseau
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`[DEMO API] ${method} ${url}`, payload || '');
    
    // Données simulées génériques
    const demoData: any = { 
      success: true,
      message: `Simulation de ${method} pour ${url}`, 
      timestamp: new Date().toISOString(),
      payload
    };
    
    return {
      data: demoData as T,
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'x-demo-mode': 'true'
      }
    };
  }

  /**
   * Active ou désactive le mode démo (toujours actif dans cette implémentation)
   */
  public enableDemoMode(enabled: boolean = true): void {
    this.demoMode = true; // Forcer à true, cette implémentation est toujours en mode démo
    console.warn('ApiServiceFallback is always in demo mode');
  }

  /**
   * Vérifie si le service est en mode démo
   */
  public isDemoMode(): boolean {
    return this.demoMode;
  }

  /**
   * Effectuer une requête GET simulée
   */
  public async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    return this.generateDemoResponse<T>('GET', url, params);
  }

  /**
   * Effectuer une requête POST simulée
   */
  public async post<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return this.generateDemoResponse<T>('POST', url, data);
  }

  /**
   * Effectuer une requête PUT simulée
   */
  public async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.generateDemoResponse<T>('PUT', url, data);
  }

  /**
   * Effectuer une requête PATCH simulée
   */
  public async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.generateDemoResponse<T>('PATCH', url, data);
  }

  /**
   * Effectuer une requête DELETE simulée
   */
  public async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.generateDemoResponse<T>('DELETE', url);
  }

  /**
   * Simuler un upload de fichier
   */
  public async uploadFile<T = any>(
    url: string,
    fileUri: string,
    fileField: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const payload = {
      fileUri,
      fileField,
      additionalData
    };
    
    return this.generateDemoResponse<T>('UPLOAD', url, payload);
  }
}

export default ApiServiceFallback.getInstance();