import * as SecureStore from 'expo-secure-store';

// Key names for various tokens and data
const KEYS = {
  ACCESS_TOKEN: 'auth0_access_token',
  REFRESH_TOKEN: 'auth0_refresh_token',
  ID_TOKEN: 'auth0_id_token',
  USER_INFO: 'auth0_user_info',
  TOKEN_EXPIRY: 'auth0_token_expiry',
  OFFLINE_MODE: 'offline_mode',
};

/**
 * Save access token securely
 */
export const saveAccessToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
  } catch (error) {
    console.error('Failed to save access token:', error);
    throw error;
  }
};

/**
 * Get access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};

/**
 * Save refresh token securely
 */
export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
  } catch (error) {
    console.error('Failed to save refresh token:', error);
    throw error;
  }
};

/**
 * Get refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

/**
 * Save ID token securely
 */
export const saveIdToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.ID_TOKEN, token);
  } catch (error) {
    console.error('Failed to save ID token:', error);
    throw error;
  }
};

/**
 * Get ID token
 */
export const getIdToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(KEYS.ID_TOKEN);
  } catch (error) {
    console.error('Failed to get ID token:', error);
    return null;
  }
};

/**
 * Save token expiry time
 */
export const saveTokenExpiry = async (expiresAt: number): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.TOKEN_EXPIRY, expiresAt.toString());
  } catch (error) {
    console.error('Failed to save token expiry:', error);
    throw error;
  }
};

/**
 * Get token expiry time
 */
export const getTokenExpiry = async (): Promise<number | null> => {
  try {
    const expiry = await SecureStore.getItemAsync(KEYS.TOKEN_EXPIRY);
    return expiry ? parseInt(expiry, 10) : null;
  } catch (error) {
    console.error('Failed to get token expiry:', error);
    return null;
  }
};

/**
 * Save user info
 */
export const saveUserInfo = async (userInfo: any): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.USER_INFO, JSON.stringify(userInfo));
  } catch (error) {
    console.error('Failed to save user info:', error);
    throw error;
  }
};

/**
 * Get user info
 */
export const getUserInfo = async (): Promise<any | null> => {
  try {
    const userInfo = await SecureStore.getItemAsync(KEYS.USER_INFO);
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};

/**
 * Set offline mode
 */
export const setOfflineMode = async (enabled: boolean): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.OFFLINE_MODE, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Failed to set offline mode:', error);
    throw error;
  }
};

/**
 * Check if offline mode is enabled
 */
export const isOfflineMode = async (): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(KEYS.OFFLINE_MODE);
    return value === 'true';
  } catch (error) {
    console.error('Failed to get offline mode status:', error);
    return false;
  }
};

/**
 * Check if tokens are available (user is logged in)
 */
export const hasValidTokens = async (): Promise<boolean> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return false;
    
    const expiryTime = await getTokenExpiry();
    if (!expiryTime) return false;
    
    // Check if token is expired (with 60 seconds buffer)
    const currentTime = Date.now();
    return currentTime < expiryTime - 60000;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

/**
 * Clear all auth tokens and data
 */
export const clearTokens = async (): Promise<void> => {
  try {
    const keys = [
      KEYS.ACCESS_TOKEN, 
      KEYS.REFRESH_TOKEN, 
      KEYS.ID_TOKEN,
      KEYS.USER_INFO,
      KEYS.TOKEN_EXPIRY
    ];
    
    await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
  } catch (error) {
    console.error('Failed to clear tokens:', error);
    throw error;
  }
};