/**
 * Utilitaires pour gérer les problèmes de réseau, la détection de connectivité
 * et permettre le fonctionnement de l'application en mode hors ligne
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import logger from './logger';

// Clés de stockage pour les configurations réseau
const NETWORK_CONFIG_KEY = 'ksmall_network_config';
const API_SERVER_CONFIG_KEY = 'ksmall_api_server_config';
const OFFLINE_MODE_KEY = 'ksmall_offline_mode';

// Type de connexion considéré comme "rapide" pour les fonctionnalités avancées
const FAST_CONNECTION_TYPES = ['wifi', 'ethernet'];

// Interfaces pour les configurations
export interface NetworkConfig {
  offlineModeEnabled: boolean;
  preferOfflineContent: boolean;
  syncInterval: number; // en minutes
  dataUsageLimit: number; // en MB
  lastSyncTimestamp: number;
}

export interface ApiServerConfig {
  localServerIp: string;
  localServerPort: string;
  useLocalServer: boolean;
  productionServerUrl: string;
}

// Valeurs par défaut
const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  offlineModeEnabled: false,
  preferOfflineContent: true,
  syncInterval: 60, // 1 heure
  dataUsageLimit: 100, // 100 MB
  lastSyncTimestamp: 0
};

const DEFAULT_API_SERVER_CONFIG: ApiServerConfig = {
  localServerIp: '192.168.43.157', // À remplacer par votre adresse IP
  localServerPort: '8000',
  useLocalServer: __DEV__,
  productionServerUrl: 'kiota-suite.com'
};

/**
 * Classe utilitaire pour gérer le réseau et les API
 */
class NetworkUtils {
  private static instance: NetworkUtils;
  private networkConfig: NetworkConfig = DEFAULT_NETWORK_CONFIG;
  private apiServerConfig: ApiServerConfig = DEFAULT_API_SERVER_CONFIG;
  private isOffline: boolean = false;
  private connectionType: string | null = null;
  private connectionQuality: 'poor' | 'good' | 'excellent' | 'unknown' = 'unknown';
  private isInitialized: boolean = false;
  private networkListeners: ((state: NetInfoState) => void)[] = [];

  /**
   * Constructeur privé pour le pattern Singleton
   */
  private constructor() {}

  /**
   * Obtenir l'instance unique de NetworkUtils
   */
  public static getInstance(): NetworkUtils {
    if (!NetworkUtils.instance) {
      NetworkUtils.instance = new NetworkUtils();
    }
    return NetworkUtils.instance;
  }

  /**
   * Initialiser le gestionnaire de réseau
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Charger les configurations
      await this.loadNetworkConfig();
      await this.loadApiServerConfig();
      
      // Configurer un écouteur pour les changements d'état du réseau
      NetInfo.addEventListener(this.handleNetworkChange.bind(this));
      
      // Obtenir l'état initial du réseau
      const state = await NetInfo.fetch();
      this.isOffline = !state.isConnected;
      this.connectionType = state.type;
      
      // Déterminer la qualité de la connexion
      this.updateConnectionQuality(state);
      
      this.isInitialized = true;
      logger.info('NetworkUtils initialisé avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de NetworkUtils', error);
    }
  }

  /**
   * Gérer les changements d'état du réseau
   */
  private handleNetworkChange(state: NetInfoState): void {
    const wasOffline = this.isOffline;
    this.isOffline = !state.isConnected;
    this.connectionType = state.type;
    
    // Mettre à jour la qualité de la connexion
    this.updateConnectionQuality(state);
    
    // Notifier les listeners
    this.notifyNetworkListeners(state);
    
    // Log le changement d'état
    if (wasOffline !== this.isOffline) {
      if (this.isOffline) {
        logger.warn('Connexion réseau perdue. Passage en mode hors ligne.');
      } else {
        logger.info('Connexion réseau rétablie.');
      }
    }
  }

  /**
   * Mettre à jour la qualité estimée de la connexion
   */
  private updateConnectionQuality(state: NetInfoState): void {
    if (!state.isConnected) {
      this.connectionQuality = 'poor';
      return;
    }

    if (FAST_CONNECTION_TYPES.includes(state.type)) {
      this.connectionQuality = state.isInternetReachable === false ? 'good' : 'excellent';
    } else if (state.type === 'cellular') {
      // Pour mobile, se baser sur effectiveType si disponible
      switch (state.details?.cellularGeneration) {
        case '2g':
          this.connectionQuality = 'poor';
          break;
        case '3g':
          this.connectionQuality = 'good';
          break;
        case '4g':
        case '5g':
          this.connectionQuality = 'excellent';
          break;
        default:
          this.connectionQuality = 'good'; // Par défaut, supposer une connexion correcte
      }
    } else {
      this.connectionQuality = 'unknown';
    }
  }

  /**
   * Notifier tous les écouteurs de réseau enregistrés
   */
  private notifyNetworkListeners(state: NetInfoState): void {
    for (const listener of this.networkListeners) {
      try {
        listener(state);
      } catch (error) {
        logger.error('Erreur dans un écouteur de réseau', error);
      }
    }
  }

  /**
   * Charger la configuration réseau depuis le stockage local
   */
  private async loadNetworkConfig(): Promise<void> {
    try {
      const configData = await AsyncStorage.getItem(NETWORK_CONFIG_KEY);
      if (configData) {
        this.networkConfig = { ...DEFAULT_NETWORK_CONFIG, ...JSON.parse(configData) };
      }
    } catch (error) {
      logger.error('Erreur lors du chargement de la configuration réseau', error);
      this.networkConfig = { ...DEFAULT_NETWORK_CONFIG };
    }
  }

