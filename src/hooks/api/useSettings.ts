import { useCallback } from 'react';
import { useApi } from './useApi';
import API from '../../services/API';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Type pour les paramètres utilisateur
 */
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    enabled: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    inAppNotifications: boolean;
    notificationTypes: {
      transactions: boolean;
      accountUpdates: boolean;
      promotions: boolean;
      analytics: boolean;
      system: boolean;
    };
  };
  display: {
    compactMode: boolean;
    animationsEnabled: boolean;
    fontSize: 'small' | 'medium' | 'large';
    dateFormat: string;
    timeFormat: '12h' | '24h';
    currency: string;
    numberFormat: {
      decimalSeparator: string;
      thousandsSeparator: string;
      decimalPlaces: number;
    };
  };
  security: {
    biometricEnabled: boolean;
    autoLockTimeout: number; // minutes
    twoFactorEnabled: boolean;
    deviceTrusted: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
    largeText: boolean;
  };
  sync: {
    autoSync: boolean;
    syncInterval: number; // minutes
    syncOnWifiOnly: boolean;
    lastSyncTimestamp?: number;
  };
}

/**
 * Type pour les paramètres de l'application
 */
export interface AppSettings {
  version: string;
  buildNumber: string;
  maintenanceMode: boolean;
  features: {
    [featureName: string]: boolean;
  };
  chatEnabled: boolean;
  analyticsEnabled: boolean;
  offlineMode: {
    enabled: boolean;
    maxStorageSize: number; // MB
  };
  apiConfig: {
    timeout: number;
    retryAttempts: number;
    cacheEnabled: boolean;
    cacheTTL: number; // seconds
  };
  termsAndConditionsUrl: string;
  privacyPolicyUrl: string;
  supportEmail: string;
  supportPhoneNumber: string;
}

/**
 * Type pour les préférences de notification
 */
export interface NotificationPreference {
  type: string;
  channel: 'email' | 'push' | 'sms' | 'in_app';
  enabled: boolean;
  frequency?: 'immediately' | 'daily' | 'weekly';
  quiet_hours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
}

/**
 * Type pour l'appareil enregistré
 */
export interface RegisteredDevice {
  id: string;
  name: string;
  model: string;
  os: string;
  osVersion: string;
  appVersion: string;
  lastActive: string;
  pushToken?: string;
  trusted: boolean;
  current: boolean;
}

/**
 * Hook pour gérer les fonctionnalités de paramètres
 */
