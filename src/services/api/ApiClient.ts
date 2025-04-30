import { AUTH_API_ENDPOINT } from '../../config/auth0';
import { getAccessToken } from '../auth/TokenStorage';
import Auth0Service from '../auth/Auth0Service';
import logger from '../../utils/logger';
import { handleError, ErrorType, executeWithRetry } from '../../utils/errorHandler';

// Types pour l'API client fetch
interface ApiClientOptions {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
  _retry?: boolean;
  params?: Record<string, string>;
  timeout?: number;
  urlParams?: string; // Ajout de la propriété urlParams pour stocker temporairement l'URL
}

// Interface pour les erreurs formatées
interface FormattedError {
  status?: number;
  statusText?: string;
  message: string;
  data?: any;
}

/**
 * Classe ApiClient qui utilise fetch au lieu d'axios
 * Plus robuste et compatible avec React Native sans polyfills
 */
class FetchApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;
  private timeout: number;

  constructor(options: ApiClientOptions) {
    this.baseURL = options.baseURL;
    this.timeout = options.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };
  }

  /**
   * Prépare la configuration de la requête en ajoutant les headers d'authentification si nécessaire
   */
  private async prepareRequest(config: RequestConfig): Promise<RequestConfig> {
    const finalConfig = { ...config };
    
    // Headers par défaut
    finalConfig.headers = {
      ...this.defaultHeaders,
      ...finalConfig.headers
    };

    // Ajouter le token d'authentification si requis
    if (finalConfig.requiresAuth !== false) {
      try {
        const token = await getAccessToken();
        if (token) {
          finalConfig.headers = {
            ...finalConfig.headers,
            'Authorization': `Bearer ${token}`
          };
        }
      } catch (error) {
        logger.warn('Error adding auth token to request:', error);
        // On continue malgré l'erreur pour plus de robustesse
      }
    }

    // Ajouter les paramètres à l'URL si nécessaire
    if (finalConfig.params) {
      const queryParams = new URLSearchParams();
      Object.entries(finalConfig.params).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      const queryString = queryParams.toString();
      // Stocker temporairement l'URL dans une propriété temporaire
      const fullUrl = queryString ? `${queryString}` : '';
      finalConfig.urlParams = fullUrl; // Utiliser une propriété personnalisée pour stockage temporaire
    }

    return finalConfig;
  }

  /**
   * Effectue une requête avec fetch et utilise le gestionnaire d'erreurs robuste
   */
  private async request<T>(url: string, config: RequestConfig): Promise<T> {
    // Utiliser le gestionnaire d'erreurs robuste pour exécuter la requête
    return await executeWithRetry<T>(
      async () => {
        // Préparer la configuration
        const finalConfig = await this.prepareRequest(config);
        const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
        
        // Implémenter un timeout car fetch n'en a pas nativement
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        finalConfig.signal = controller.signal;

        try {
          const response = await fetch(fullUrl, finalConfig);
          clearTimeout(timeoutId);

          // Gérer les erreurs 401 (token expiré)
          if (response.status === 401 && !finalConfig._retry && finalConfig.requiresAuth !== false) {
            finalConfig._retry = true;
            
            try {
              logger.info('Token expiré, tentative de rafraîchissement...');
              const newToken = await Auth0Service.refreshToken();
              
              if (newToken) {
                // Mettre à jour l'en-tête d'autorisation et réessayer la requête
                finalConfig.headers = {
                  ...finalConfig.headers,
                  'Authorization': `Bearer ${newToken}`
                };
                return this.request<T>(url, finalConfig);
              }
            } catch (refreshError) {
              logger.error('Échec du rafraîchissement du token:', refreshError);
              throw refreshError;
            }
          }

          // Traiter la réponse
          let data;
          
          try {
            // Essayer de parser en JSON si possible
            if (response.headers.get('Content-Type')?.includes('application/json')) {
              data = await response.json();
            } else {
              data = await response.text();
            }
          } catch (parseError) {
            // Si le parsing échoue, utiliser le texte brut
            data = await response.text();
          }

          if (!response.ok) {
            const error: FormattedError = {
              status: response.status,
              statusText: response.statusText,
              message: data?.message || `Request failed with status ${response.status}`,
              data: data
            };
            throw error;
          }

          return data as T;
        } catch (error) {
          clearTimeout(timeoutId);
          
          // Formater l'erreur
          if (error.name === 'AbortError') {
            const timeoutError: FormattedError = {
              message: `Request timed out after ${this.timeout}ms`,
            };
            throw timeoutError;
          }
          
          throw error;
        }
      },
      ErrorType.API,
      3 // Nombre maximum de tentatives
    ) as T;
  }

  /**
   * Méthodes HTTP avec gestion robuste des erreurs
   */
  async get<T>(url: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(url: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(url: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch<T>(url: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(url: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}

// Client API pour le service d'authentification
export const authApi = new FetchApiClient({
  baseURL: AUTH_API_ENDPOINT,
});

// Exporter l'instance et le gestionnaire d'erreurs
export default {
  auth: authApi,
  errorHandler: handleError
};