  /**
   * Sauvegarder la configuration réseau dans le stockage local
   */
  private async saveNetworkConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(NETWORK_CONFIG_KEY, JSON.stringify(this.networkConfig));
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde de la configuration réseau', error);
    }
  }

  /**
   * Charger la configuration du serveur API depuis le stockage local
   */
  private async loadApiServerConfig(): Promise<void> {
    try {
      const configData = await AsyncStorage.getItem(API_SERVER_CONFIG_KEY);
      if (configData) {
        this.apiServerConfig = { ...DEFAULT_API_SERVER_CONFIG, ...JSON.parse(configData) };
      }
    } catch (error) {
      logger.error('Erreur lors du chargement de la configuration du serveur API', error);
      this.apiServerConfig = { ...DEFAULT_API_SERVER_CONFIG };
    }
  }

  /**
   * Sauvegarder la configuration du serveur API dans le stockage local
   */
  private async saveApiServerConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(API_SERVER_CONFIG_KEY, JSON.stringify(this.apiServerConfig));
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde de la configuration du serveur API', error);
    }
  }

  /**
   * Ajouter un écouteur pour les changements d'état du réseau
   */
  public addNetworkListener(listener: (state: NetInfoState) => void): () => void {
    this.networkListeners.push(listener);
    return () => {
      this.networkListeners = this.networkListeners.filter(l => l !== listener);
    };
  }

  /**
   * Vérifier si le réseau est actuellement disponible
   */
  public async isNetworkAvailable(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  }

  /**
   * Obtenir la qualité de la connexion actuelle
   */
  public getConnectionQuality(): 'poor' | 'good' | 'excellent' | 'unknown' {
    return this.connectionQuality;
  }

  /**
   * Vérifier si le mode hors ligne est activé manuellement
   */
  public async isOfflineModeEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(OFFLINE_MODE_KEY);
      return value === 'true';
    } catch (error) {
      logger.error('Erreur lors de la vérification du mode hors ligne', error);
      return false;
    }
  }

  /**
   * Définir si le mode hors ligne est activé manuellement
   */
  public async setOfflineMode(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_MODE_KEY, enabled ? 'true' : 'false');
      
      // Mettre à jour la configuration réseau
      this.networkConfig.offlineModeEnabled = enabled;
      await this.saveNetworkConfig();
      
      logger.info(`Mode hors ligne ${enabled ? 'activé' : 'désactivé'} manuellement`);
    } catch (error) {
      logger.error('Erreur lors de la définition du mode hors ligne', error);
    }
  }

  /**
   * Mettre à jour l'adresse IP du serveur local
   */
  public async updateLocalServerIp(ip: string): Promise<void> {
    this.apiServerConfig.localServerIp = ip;
    await this.saveApiServerConfig();
    logger.info(`Adresse IP du serveur local mise à jour: ${ip}`);
  }

  /**
   * Mettre à jour le port du serveur local
   */
  public async updateLocalServerPort(port: string): Promise<void> {
    this.apiServerConfig.localServerPort = port;
    await this.saveApiServerConfig();
    logger.info(`Port du serveur local mis à jour: ${port}`);
  }

  /**
   * Définir si le serveur local doit être utilisé
   */
  public async setUseLocalServer(useLocalServer: boolean): Promise<void> {
    this.apiServerConfig.useLocalServer = useLocalServer;
    await this.saveApiServerConfig();
    logger.info(`Utilisation du serveur local ${useLocalServer ? 'activée' : 'désactivée'}`);
  }

  /**
   * Obtenir l'URL de base à utiliser pour les appels API
   */
  public getBaseApiUrl(servicePath: string): string {
    // Enlever le premier '/' du path si présent pour la cohérence
    const cleanPath = servicePath.startsWith('/') ? servicePath.substring(1) : servicePath;
    
    // Si le mode hors ligne est activé, toujours retourner null pour utiliser les données en cache
    if (this.networkConfig.offlineModeEnabled || this.isOffline) {
      return '';
    }

    // Déterminer quelle URL utiliser en fonction de la configuration
    if (this.apiServerConfig.useLocalServer && __DEV__) {
      // En mode développement avec serveur local
      if (Platform.OS === 'android') {
        return `http://${this.apiServerConfig.localServerIp}:${this.apiServerConfig.localServerPort}/${cleanPath}`;
      } else {
        return `http://localhost:${this.apiServerConfig.localServerPort}/${cleanPath}`;
      }
    }
    
    // En production ou si le serveur local n'est pas configuré
    return `https://${cleanPath}.${this.apiServerConfig.productionServerUrl}`;
  }

  /**
   * Vérifier si le serveur local est utilisable
   * Cette méthode teste si le serveur local est accessible
   */
  public async isLocalServerReachable(): Promise<boolean> {
    if (!__DEV__ || !this.apiServerConfig.useLocalServer) {
      return false;
    }

    try {
      const url = Platform.OS === 'android'
        ? `http://${this.apiServerConfig.localServerIp}:${this.apiServerConfig.localServerPort}/health`
        : `http://localhost:${this.apiServerConfig.localServerPort}/health`;

      // Utiliser AbortController pour gérer le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      logger.warn('Le serveur local n\'est pas accessible', error);
      return false;
    }
  }
}

// Exporter une instance unique de NetworkUtils
const networkUtils = NetworkUtils.getInstance();
export default networkUtils;