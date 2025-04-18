/**
 * ApiServiceWrapper.ts - Implémentation API basée sur fetch pour Android
 * 
 * Ce service est une alternative à ApiService.ts, spécifiquement pour Android.
 * Il utilise fetch au lieu d'axios pour éviter les problèmes de bundling.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import { API_BASE_URL } from '../config/constants';

class ApiServiceWrapper {
  private static instance: ApiServiceWrapper;
  private apiUrl: string = API_BASE_URL || 'https://api.ksmall.com/v1';
  private demoMode: boolean = false;
  
  private constructor() {
    logger.info('ApiServiceWrapper initialized with fetch implementation');
  }
  
  public static getInstance(): ApiServiceWrapper {
    if (!ApiServiceWrapper.instance) {
      ApiServiceWrapper.instance = new ApiServiceWrapper();
    }
    return ApiServiceWrapper.instance;
  }

  /**
   * Effectue une requête avec un token d'authentification si disponible
   */
  private async request<T = any>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // Ajouter le token d'authentification si disponible
      const token = await AsyncStorage.getItem('@auth_token');
      const headers = new Headers(options.headers || {});
      
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      // Préparer la configuration de la requête
      const config = {
        ...options,
        headers
      };

      // Effectuer la requête
      const response = await fetch(`${this.apiUrl}${url}`, config);
      
      // Gérer les erreurs HTTP
      if (!response.ok) {
        // Gérer le renouvellement du token en cas d'erreur 401
        if (response.status === 401) {
          const isRetried = config.headers?.get('x-retry');
          if (!isRetried) {
            try {
              const refreshed = await this.refreshToken();
              if (refreshed) {
                headers.set('x-retry', 'true');
                headers.set('Authorization', `Bearer ${await AsyncStorage.getItem('@auth_token')}`);
                return this.request(url, config);
              }
            } catch (refreshError) {
              logger.error('Token refresh failed', refreshError);
              await this.clearAuthData();
              throw refreshError;
            }
          } else {
            // Déjà essayé de rafraîchir le token, nettoyage des données d'authentification
            await this.clearAuthData();
          }
        }
        
        // Construire une erreur structurée similaire à axios
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        (error as any).response = {
          data: errorData,
          status: response.status,
          statusText: response.statusText,
          headers: this.headersToObject(response.headers),
          config
        };
        throw error;
      }
      
      // Parser la réponse JSON
      const data = await response.json();
      
      // Retourner une réponse structurée similaire à axios
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: this.headersToObject(response.headers),
        config
      } as any;
    } catch (error) {
      logger.error(`API request error: ${url}`, error);
      throw error;
    }
  }

  /**
   * Convertit les en-têtes de réponse en objet simple
   */
  private headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Rafraîchit le token d'authentification
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem('@refresh_token');
      
      if (!refreshToken) {
        return false;
      }
      
      const response = await fetch(`${this.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      
      if (data.access_token) {
        await AsyncStorage.setItem('@auth_token', data.access_token);
        if (data.refresh_token) {
          await AsyncStorage.setItem('@refresh_token', data.refresh_token);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Efface les données d'authentification
   */
  private async clearAuthData(): Promise<void> {
    await AsyncStorage.multiRemove(['@auth_token', '@refresh_token', '@user']);
    // Dans une vraie application, vous pourriez vouloir déclencher un événement pour rediriger vers la page de connexion
  }

  /**
   * Effectue une requête GET
   */
  public async get<T = any>(url: string, params?: any): Promise<T> {
    // Construire l'URL avec paramètres de requête
    const urlWithParams = params 
      ? `${url}?${Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&')}`
      : url;
      
    return this.request<T>(urlWithParams, { method: 'GET' });
  }

  /**
   * Effectue une requête POST
   */
  public async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const options: RequestInit = {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config
    };
    
    return this.request<T>(url, options);
  }

  /**
   * Effectue une requête PUT
   */
  public async put<T = any>(url: string, data?: any): Promise<T> {
    const options: RequestInit = {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    };
    
    return this.request<T>(url, options);
  }

  /**
   * Effectue une requête PATCH
   */
  public async patch<T = any>(url: string, data?: any): Promise<T> {
    const options: RequestInit = {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    };
    
    return this.request<T>(url, options);
  }

  /**
   * Effectue une requête DELETE
   */
  public async delete<T = any>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }

  /**
   * Télécharge un fichier
   */
  public async uploadFile<T = any>(
    url: string,
    fileUri: string,
    fileField: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    
    const fileName = fileUri.split('/').pop();
    const match = /\.(\w+)$/.exec(fileUri.split('?')[0]);
    const fileType = match ? `image/${match[1]}` : 'image';
    
    formData.append(fileField, {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as any);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    // Ne pas définir le Content-Type ici pour permettre au navigateur d'ajouter le boundary approprié
    const options: RequestInit = {
      method: 'POST',
      body: formData
    };
    
    return this.request<T>(url, options);
  }

  /**
   * Vérifie si l'API est en mode démo
   */
  public isDemoMode(): boolean {
    return this.demoMode;
  }

  /**
   * Active ou désactive le mode démo
   */
  public enableDemoMode(enabled: boolean = true): void {
    this.demoMode = enabled;
  }
}

export default ApiServiceWrapper.getInstance();