export function useSettings() {
  /**
   * Hook pour récupérer les paramètres utilisateur
   */
  const useUserSettings = () => {
    return useApi<UserSettings>(
      () => API.settings.getUserSettings(),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: 'user-settings',
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour mettre à jour les paramètres utilisateur
   */
  const useUpdateUserSettings = () => {
    return useApi<UserSettings>(
      (settings: Partial<UserSettings>) => API.settings.updateUserSettings(settings),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les paramètres de l'application
   */
  const useAppSettings = () => {
    return useApi<AppSettings>(
      () => API.settings.getAppSettings(),
      {
        autoFetch: true,
        cache: {
          key: 'app-settings',
          ttl: 30 * 60 * 1000, // 30 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les préférences de notification
   */
  const useNotificationPreferences = () => {
    return useApi<NotificationPreference[]>(
      () => API.settings.getNotificationPreferences(),
      {
        autoFetch: true,
        cache: {
          key: 'notification-preferences',
          ttl: 15 * 60 * 1000, // 15 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour mettre à jour les préférences de notification
   */
  const useUpdateNotificationPreferences = () => {
    return useApi<NotificationPreference[]>(
      (preferences: Partial<NotificationPreference>[]) => 
        API.settings.updateNotificationPreferences(preferences),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les appareils enregistrés
   */
  const useRegisteredDevices = () => {
    return useApi<RegisteredDevice[]>(
      () => API.settings.getRegisteredDevices(),
      {
        autoFetch: true,
        cache: {
          key: 'registered-devices',
          ttl: 15 * 60 * 1000, // 15 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour supprimer un appareil enregistré
   */
  const useRemoveDevice = () => {
    return useApi<boolean>(
      (deviceId: string) => API.settings.removeDevice(deviceId),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour activer/désactiver l'authentification à deux facteurs
   */
  const useToggleTwoFactor = () => {
    return useApi<{
      enabled: boolean;
      setupRequired?: boolean;
      qrCodeUrl?: string;
      backupCodes?: string[];
    }>(
      (enable: boolean) => API.settings.toggleTwoFactor(enable),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour vérifier les mises à jour de l'application
   */
  const useCheckUpdates = () => {
    return useApi<{
      hasUpdate: boolean;
      version?: string;
      notes?: string;
      requiredUpdate: boolean;
      downloadUrl?: string;
    }>(
      () => API.settings.checkUpdates(),
      { 
        autoFetch: false,
        cache: {
          key: 'app-updates',
          ttl: 60 * 60 * 1000, // 1 heure
          loadFromCacheFirst: false // Toujours vérifier les nouvelles mises à jour
        }
      }
    );
  };

  /**
   * Fonction pour sauvegarder le thème localement
   */
  const saveThemeLocally = useCallback(async (theme: 'light' | 'dark' | 'system'): Promise<void> => {
    try {
      await AsyncStorage.setItem('theme_preference', theme);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  }, []);

  /**
   * Fonction pour récupérer le thème sauvegardé localement
   */
  const getLocalTheme = useCallback(async (): Promise<'light' | 'dark' | 'system' | null> => {
    try {
      return await AsyncStorage.getItem('theme_preference') as 'light' | 'dark' | 'system' | null;
    } catch (error) {
      console.error('Erreur lors de la récupération du thème:', error);
      return null;
    }
  }, []);

  /**
   * Fonction pour sauvegarder la langue localement
   */
  const saveLanguageLocally = useCallback(async (language: string): Promise<void> => {
    try {
      await AsyncStorage.setItem('language_preference', language);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la langue:', error);
    }
  }, []);

  /**
   * Fonction pour récupérer la langue sauvegardée localement
   */
  const getLocalLanguage = useCallback(async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('language_preference');
    } catch (error) {
      console.error('Erreur lors de la récupération de la langue:', error);
      return null;
    }
  }, []);

  /**
   * Fonction pour effectuer une synchronisation des paramètres
   */
  const syncSettings = useCallback(async (): Promise<boolean> => {
    try {
      // Récupérer les paramètres locaux
      const localTheme = await getLocalTheme();
      const localLanguage = await getLocalLanguage();
      
      // Synchroniser avec le serveur
      if (localTheme || localLanguage) {
        const updates: Partial<UserSettings> = {};
        if (localTheme) updates.theme = localTheme;
        if (localLanguage) updates.language = localLanguage;
        
        await API.settings.updateUserSettings(updates);
      }
      
      // Marquer comme synchronisé
      await AsyncStorage.setItem('settings_last_sync', Date.now().toString());
      return true;
    } catch (error) {
      console.error('Erreur lors de la synchronisation des paramètres:', error);
      return false;
    }
  }, [getLocalTheme, getLocalLanguage]);

  /**
   * Fonction pour réinitialiser tous les paramètres
   */
  const resetAllSettings = useCallback(async (): Promise<boolean> => {
    try {
      // Réinitialiser sur le serveur
      await API.settings.resetAllSettings();
      
      // Réinitialiser localement
      const keysToRemove = [
        'theme_preference',
        'language_preference',
        'settings_last_sync'
      ];
      await AsyncStorage.multiRemove(keysToRemove);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des paramètres:', error);
      return false;
    }
  }, []);

  return {
    useUserSettings,
    useUpdateUserSettings,
    useAppSettings,
    useNotificationPreferences,
    useUpdateNotificationPreferences,
    useRegisteredDevices,
    useRemoveDevice,
    useToggleTwoFactor,
    useCheckUpdates,
    saveThemeLocally,
    getLocalTheme,
    saveLanguageLocally,
    getLocalLanguage,
    syncSettings,
    resetAllSettings
  };
}