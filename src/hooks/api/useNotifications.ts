import { useCallback } from 'react';
import { useApi } from './useApi';
import API from '../../services/API';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Type représentant une notification
 */
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'transaction' | 'system' | 'account' | 'promotion' | 'reminder' | 'alert';
  read: boolean;
  date: string;
  data?: Record<string, any>;
  actionUrl?: string;
  actionText?: string;
  image?: string;
}

/**
 * Options pour les requêtes de notifications
 */
interface NotificationsQueryOptions {
  limit?: number;
  offset?: number;
  read?: boolean;
  type?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Hook pour gérer les fonctionnalités de notification
 */
export function useNotifications() {
  /**
   * Hook pour récupérer toutes les notifications
   */
  const useAllNotifications = (options: NotificationsQueryOptions = {}) => {
    return useApi<Notification[]>(
      () => API.notifications.getNotifications(options),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: `notifications-${JSON.stringify(options)}`,
          ttl: 5 * 60 * 1000, // 5 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les notifications non lues
   */
  const useUnreadNotifications = () => {
    return useApi<Notification[]>(
      () => API.notifications.getNotifications({ read: false }),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: 'unread-notifications',
          ttl: 2 * 60 * 1000, // 2 minutes
          loadFromCacheFirst: false // Toujours récupérer les dernières
        }
      }
    );
  };

  /**
   * Hook pour récupérer le nombre de notifications non lues
   */
  const useUnreadCount = () => {
    return useApi<{ count: number }>(
      () => API.notifications.getUnreadCount(),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: 'unread-notifications-count',
          ttl: 1 * 60 * 1000, // 1 minute
          loadFromCacheFirst: false
        }
      }
    );
  };

  /**
   * Hook pour marquer une notification comme lue
   */
  const useMarkAsRead = () => {
    return useApi<boolean>(
      (notificationId: string) => API.notifications.markAsRead(notificationId),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour marquer toutes les notifications comme lues
   */
  const useMarkAllAsRead = () => {
    return useApi<boolean>(
      () => API.notifications.markAllAsRead(),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour supprimer une notification
   */
  const useDeleteNotification = () => {
    return useApi<boolean>(
      (notificationId: string) => API.notifications.deleteNotification(notificationId),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour supprimer toutes les notifications
   */
  const useClearAll = () => {
    return useApi<boolean>(
      () => API.notifications.clearAll(),
      { autoFetch: false }
    );
  };

  /**
   * Fonction pour s'inscrire aux notifications push
   */
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Permission non accordée pour les notifications push');
        return null;
      }
      
      // Obtenir le token de notification
      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        experienceId: '@ksmall/mobile-app'
      });
      
      // Configurer les notifications pour Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      
      // Enregistrer le token sur le serveur
      await API.notifications.registerDevice(expoPushToken.data, {
        platform: Platform.OS,
        deviceName: `${Platform.OS} Device`
      });
      
      return expoPushToken.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement pour les notifications push:', error);
      return null;
    }
  }, []);

  /**
   * Fonction pour se désinscrire des notifications push
   */
  const unregisterPushNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        experienceId: '@ksmall/mobile-app'
      });
      
      await API.notifications.unregisterDevice(expoPushToken.data);
      return true;
    } catch (error) {
      console.error('Erreur lors de la désinscription des notifications push:', error);
      return false;
    }
  }, []);

  /**
   * Fonction pour planifier une notification locale
   */
  const scheduleLocalNotification = useCallback(async (
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput = null,
    data: Record<string, any> = {}
  ): Promise<string> => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data
        },
        trigger
      });
      
      return notificationId;
    } catch (error) {
      console.error('Erreur lors de la planification d\'une notification locale:', error);
      throw error;
    }
  }, []);

  /**
   * Fonction pour annuler une notification locale planifiée
   */
  const cancelLocalNotification = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la notification:', error);
      throw error;
    }
  }, []);

  return {
    useAllNotifications,
    useUnreadNotifications,
    useUnreadCount,
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification,
    useClearAll,
    registerForPushNotifications,
    unregisterPushNotifications,
    scheduleLocalNotification,
    cancelLocalNotification
  };
}