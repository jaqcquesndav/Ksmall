import * as Font from 'expo-font';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import DatabaseService from '../services/DatabaseService';

/**
 * Load any resources or data that we need prior to rendering the app
 */
export async function isLoadingComplete(): Promise<boolean> {
  try {
    // Load fonts
    await Font.loadAsync({
      // Add your fonts here, for example:
      // 'open-sans': require('../assets/fonts/OpenSans-Regular.ttf'),
      // 'open-sans-bold': require('../assets/fonts/OpenSans-Bold.ttf'),
    });

    // Preload images
    await Asset.loadAsync([
      // Add any images that need to be preloaded
      // require('../assets/images/logo.png'),
    ]);

    // Initialize database
    const db = await DatabaseService.getDatabase();
    if (!db) {
      throw new Error('Failed to initialize database');
    }

    // Check if this is the first launch
    const firstLaunch = await AsyncStorage.getItem('first_launch');
    if (!firstLaunch) {
      // Perform first-launch operations if needed
      await AsyncStorage.setItem('first_launch', 'false');
    }

    // Everything is loaded
    return true;
  } catch (error) {
    logger.error('Error loading app resources:', error);
    // Return true anyway to allow the app to continue loading
    // The error will be handled elsewhere
    return true;
  }
}