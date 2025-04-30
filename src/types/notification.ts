/**
 * Types relatifs aux notifications
 */

/**
 * Types de notification
 */
export enum NOTIFICATION_TYPES {
  TRANSACTION = 'transaction',
  SYSTEM = 'system',
  ALERT = 'alert',
  MESSAGE = 'message',
  REMINDER = 'reminder',
  INVENTORY = 'inventory',
  ACCOUNTING = 'accounting',
  PROMOTION = 'promotion',
  UPDATE = 'update'
}

/**
 * Interface de base pour une notification
 */
export interface BaseNotification {
  id: string;
  type: NOTIFICATION_TYPES | string;
  read: boolean;
  createdAt: string;
}

/**
 * Interface notification complète (service, stockage)
 */
export interface Notification extends BaseNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Interface notification pour l'interface utilisateur
 */
export interface UINotification extends BaseNotification {
  title: string;
  message: string;
  timestamp: Date | string;
  data?: Record<string, any>;
}

/**
 * Interface pour les préférences de notification
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
 * Interface pour les options d'affichage des notifications à l'utilisateur
 */
export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
  position?: 'top' | 'bottom';
  onPress?: () => void;
  onClose?: () => void;
}

/**
 * Interface pour les paramètres de notification
 */
export interface NotificationSettings {
  email: {
    enabled: boolean;
    lowStock: boolean;
    accountingAlerts: boolean;
    financialReports: boolean;
    security: boolean;
    frequency: 'realtime' | 'daily' | 'weekly';
  };
  push: {
    enabled: boolean;
    lowStock: boolean;
    accountingAlerts: boolean;
    tasks: boolean;
    security: boolean;
  };
  inApp: {
    enabled: boolean;
    showBadges: boolean;
    soundEnabled: boolean;
  };
}

/**
 * Interface pour le filtre des notifications
 */
export interface NotificationFilters {
  read?: boolean;
  type?: NOTIFICATION_TYPES | string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Interface pour les appareils enregistrés pour les notifications push
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
 * Type pour les écouteurs de notification
 */
export type NotificationListener = () => void;