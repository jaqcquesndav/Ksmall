// API Configuration
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../../../utils/logger';
import { API_URL as API_BASE_URL, APP_ENV } from '@env';

// API configuration
export const API_CONFIG = {
  // Base URL pour l'API backend
  BASE_URL: API_BASE_URL || 'https://api.ksmall.example.com/v1',
  
  // Timeout par défaut pour les requêtes (en ms)
  TIMEOUT: 30000,
  
  // Intervalle de synchronisation (en ms)
  SYNC_INTERVAL: 300000, // 5 minutes
  
  // Nombre maximal de tentatives de synchronisation
  MAX_SYNC_RETRIES: 3,
};

// Constantes pour les clés de stockage
export const STORAGE_KEYS = {
  OFFLINE_QUEUE: 'offline_queue',
  LAST_SYNC_TIME: 'last_sync_time',
  CONNECTION_STATUS: 'connection_status',
  API_VERSION: 'api_version',
};

// Vérifier si l'appareil est en ligne
export const isOnline = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return !!netInfo.isConnected;
};

// Vérifier si l'utilisateur est connecté et a un token valide
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  } catch (error) {
    logger.error('Erreur lors de la vérification de l\'authentification', error);
    return false;
  }
};

// Vérifier si l'application peut se connecter au backend
export const canConnectToBackend = async (): Promise<boolean> => {
  const online = await isOnline();
  const authenticated = await isAuthenticated();
  return online && authenticated;
};

// Classe pour gérer les erreurs API
export class ApiError extends Error {
  status: number;
  data?: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Énumération des types d'actions pour la file d'attente hors ligne
export enum OfflineActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  UPLOAD = 'UPLOAD',
}

// Interface pour une action hors ligne
export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  endpoint: string;
  data?: any;
  createdAt: string;
  retries: number;
  priority: number;
  entity: string;
}

// Vérifier les mises à jour de l'API
export const checkApiUpdates = async (): Promise<{ hasUpdate: boolean, version?: string }> => {
  try {
    const currentVersion = await AsyncStorage.getItem(STORAGE_KEYS.API_VERSION) || '1.0.0';
    // Ici, vous pourriez faire un appel API pour vérifier la version actuelle
    // Pour l'exemple, nous supposons qu'il n'y a pas de mise à jour
    return { hasUpdate: false, version: currentVersion };
  } catch (error) {
    logger.error('Erreur lors de la vérification des mises à jour de l\'API', error);
    return { hasUpdate: false };
  }
};