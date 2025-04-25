import ApiService from '../ApiService';
import { User } from '../../../types/auth';
import logger from '../../../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Interface pour la requête de connexion
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface pour la requête d'inscription
 */
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  companyName?: string;
  position?: string;
  language?: string;
}

/**
 * Interface pour la réponse d'authentification
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Service API pour l'authentification
 */
class AuthApiService {
  private static readonly BASE_PATH = '/auth';

  /**
   * Connexion à l'API
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await ApiService.post<AuthResponse>(
        `${AuthApiService.BASE_PATH}/login`,
        credentials,
        false // Désactiver le support hors ligne pour les opérations d'auth
      );
      
      // Stocker le token d'authentification
      if (response?.token) {
        await AsyncStorage.setItem('auth_token', response.token);
        await AsyncStorage.setItem('refresh_token', response.refreshToken);
        await AsyncStorage.setItem('token_expires_at', response.expiresAt.toString());
        await AsyncStorage.setItem('current_user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      logger.error('Erreur lors de la connexion', error);
      throw error;
    }
  }

  /**
   * Inscription à l'API
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await ApiService.post<AuthResponse>(
        `${AuthApiService.BASE_PATH}/register`,
        userData,
        false // Désactiver le support hors ligne pour les opérations d'auth
      );
      
      // Stocker le token d'authentification
      if (response?.token) {
        await AsyncStorage.setItem('auth_token', response.token);
        await AsyncStorage.setItem('refresh_token', response.refreshToken);
        await AsyncStorage.setItem('token_expires_at', response.expiresAt.toString());
        await AsyncStorage.setItem('current_user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      logger.error('Erreur lors de l\'inscription', error);
      throw error;
    }
  }

  /**
   * Déconnexion de l'API
   */
  async logout(): Promise<boolean> {
    try {
      // Appel au backend pour invalider le token
      try {
        await ApiService.post(`${AuthApiService.BASE_PATH}/logout`, {}, false);
      } catch (error) {
        // Ignorer les erreurs de backend lors de la déconnexion
        logger.warn('Erreur lors de la déconnexion côté backend', error);
      }

      // Supprimer les données d'authentification locales
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('token_expires_at');
      await AsyncStorage.removeItem('current_user');
      
      return true;
    } catch (error) {
      logger.error('Erreur lors de la déconnexion', error);
      throw error;
    }
  }

  /**
   * Rafraîchit le token d'authentification
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('Pas de refresh token disponible');
      }
      
      const response = await ApiService.post<{ token: string; expiresAt: number }>(
        `${AuthApiService.BASE_PATH}/refresh-token`,
        { refreshToken },
        false
      );
      
      if (response?.token) {
        await AsyncStorage.setItem('auth_token', response.token);
        await AsyncStorage.setItem('token_expires_at', response.expiresAt.toString());
        return response.token;
      }
      
      throw new Error('Échec du rafraîchissement du token');
    } catch (error) {
      logger.error('Erreur lors du rafraîchissement du token', error);
      
      // Si le refresh token est invalide, déconnecter l'utilisateur
      if ((error as Error).message.includes('invalide') || (error as any).status === 401) {
        await this.logout();
      }
      
      throw error;
    }
  }

  /**
   * Réinitialisation du mot de passe
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    try {
      await ApiService.post(
        `${AuthApiService.BASE_PATH}/forgot-password`,
        { email },
        false
      );
      return true;
    } catch (error) {
      logger.error('Erreur lors de la demande de réinitialisation du mot de passe', error);
      throw error;
    }
  }

  /**
   * Vérification de l'état d'authentification actuel
   */
  async checkAuthStatus(): Promise<{ isAuthenticated: boolean; user?: User }> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const expiresAt = await AsyncStorage.getItem('token_expires_at');
      const userJson = await AsyncStorage.getItem('current_user');
      
      if (!token || !expiresAt || !userJson) {
        return { isAuthenticated: false };
      }
      
      // Vérifier si le token est expiré
      const expiryTime = parseInt(expiresAt, 10);
      const currentTime = Date.now();
      
      if (currentTime >= expiryTime) {
        try {
          // Token expiré, essayer de le rafraîchir
          await this.refreshToken();
          const updatedUserJson = await AsyncStorage.getItem('current_user');
          
          if (updatedUserJson) {
            return {
              isAuthenticated: true,
              user: JSON.parse(updatedUserJson)
            };
          }
        } catch (refreshError) {
          // Échec du rafraîchissement, considérer comme non authentifié
          return { isAuthenticated: false };
        }
      }
      
      // Token valide, retourner l'utilisateur
      return {
        isAuthenticated: true,
        user: JSON.parse(userJson)
      };
    } catch (error) {
      logger.error('Erreur lors de la vérification de l\'état d\'authentification', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Mise à jour du profil utilisateur
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await ApiService.put<User>(
        `${AuthApiService.BASE_PATH}/profile`,
        userData
      );
      
      // Mettre à jour l'utilisateur stocké localement
      const currentUserJson = await AsyncStorage.getItem('current_user');
      if (currentUserJson) {
        const currentUser = JSON.parse(currentUserJson);
        const updatedUser = { ...currentUser, ...response };
        await AsyncStorage.setItem('current_user', JSON.stringify(updatedUser));
      }
      
      return response;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil', error);
      throw error;
    }
  }

  /**
   * Changement du mot de passe
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      await ApiService.put(
        `${AuthApiService.BASE_PATH}/change-password`,
        { currentPassword, newPassword }
      );
      return true;
    } catch (error) {
      logger.error('Erreur lors du changement de mot de passe', error);
      throw error;
    }
  }

  /**
   * Vérification de l'adresse e-mail
   */
  async verifyEmail(verificationToken: string): Promise<boolean> {
    try {
      await ApiService.post(
        `${AuthApiService.BASE_PATH}/verify-email`,
        { token: verificationToken },
        false
      );
      
      // Mettre à jour le statut de vérification de l'utilisateur
      const currentUserJson = await AsyncStorage.getItem('current_user');
      if (currentUserJson) {
        const currentUser = JSON.parse(currentUserJson);
        const updatedUser = { ...currentUser, emailVerified: true };
        await AsyncStorage.setItem('current_user', JSON.stringify(updatedUser));
      }
      
      return true;
    } catch (error) {
      logger.error('Erreur lors de la vérification de l\'e-mail', error);
      throw error;
    }
  }
}

export default new AuthApiService();