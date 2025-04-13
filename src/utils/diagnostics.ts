import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import Constants from 'expo-constants';
import logger from './logger';

interface DiagnosticResult {
  success: boolean;
  details?: any;
  error?: string;
}

export const runDiagnostics = async (): Promise<{[key: string]: DiagnosticResult}> => {
  const results: {[key: string]: DiagnosticResult} = {};
  
  // Vérifier l'environnement
  try {
    results.environment = {
      success: true,
      details: {
        platform: Platform.OS,
        version: Platform.Version,
        isDevice: Constants.isDevice,
        appVersion: Constants.manifest?.version || "unknown",
      }
    };
  } catch (error) {
    results.environment = {
      success: false,
      error: String(error)
    };
  }
  
  // Vérifier l'accès au système de fichiers
  try {
    const docDir = FileSystem.documentDirectory;
    const dirInfo = await FileSystem.getInfoAsync(docDir!);
    results.fileSystem = {
      success: true,
      details: {
        documentDirectory: docDir,
        exists: dirInfo.exists,
        isDirectory: dirInfo.isDirectory,
      }
    };
  } catch (error) {
    results.fileSystem = {
      success: false,
      error: String(error)
    };
  }
  
  // Vérifier la connectivité réseau
  try {
    const networkState = await Network.getNetworkStateAsync();
    results.network = {
      success: true,
      details: {
        isConnected: networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable,
        type: networkState.type
      }
    };
  } catch (error) {
    results.network = {
      success: false,
      error: String(error)
    };
  }
  
  // Afficher les résultats dans la console
  logger.info('Diagnostic results', results);
  
  return results;
};
