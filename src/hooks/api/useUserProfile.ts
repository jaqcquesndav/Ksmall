import { useState, useCallback, useEffect } from 'react';
import UserApiService from '../../services/api/user/UserApiService';
import { 
  UserProfile,
  Company, 
  TeamMember 
} from '../../types/user';
import logger from '../../utils/logger';

/**
 * Hook pour gérer le profil utilisateur
 */
export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await UserApiService.getCurrentUserProfile();
      setUserProfile(profile);
      return profile;
    } catch (err) {
      logger.error('Erreur lors du chargement du profil utilisateur', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProfile = await UserApiService.updateUserProfile(profileData);
      setUserProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      logger.error('Erreur lors de la mise à jour du profil', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadProfilePhoto = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await UserApiService.uploadProfilePhoto(formData);
      setUserProfile(prev => prev ? { ...prev, avatar: result.avatarUrl } : null);
      return result;
    } catch (err) {
      logger.error('Erreur lors du téléchargement de la photo de profil', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProfilePhoto = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await UserApiService.deleteProfilePhoto();
      if (result) {
        setUserProfile(prev => prev ? { ...prev, avatar: undefined } : null);
      }
      return result;
    } catch (err) {
      logger.error('Erreur lors de la suppression de la photo de profil', err);
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserPreferences = useCallback(async (preferences: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedPreferences = await UserApiService.updateUserPreferences(preferences);
      setUserProfile(prev => prev ? { ...prev, preferences: updatedPreferences } : null);
      return updatedPreferences;
    } catch (err) {
      logger.error('Erreur lors de la mise à jour des préférences', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Effet pour charger le profil au montage du composant
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return {
    userProfile,
    loading,
    error,
    fetchUserProfile,
    updateProfile,
    uploadProfilePhoto,
    deleteProfilePhoto,
    updateUserPreferences
  };
};

/**
 * Hook pour gérer le profil de l'entreprise
 */
export const useCompanyProfile = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const companyData = await UserApiService.getCurrentCompany();
      setCompany(companyData);
      return companyData;
    } catch (err) {
      logger.error('Erreur lors du chargement des informations de l\'entreprise', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCompany = useCallback(async (companyData: Partial<Company>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedCompany = await UserApiService.updateCompany(companyData);
      setCompany(updatedCompany);
      return updatedCompany;
    } catch (err) {
      logger.error('Erreur lors de la mise à jour des informations de l\'entreprise', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadCompanyLogo = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await UserApiService.uploadCompanyLogo(formData);
      setCompany(prev => prev ? { ...prev, logo: result.logoUrl } : null);
      return result;
    } catch (err) {
      logger.error('Erreur lors du téléchargement du logo de l\'entreprise', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Effet pour charger les informations de l'entreprise au montage du composant
  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return {
    company,
    loading,
    error,
    fetchCompany,
    updateCompany,
    uploadCompanyLogo
  };
};

/**
 * Hook pour gérer l'équipe
 */
export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Array<{ id: string; name: string; description: string; permissions: string[] }>>([]);

  const fetchTeamMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const members = await UserApiService.getTeamMembers();
      setTeamMembers(members);
      return members;
    } catch (err) {
      logger.error('Erreur lors du chargement des membres de l\'équipe', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const roles = await UserApiService.getAvailableRoles();
      setAvailableRoles(roles);
      return roles;
    } catch (err) {
      logger.error('Erreur lors du chargement des rôles disponibles', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const inviteMember = useCallback(async (email: string, role: string, permissions?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const newMember = await UserApiService.inviteTeamMember(email, role, permissions);
      setTeamMembers(prev => [...prev, newMember]);
      return newMember;
    } catch (err) {
      logger.error('Erreur lors de l\'invitation d\'un nouveau membre', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMember = useCallback(async (userId: string, role: string, permissions?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const updatedMember = await UserApiService.updateTeamMember(userId, role, permissions);
      setTeamMembers(prev => 
        prev.map(member => 
          member.userId === userId ? updatedMember : member
        )
      );
      return updatedMember;
    } catch (err) {
      logger.error('Erreur lors de la mise à jour d\'un membre', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeMember = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await UserApiService.removeTeamMember(userId);
      if (result) {
        setTeamMembers(prev => prev.filter(member => member.userId !== userId));
      }
      return result;
    } catch (err) {
      logger.error('Erreur lors de la suppression d\'un membre', err);
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleMemberStatus = useCallback(async (userId: string, active: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const updatedMember = await UserApiService.toggleTeamMemberStatus(userId, active);
      setTeamMembers(prev => 
        prev.map(member => 
          member.userId === userId ? updatedMember : member
        )
      );
      return updatedMember;
    } catch (err) {
      logger.error('Erreur lors de la modification du statut d\'un membre', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les membres et les rôles au montage du composant
  useEffect(() => {
    fetchTeamMembers();
    fetchAvailableRoles();
  }, [fetchTeamMembers, fetchAvailableRoles]);

  return {
    teamMembers,
    availableRoles,
    loading,
    error,
    fetchTeamMembers,
    fetchAvailableRoles,
    inviteMember,
    updateMember,
    removeMember,
    toggleMemberStatus
  };
};

/**
 * Hook pour gérer les notifications utilisateur
 */
export const useUserNotifications = (limit = 20, unreadOnly = false) => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    timestamp: string;
    data?: any;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (reset = false) => {
    const newOffset = reset ? 0 : offset;
    
    setLoading(true);
    setError(null);
    try {
      const result = await UserApiService.getUserNotifications(limit, newOffset, unreadOnly);
      
      if (reset) {
        setNotifications(result);
      } else {
        setNotifications(prev => [...prev, ...result]);
      }
      
      setOffset(newOffset + result.length);
      setHasMore(result.length === limit);
      
      return result;
    } catch (err) {
      logger.error('Erreur lors du chargement des notifications', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [limit, offset, unreadOnly]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const result = await UserApiService.markNotificationAsRead(notificationId);
      if (result) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId ? { ...notification, read: true } : notification
          )
        );
      }
      return result;
    } catch (err) {
      logger.error('Erreur lors du marquage d\'une notification comme lue', err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const result = await UserApiService.markAllNotificationsAsRead();
      if (result) {
        setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      }
      return result;
    } catch (err) {
      logger.error('Erreur lors du marquage de toutes les notifications comme lues', err);
      return false;
    }
  }, []);

  // Charger les notifications au montage du composant
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const refresh = useCallback(() => {
    setOffset(0);
    return fetchNotifications(true);
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    hasMore,
    fetchMore: fetchNotifications,
    refresh,
    markAsRead,
    markAllAsRead
  };
};

/**
 * Hook pour accéder à l'activité de l'utilisateur
 */
export const useUserActivity = (limit = 20) => {
  const [activities, setActivities] = useState<Array<{ 
    id: string; 
    type: string; 
    description: string; 
    timestamp: string; 
    metadata?: any 
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async (reset = false) => {
    const newOffset = reset ? 0 : offset;
    
    setLoading(true);
    setError(null);
    try {
      const result = await UserApiService.getUserActivity(limit, newOffset);
      
      if (reset) {
        setActivities(result);
      } else {
        setActivities(prev => [...prev, ...result]);
      }
      
      setOffset(newOffset + result.length);
      setHasMore(result.length === limit);
      
      return result;
    } catch (err) {
      logger.error('Erreur lors du chargement des activités', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  // Charger les activités au montage du composant
  useEffect(() => {
    fetchActivities(true);
  }, [fetchActivities]);

  const refresh = useCallback(() => {
    setOffset(0);
    return fetchActivities(true);
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    hasMore,
    fetchMore: fetchActivities,
    refresh
  };
};

// Exporter tous les hooks
export default {
  useUserProfile,
  useCompanyProfile,
  useTeamMembers,
  useUserNotifications,
  useUserActivity
};