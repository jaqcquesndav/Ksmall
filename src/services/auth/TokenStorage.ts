import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Clés pour le stockage de tokens et autres données
export const KEYS = {
  ACCESS_TOKEN: 'auth0_access_token',
  REFRESH_TOKEN: 'auth0_refresh_token',
  ID_TOKEN: 'auth0_id_token',
  USER_INFO: 'auth0_user_info',
  TOKEN_EXPIRY: 'auth0_token_expiry',
  OFFLINE_MODE: 'offline_mode',
};

/**
 * Détermine si SecureStore est disponible sur l'appareil
 * Sur certains appareils/émulateurs, SecureStore peut ne pas être disponible
 */
const isSecureStoreAvailable = async (): Promise<boolean> => {
  try {
    await SecureStore.getItemAsync('test');
    return true;
  } catch {
    return false;
  }
};

/**
 * Fonction d'enregistrement générique qui utilise SecureStore si disponible,
 * sinon AsyncStorage
 */
const saveItem = async (key: string, value: string): Promise<void> => {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (error) {
    console.error(`Failed to save item ${key}:`, error);
    throw error;
  }
};

/**
 * Fonction de récupération générique qui utilise SecureStore si disponible,
 * sinon AsyncStorage
 */
const getItem = async (key: string): Promise<string | null> => {
  try {
    if (await isSecureStoreAvailable()) {
      return await SecureStore.getItemAsync(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  } catch (error) {
    console.error(`Failed to get item ${key}:`, error);
    return null;
  }
};

/**
 * Fonction de suppression générique pour un élément
 */
const removeItem = async (key: string): Promise<void> => {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`Failed to remove item ${key}:`, error);
    throw error;
  }
};

/**
 * Sauvegarder le token d'accès
 */
export const saveAccessToken = async (token: string): Promise<void> => {
  await saveItem(KEYS.ACCESS_TOKEN, token);
};

/**
 * Récupérer le token d'accès
 */
export const getAccessToken = async (): Promise<string | null> => {
  return await getItem(KEYS.ACCESS_TOKEN);
};

/**
 * Sauvegarder le refresh token
 */
export const saveRefreshToken = async (token: string): Promise<void> => {
  await saveItem(KEYS.REFRESH_TOKEN, token);
};

/**
 * Récupérer le refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  return await getItem(KEYS.REFRESH_TOKEN);
};

/**
 * Sauvegarder le token ID
 */
export const saveIdToken = async (token: string): Promise<void> => {
  await saveItem(KEYS.ID_TOKEN, token);
};

/**
 * Récupérer le token ID
 */
export const getIdToken = async (): Promise<string | null> => {
  return await getItem(KEYS.ID_TOKEN);
};

/**
 * Sauvegarder les informations utilisateur
 */
export const saveUserInfo = async (userInfo: any): Promise<void> => {
  await saveItem(KEYS.USER_INFO, JSON.stringify(userInfo));
};

/**
 * Récupérer les informations utilisateur
 */
export const getUserInfo = async (): Promise<any | null> => {
  try {
    const userInfo = await getItem(KEYS.USER_INFO);
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};

/**
 * Sauvegarder le moment d'expiration du token
 */
export const saveTokenExpiry = async (expiryTime: number): Promise<void> => {
  await saveItem(KEYS.TOKEN_EXPIRY, expiryTime.toString());
};

/**
 * Récupérer le moment d'expiration du token
 */
export const getTokenExpiry = async (): Promise<number | null> => {
  try {
    const expiryString = await getItem(KEYS.TOKEN_EXPIRY);
    return expiryString ? parseInt(expiryString, 10) : null;
  } catch (error) {
    console.error('Failed to get token expiry:', error);
    return null;
  }
};

/**
 * Définir le mode hors ligne
 */
export const setOfflineMode = async (enabled: boolean): Promise<void> => {
  await saveItem(KEYS.OFFLINE_MODE, enabled ? 'true' : 'false');
};

/**
 * Vérifier si le mode hors ligne est activé
 */
export const isOfflineMode = async (): Promise<boolean> => {
  try {
    const value = await getItem(KEYS.OFFLINE_MODE);
    return value === 'true';
  } catch (error) {
    console.error('Failed to get offline mode status:', error);
    return false;
  }
};

/**
 * Vérifier si des tokens valides sont disponibles (utilisateur connecté)
 */
export const hasValidTokens = async (): Promise<boolean> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return false;
    
    const expiryTime = await getTokenExpiry();
    if (!expiryTime) return false;
    
    // Vérifier si le token est expiré (avec 60 secondes de marge)
    const currentTime = Date.now();
    return currentTime < expiryTime - 60000;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

/**
 * Effacer tous les tokens et données d'authentification
 */
export const clearTokens = async (): Promise<void> => {
  try {
    const promises = Object.values(KEYS).map(key => removeItem(key));
    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
    throw error;
  }
};