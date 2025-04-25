import ApiService from '../ApiService';
import { User } from '../../../types/auth';
import logger from '../../../utils/logger';

/**
 * Interface pour un utilisateur étendu avec les informations de profil
 */
export interface UserProfile extends User {
  position?: string;
  department?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  timezone?: string;
  language?: string;
  avatar?: string;
  preferences?: Record<string, any>;
  role?: string;
  permissions?: string[];
}

/**
 * Interface pour une entreprise
 */
export interface Company {
  id: string;
  name: string;
  legalName?: string;
  taxId?: string;
  registrationNumber?: string;
  industry?: string;
  size?: string;
  foundedYear?: number;
  website?: string;
  logo?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface pour un membre de l'équipe
 */
export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  permissions: string[];
  status: 'active' | 'invited' | 'inactive';
  invitedAt?: string;
  joinedAt?: string;
  lastActiveAt?: string;
}

/**
 * Service API pour la gestion des utilisateurs et des entreprises
 */
class UserApiService {
  private static readonly BASE_PATH = '/users';
  private static readonly COMPANY_PATH = '/companies';

  /**
   * Récupère le profil de l'utilisateur courant
   */
  async getCurrentUserProfile(): Promise<UserProfile> {
    try {
      return await ApiService.get<UserProfile>(`${UserApiService.BASE_PATH}/me`);
    } catch (error) {
      logger.error('Erreur lors de la récupération du profil utilisateur', error);
      throw error;
    }
  }

