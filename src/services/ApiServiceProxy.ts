import mainApiService from './api/MainApiService';
import logger from '../utils/logger';
import { getAccessToken } from './auth/TokenStorage';

/**
 * Un proxy pour les services API qui permet d'utiliser l'API backend
 * avec la gestion automatique des tokens d'authentification
 */
class ApiServiceProxy {
  /**
   * Ajoute le token d'authentification aux en-têtes si disponible
   */
  private async addAuthHeaders(headers: Record<string, any> = {}): Promise<Record<string, any>> {
    try {
      const token = await getAccessToken();
      if (token) {
        return {
          ...headers,
          'Authorization': `Bearer ${token}`
        };
      }
      return headers;
    } catch (error) {
      logger.warn('Impossible de récupérer le token d\'authentification:', error);
      return headers;
    }
  }

  /**
   * Renvoie une requête GET vers l'API
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const headers = await this.addAuthHeaders();
      return await mainApiService.get<T>(endpoint, { params, headers });
    } catch (error) {
      logger.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Renvoie une requête POST vers l'API
   */
  async post<T>(endpoint: string, data?: Record<string, any>): Promise<T> {
    try {
      // Comme MainApiService.post n'accepte pas d'options en 3ème argument,
      // il faut modifier l'approche pour utiliser l'intercepteur Axios
      return await mainApiService.post<T>(endpoint, data);
    } catch (error) {
      logger.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Renvoie une requête PUT vers l'API
   */
  async put<T>(endpoint: string, data?: Record<string, any>): Promise<T> {
    try {
      // Comme MainApiService.put n'accepte pas d'options en 3ème argument,
      // il faut modifier l'approche pour utiliser l'intercepteur Axios
      return await mainApiService.put<T>(endpoint, data);
    } catch (error) {
      logger.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Renvoie une requête PATCH vers l'API
   */
  async patch<T>(endpoint: string, data?: Record<string, any>): Promise<T> {
    try {
      // Comme MainApiService.patch n'accepte pas d'options en 3ème argument,
      // il faut modifier l'approche pour utiliser l'intercepteur Axios
      return await mainApiService.patch<T>(endpoint, data);
    } catch (error) {
      logger.error(`PATCH ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Renvoie une requête DELETE vers l'API
   */
  async delete<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const headers = await this.addAuthHeaders();
      return await mainApiService.delete<T>(endpoint, { params, headers });
    } catch (error) {
      logger.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }
}

export default new ApiServiceProxy();