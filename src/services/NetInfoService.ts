/**
 * Service de gestion des informations réseau
 * Fournit des utilitaires pour surveiller l'état de la connexion internet
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { EventEmitter } from '../utils/EventEmitter';

/**
 * Types d'événements réseau
 */
export enum NetworkEvents {
  CONNECTIVITY_CHANGE = 'connectivityChange',
  ONLINE = 'online',
  OFFLINE = 'offline'
}

/**
 * Service pour gérer les informations de connexion réseau
 */
class NetInfoService {
  private static instance: NetInfoService;
  private _isConnected: boolean = false;
  private _connectionType: string | null = null;
  private _eventEmitter: EventEmitter = new EventEmitter();
  private _unsubscribe: (() => void) | null = null;

  private constructor() {
    this._initNetInfo();
  }

  /**
   * Obtenir l'instance singleton du service
   */
  public static getInstance(): NetInfoService {
    if (!NetInfoService.instance) {
      NetInfoService.instance = new NetInfoService();
    }
    return NetInfoService.instance;
  }

  /**
   * Initialiser la surveillance du réseau
   */
  private _initNetInfo(): void {
    // Vérifier l'état initial de la connexion
    NetInfo.fetch().then(this._handleConnectivityChange.bind(this));

    // S'abonner aux changements de connectivité
    this._unsubscribe = NetInfo.addEventListener(this._handleConnectivityChange.bind(this));
  }

  /**
   * Gérer les changements d'état de la connexion réseau
   * @param state État de la connexion réseau
   */
  private _handleConnectivityChange(state: NetInfoState): void {
    const wasConnected = this._isConnected;
    this._isConnected = !!state.isConnected;
    this._connectionType = state.type;

    // Émettre l'événement de changement de connectivité
    this._eventEmitter.emit(NetworkEvents.CONNECTIVITY_CHANGE, {
      isConnected: this._isConnected,
      connectionType: this._connectionType,
      details: state
    });

    // Émettre des événements spécifiques pour les changements d'état
    if (!wasConnected && this._isConnected) {
      this._eventEmitter.emit(NetworkEvents.ONLINE);
    } else if (wasConnected && !this._isConnected) {
      this._eventEmitter.emit(NetworkEvents.OFFLINE);
    }
  }

  /**
   * Vérifier si l'appareil est actuellement connecté à Internet
   * @returns {Promise<boolean>} Promise résolu avec l'état de connexion
   */
  public async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!state.isConnected;
  }

  /**
   * Obtenir l'état actuel de la connexion (synchrone)
   * @returns {boolean} État actuel de la connexion
   */
  public get connected(): boolean {
    return this._isConnected;
  }

  /**
   * Obtenir le type de connexion actuel
   * @returns {string | null} Type de connexion (wifi, cellular, none, etc.)
   */
  public get connectionType(): string | null {
    return this._connectionType;
  }

  /**
   * S'abonner à un événement réseau
   * @param event Type d'événement
   * @param listener Fonction de rappel
   * @returns Fonction pour se désabonner
   */
  public addEventListener(event: NetworkEvents, listener: (...args: any[]) => void): () => void {
    return this._eventEmitter.on(event, listener);
  }

  /**
   * Se désabonner de tous les événements réseau
   */
  public destroy(): void {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    this._eventEmitter.removeAllListeners();
  }

  /**
   * Vérifier si le réseau est suffisamment performant pour une opération donnée
   * @param requiredSpeed Vitesse minimale requise en Kbps
   * @returns {Promise<boolean>} True si le réseau est assez performant
   */
  public async isNetworkPerformantEnough(requiredSpeed: number = 50): Promise<boolean> {
    // Si pas de connexion, retourner false immédiatement
    if (!this._isConnected) return false;

    const state = await NetInfo.fetch();

    // Estimation de la performance basée sur le type de réseau
    // Cela pourrait être amélioré avec une mesure réelle de la vitesse
    switch (state.type) {
      case 'wifi':
        return true; // Supposons que le WiFi est assez rapide
      case 'cellular':
        // Évaluer en fonction de la génération du réseau mobile
        switch (state.details?.cellularGeneration) {
          case '4g':
          case '5g':
            return true;
          case '3g':
            return requiredSpeed < 1000; // ~1Mbps pour 3G
          case '2g':
            return requiredSpeed < 50; // ~50Kbps pour 2G
          default:
            return false;
        }
      default:
        return false;
    }
  }
}

// Exporter une instance singleton
const netInfoService = NetInfoService.getInstance();
export default netInfoService;