  /**
   * Met à jour le profil de l'utilisateur courant
   */
  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      return await ApiService.put<UserProfile>(`${UserApiService.BASE_PATH}/me`, profile);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil utilisateur', error);
      throw error;
    }
  }

  /**
   * Télécharge une photo de profil
   */
  async uploadProfilePhoto(formData: FormData): Promise<{ avatarUrl: string }> {
    try {
      return await ApiService.uploadFile<{ avatarUrl: string }>(
        `${UserApiService.BASE_PATH}/me/photo`,
        formData
      );
    } catch (error) {
      logger.error('Erreur lors du téléchargement de la photo de profil', error);
      throw error;
    }
  }

  /**
   * Supprime la photo de profil
   */
  async deleteProfilePhoto(): Promise<boolean> {
    try {
      await ApiService.delete(`${UserApiService.BASE_PATH}/me/photo`);
      return true;
    } catch (error) {
      logger.error('Erreur lors de la suppression de la photo de profil', error);
      throw error;
    }
  }

  /**
   * Met à jour les préférences de l'utilisateur
   */
  async updateUserPreferences(preferences: Record<string, any>): Promise<Record<string, any>> {
    try {
      return await ApiService.put<Record<string, any>>(
        `${UserApiService.BASE_PATH}/me/preferences`,
        preferences
      );
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des préférences utilisateur', error);
      throw error;
    }
  }

  /**
   * Récupère les informations de l'entreprise actuelle
   */
  async getCurrentCompany(): Promise<Company> {
    try {
      return await ApiService.get<Company>(`${UserApiService.COMPANY_PATH}/current`);
    } catch (error) {
      logger.error('Erreur lors de la récupération des informations de l\'entreprise', error);
      throw error;
    }
  }

  /**
   * Met à jour les informations de l'entreprise
   */
  async updateCompany(company: Partial<Company>): Promise<Company> {
    try {
      return await ApiService.put<Company>(`${UserApiService.COMPANY_PATH}/current`, company);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des informations de l\'entreprise', error);
      throw error;
    }
  }

  /**
   * Télécharge le logo de l'entreprise
   */
  async uploadCompanyLogo(formData: FormData): Promise<{ logoUrl: string }> {
    try {
      return await ApiService.uploadFile<{ logoUrl: string }>(
        `${UserApiService.COMPANY_PATH}/current/logo`,
        formData
      );
    } catch (error) {
      logger.error('Erreur lors du téléchargement du logo de l\'entreprise', error);
      throw error;
    }
  }

  /**
   * Récupère tous les membres de l'équipe
   */
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      return await ApiService.get<TeamMember[]>(`${UserApiService.BASE_PATH}/team`);
    } catch (error) {
      logger.error('Erreur lors de la récupération des membres de l\'équipe', error);
      throw error;
    }
  }

  /**
   * Invite un nouveau membre dans l'équipe
   */
  async inviteTeamMember(email: string, role: string, permissions?: string[]): Promise<TeamMember> {
    try {
      return await ApiService.post<TeamMember>(`${UserApiService.BASE_PATH}/team/invite`, {
        email,
        role,
        permissions
      });
    } catch (error) {
      logger.error('Erreur lors de l\'invitation d\'un membre d\'équipe', error);
      throw error;
    }
  }

  /**
   * Met à jour le rôle et les permissions d'un membre de l'équipe
   */
  async updateTeamMember(userId: string, role: string, permissions?: string[]): Promise<TeamMember> {
    try {
      return await ApiService.put<TeamMember>(`${UserApiService.BASE_PATH}/team/${userId}`, {
        role,
        permissions
      });
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du membre d'équipe ${userId}`, error);
      throw error;
    }
  }

  /**
   * Supprime un membre de l'équipe
   */
  async removeTeamMember(userId: string): Promise<boolean> {
    try {
      await ApiService.delete(`${UserApiService.BASE_PATH}/team/${userId}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du membre d'équipe ${userId}`, error);
      throw error;
    }
  }

  /**
   * Désactive/réactive un membre de l'équipe
   */
  async toggleTeamMemberStatus(userId: string, active: boolean): Promise<TeamMember> {
    try {
      return await ApiService.put<TeamMember>(`${UserApiService.BASE_PATH}/team/${userId}/status`, {
        active
      });
    } catch (error) {
      logger.error(`Erreur lors de la modification du statut du membre d'équipe ${userId}`, error);
      throw error;
    }
  }

  /**
   * Récupère les rôles disponibles dans le système
   */
  async getAvailableRoles(): Promise<Array<{ id: string; name: string; description: string; permissions: string[] }>> {
    try {
      return await ApiService.get<Array<{ id: string; name: string; description: string; permissions: string[] }>>(
        `${UserApiService.BASE_PATH}/roles`
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des rôles disponibles', error);
      throw error;
    }
  }

  /**
   * Récupère l'activité récente de l'utilisateur
   */
  async getUserActivity(
    limit: number = 20, 
    offset: number = 0
  ): Promise<Array<{ id: string; type: string; description: string; timestamp: string; metadata?: any }>> {
    try {
      return await ApiService.get<Array<{ id: string; type: string; description: string; timestamp: string; metadata?: any }>>(
        `${UserApiService.BASE_PATH}/me/activity`,
        { limit, offset }
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'activité utilisateur', error);
      throw error;
    }
  }

  /**
   * Récupère les notifications de l'utilisateur
   */
  async getUserNotifications(
    limit: number = 20, 
    offset: number = 0, 
    unreadOnly: boolean = false
  ): Promise<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    timestamp: string;
    data?: any;
  }>> {
    try {
      return await ApiService.get<any[]>(
        `${UserApiService.BASE_PATH}/me/notifications`,
        { limit, offset, unreadOnly }
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des notifications utilisateur', error);
      throw error;
    }
  }

  /**
   * Marque une notification comme lue
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      await ApiService.put(`${UserApiService.BASE_PATH}/me/notifications/${notificationId}/read`, {});
      return true;
    } catch (error) {
      logger.error(`Erreur lors du marquage de la notification ${notificationId} comme lue`, error);
      throw error;
    }
  }

  /**
   * Marque toutes les notifications comme lues
   */
  async markAllNotificationsAsRead(): Promise<boolean> {
    try {
      await ApiService.put(`${UserApiService.BASE_PATH}/me/notifications/read-all`, {});
      return true;
    } catch (error) {
      logger.error('Erreur lors du marquage de toutes les notifications comme lues', error);
      throw error;
    }
  }
}

export default new UserApiService();