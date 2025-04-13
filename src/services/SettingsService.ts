import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Settings Service for managing user settings
 */
class SettingsService {
  static KEYS = {
    THEME: '@settings/theme',
    LANGUAGE: '@settings/language',
    NOTIFICATIONS: '@settings/notifications',
    BIOMETRIC: '@settings/biometric',
    USER_PROFILE_IMAGE: '@settings/user_profile_image',
  };
  
  /**
   * Save theme preference
   * @param value - 'light', 'dark', or 'system'
   */
  static async saveThemePreference(value: 'light' | 'dark' | 'system'): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.THEME, value);
    } catch (e) {
      console.error('Failed to save theme preference', e);
      throw e;
    }
  }
  
  /**
   * Get theme preference
   * @returns Theme preference ('light', 'dark', or 'system')
   */
  static async getThemePreference(): Promise<'light' | 'dark' | 'system'> {
    try {
      const value = await AsyncStorage.getItem(this.KEYS.THEME);
      return (value as 'light' | 'dark' | 'system') || 'system';
    } catch (e) {
      console.error('Failed to get theme preference', e);
      return 'system';
    }
  }
  
  /**
   * Save notification preference
   * @param enabled - Whether notifications are enabled
   */
  static async saveNotificationsPreference(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.NOTIFICATIONS, String(enabled));
    } catch (e) {
      console.error('Failed to save notification preference', e);
      throw e;
    }
  }
  
  /**
   * Get notification preference
   * @returns Whether notifications are enabled
   */
  static async getNotificationsPreference(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.KEYS.NOTIFICATIONS);
      return value === null ? true : value === 'true';
    } catch (e) {
      console.error('Failed to get notification preference', e);
      return true;
    }
  }
  
  /**
   * Save biometric authentication preference
   * @param enabled - Whether biometric authentication is enabled
   */
  static async saveBiometricPreference(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.BIOMETRIC, String(enabled));
    } catch (e) {
      console.error('Failed to save biometric preference', e);
      throw e;
    }
  }
  
  /**
   * Get biometric authentication preference
   * @returns Whether biometric authentication is enabled
   */
  static async getBiometricPreference(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.KEYS.BIOMETRIC);
      return value === 'true';
    } catch (e) {
      console.error('Failed to get biometric preference', e);
      return false;
    }
  }
  
  /**
   * Save profile image URI
   * @param uri - Image URI
   */
  static async saveProfileImageUri(uri: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.USER_PROFILE_IMAGE, uri);
    } catch (e) {
      console.error('Failed to save profile image URI', e);
      throw e;
    }
  }
  
  /**
   * Get profile image URI
   * @returns Profile image URI
   */
  static async getProfileImageUri(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.KEYS.USER_PROFILE_IMAGE);
    } catch (e) {
      console.error('Failed to get profile image URI', e);
      return null;
    }
  }
  
  /**
   * Clear all stored settings
   */
  static async clearAllSettings(): Promise<void> {
    try {
      const keys = Object.values(this.KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (e) {
      console.error('Failed to clear settings', e);
      throw e;
    }
  }
}

export default SettingsService;
