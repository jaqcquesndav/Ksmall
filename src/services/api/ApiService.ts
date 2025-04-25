import { generateUniqueId } from '../../utils/helpers';
import ApiClient from './ApiClient';
import logger from '../../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import eventEmitter from '../../utils/EventEmitter';

// Définition des types pour les actions hors ligne
export enum OfflineActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload'
}

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  endpoint: string;
  data?: any;
  priority: number;
  entity: string;
  createdAt: string;
  retries: number;
}

// Constants for storage keys
export const STORAGE_KEYS = {
  OFFLINE_QUEUE: '@ksmall/offline_queue',
  PENDING_CONFLICTS: '@ksmall/pending_conflicts',
  LAST_SYNC_TIME: '@ksmall/last_sync_time',
  CONNECTION_STATUS: '@ksmall/connection_status'
};

// Constants for sync events
export const SYNC_EVENTS = {
  SYNC_STARTED: 'sync_started',
  SYNC_PROGRESS: 'sync_progress',
  SYNC_COMPLETED: 'sync_completed',
  SYNC_ERROR: 'sync_error',
  SYNC_CONFLICT: 'sync_conflict',
  SYNC_CONFLICTS_DETECTED: 'sync_conflicts_detected',
  SYNC_CONFLICT_RESOLVED: 'sync_conflict_resolved',
};

// API configuration
export const API_CONFIG = {
  MAX_SYNC_RETRIES: 3,
  SYNC_INTERVAL: 60 * 1000, // 1 minute
  CONNECTION_TIMEOUT: 10 * 1000, // 10 seconds
};

/**
 * Vérifie si l'appareil est actuellement en ligne
 */
const isOnline = async (): Promise<boolean> => {
  const netInfoState = await NetInfo.fetch();
  return !!netInfoState.isConnected;
};

/**
 * Vérifie si l'appareil peut se connecter au backend
 */
const canConnectToBackend = async (): Promise<boolean> => {
  // Vérifier d'abord si l'appareil a une connexion réseau
  const isNetworkAvailable = await isOnline();
  if (!isNetworkAvailable) {
    return false;
  }
  
  // Puis essayer de vérifier si le backend est accessible
  try {
    // Corriger l'appel avec seulement 2 arguments en incluant les options dans le second argument
    await ApiClient.get('/health', { timeout: API_CONFIG.CONNECTION_TIMEOUT });
    await AsyncStorage.setItem(STORAGE_KEYS.CONNECTION_STATUS, 'online');
    return true;
  } catch (error) {
    await AsyncStorage.setItem(STORAGE_KEYS.CONNECTION_STATUS, 'offline');
    return false;
  }
};

/**
 * Service API Principal
 * Gère toutes les communications avec le backend et la logique de mode hors ligne
 */
class ApiService {
  private offlineQueue: OfflineAction[] = [];
  private isSyncing: boolean = false;
  private syncTimeoutId: NodeJS.Timeout | null = null;
  private networkUnsubscribe: (() => void) | null = null;
  private conflictResolutionStrategies: Map<string, (localData: any, serverData: any) => any> = new Map();
  private defaultConflictStrategy: 'client' | 'server' | 'merge' | 'manual' = 'server';

  constructor() {
    this.initialize();
  }

  /**
   * Initialise le service API et configure les écouteurs de réseau
   */
  private async initialize(): Promise<void> {
    try {
      // Charger la file d'attente hors ligne depuis le stockage local
      await this.loadOfflineQueue();
      
      // Configurer l'écouteur de changement d'état du réseau
      this.setupNetworkListener();
      
      // Programmer la synchronisation périodique
      this.scheduleSyncTask();
      
      // Initialiser les stratégies de résolution de conflit par défaut
      this.initializeConflictStrategies();
      
      logger.info('Service API initialisé avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du service API', error);
    }
  }

  /**
   * Initialise les stratégies de résolution de conflit par défaut
   */
  private initializeConflictStrategies(): void {
    // Stratégie par entité (peut être étendue selon les besoins)
    this.conflictResolutionStrategies.set('transactions', (local, server) => {
      // Pour les transactions, nous conservons les changements locaux par défaut
      return { ...server, ...local };
    });
    
    this.conflictResolutionStrategies.set('products', (local, server) => {
      // Pour les produits, les données serveur ont la priorité, mais nous conservons des champs spécifiques
      return { 
        ...server, 
        localNotes: local.localNotes, // Conserver les notes locales
        customFields: { ...server.customFields, ...local.customFields } // Fusionner les champs personnalisés
      };
    });
  }

  /**
   * Configure l'écouteur de changement d'état du réseau
   */
  private setupNetworkListener(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
    
    this.networkUnsubscribe = NetInfo.addEventListener(async state => {
      if (state.isConnected) {
        logger.info('Connexion réseau rétablie, tentative de synchronisation');
        await this.syncOfflineQueue();
      } else {
        logger.info('Connexion réseau perdue, passage en mode hors ligne');
        await AsyncStorage.setItem(STORAGE_KEYS.CONNECTION_STATUS, 'offline');
      }
    });
  }

  /**
   * Programme une tâche de synchronisation périodique
   */
  private scheduleSyncTask(): void {
    if (this.syncTimeoutId) {
      clearTimeout(this.syncTimeoutId);
    }
    
    this.syncTimeoutId = setTimeout(async () => {
      await this.syncOfflineQueue();
      this.scheduleSyncTask();
    }, API_CONFIG.SYNC_INTERVAL);
  }

  /**
   * Charge la file d'attente hors ligne depuis le stockage local
   */
  private async loadOfflineQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
        logger.info(`File d'attente hors ligne chargée: ${this.offlineQueue.length} actions en attente`);
      } else {
        this.offlineQueue = [];
      }
    } catch (error) {
      logger.error('Erreur lors du chargement de la file d\'attente hors ligne', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Sauvegarde la file d'attente hors ligne dans le stockage local
   */
  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.offlineQueue));
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde de la file d\'attente hors ligne', error);
    }
  }

  /**
   * Exécute une action hors ligne sur le backend
   */
  private async executeOfflineAction(action: OfflineAction): Promise<any> {
    switch (action.type) {
      case OfflineActionType.CREATE:
        return ApiClient.post(action.endpoint, action.data);
      
      case OfflineActionType.UPDATE:
        // Pour les mises à jour, vérifier les conflits potentiels
        try {
          // Récupérer l'état actuel depuis le serveur pour détecter les conflits
          const serverData = await ApiClient.get(action.endpoint);
          
          // Vérifier si un conflit existe en comparant les timestamps ou versions
          if (this.detectConflict(serverData, action.data)) {
            // Émettre un événement de conflit
            eventEmitter.emit(SYNC_EVENTS.SYNC_CONFLICT, {
              endpoint: action.endpoint,
              localData: action.data,
              serverData: serverData,
              entity: action.entity
            });
            
            // Résoudre le conflit selon la stratégie configurée
            const resolvedData = await this.resolveConflict(action.entity, action.data, serverData);
            
            // Mettre à jour avec les données résolues
            return ApiClient.put(action.endpoint, resolvedData);
          }
          
          // Pas de conflit détecté, continuer normalement
          return ApiClient.put(action.endpoint, action.data);
        } catch (error) {
          // En cas d'erreur dans la détection de conflit, procéder avec la mise à jour normale
          logger.warn(`Échec de la détection de conflit pour ${action.endpoint}`, error);
          return ApiClient.put(action.endpoint, action.data);
        }
      
      case OfflineActionType.DELETE:
        return ApiClient.delete(action.endpoint);
      
      case OfflineActionType.UPLOAD:
        // Pour les actions d'upload, convertir les données en FormData
        if (action.data) {
          const formData = new FormData();
          // Supposons que action.data contient les informations nécessaires pour construire le FormData
          Object.keys(action.data).forEach(key => {
            formData.append(key, action.data[key]);
          });
          return ApiClient.uploadFile(action.endpoint, formData);
        }
        throw new Error('Données manquantes pour l\'action d\'upload');
      
      default:
        throw new Error(`Type d'action non supporté: ${action.type}`);
    }
  }

  /**
   * Détecte les conflits entre les données locales et serveur
   * @param serverData Données récupérées du serveur
   * @param localData Données locales
   * @returns true si un conflit est détecté
   */
  private detectConflict(serverData: any, localData: any): boolean {
    // Si les données serveur n'existent pas, pas de conflit
    if (!serverData) return false;
    
    // Vérification basée sur le timestamp de dernière modification
    if (serverData.updatedAt && localData.updatedAt) {
      const serverDate = new Date(serverData.updatedAt);
      const localDate = new Date(localData.updatedAt);
      
      // Si la version serveur est plus récente que notre version locale de départ
      if (serverDate > localDate) {
        return true;
      }
    }
    
    // Vérification basée sur un numéro de version s'il existe
    if (serverData.version !== undefined && localData.baseVersion !== undefined) {
      // Si la version du serveur est différente de la version de base locale
      if (serverData.version !== localData.baseVersion) {
        return true;
      }
    }
    
    // Pas de conflit détecté
    return false;
  }
  
  /**
   * Résout un conflit selon la stratégie configurée
   * @param entityType Type d'entité pour laquelle résoudre le conflit
   * @param localData Données locales
   * @param serverData Données du serveur
   * @returns Données résolues
   */
  private async resolveConflict(entityType: string, localData: any, serverData: any): Promise<any> {
    // Rechercher une stratégie spécifique pour ce type d'entité
    const customStrategy = this.conflictResolutionStrategies.get(entityType);
    
    if (customStrategy) {
      // Utiliser la stratégie personnalisée
      const resolvedData = customStrategy(localData, serverData);
      logger.info(`Conflit résolu pour ${entityType} avec stratégie personnalisée`);
      eventEmitter.emit(SYNC_EVENTS.SYNC_CONFLICT_RESOLVED, { 
        entity: entityType,
        resolution: 'custom',
        data: resolvedData
      });
      return resolvedData;
    }
    
    // Appliquer la stratégie par défaut
    switch (this.defaultConflictStrategy) {
      case 'client':
        logger.info(`Conflit résolu pour ${entityType} en faveur du client`);
        eventEmitter.emit(SYNC_EVENTS.SYNC_CONFLICT_RESOLVED, { 
          entity: entityType,
          resolution: 'client',
          data: localData
        });
        return localData;
        
      case 'server':
        logger.info(`Conflit résolu pour ${entityType} en faveur du serveur`);
        eventEmitter.emit(SYNC_EVENTS.SYNC_CONFLICT_RESOLVED, { 
          entity: entityType,
          resolution: 'server',
          data: serverData
        });
        return serverData;
        
      case 'merge':
        // Fusion simple par défaut (peut être améliorée)
        const mergedData = { ...serverData, ...localData };
        logger.info(`Conflit résolu pour ${entityType} par fusion`);
        eventEmitter.emit(SYNC_EVENTS.SYNC_CONFLICT_RESOLVED, { 
          entity: entityType,
          resolution: 'merge',
          data: mergedData
        });
        return mergedData;
        
      case 'manual':
        // Pour la résolution manuelle, nous mettons en attente et notifions
        logger.info(`Conflit pour ${entityType} en attente de résolution manuelle`);
        // Stocker le conflit pour résolution manuelle ultérieure
        await this.storeConflictForManualResolution(entityType, localData, serverData);
        // Par défaut, conserver les données serveur en attendant
        return serverData;
        
      default:
        logger.warn(`Stratégie de résolution de conflit inconnue: ${this.defaultConflictStrategy}`);
        return serverData;
    }
  }
  
  /**
   * Stocke un conflit pour résolution manuelle ultérieure
   */
  private async storeConflictForManualResolution(entityType: string, localData: any, serverData: any): Promise<void> {
    try {
      // Récupérer les conflits existants
      const conflictsString = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CONFLICTS) || '[]';
      const conflicts = JSON.parse(conflictsString);
      
      // Ajouter le nouveau conflit
      conflicts.push({
        id: generateUniqueId(),
        entityType,
        localData,
        serverData,
        createdAt: new Date().toISOString()
      });
      
      // Sauvegarder les conflits mis à jour
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CONFLICTS, JSON.stringify(conflicts));
    } catch (error) {
      logger.error('Erreur lors du stockage du conflit pour résolution manuelle', error);
    }
  }
  
  /**
   * Configure la stratégie de résolution de conflits par défaut
   * @param strategy Stratégie à utiliser
   */
  setDefaultConflictStrategy(strategy: 'client' | 'server' | 'merge' | 'manual'): void {
    this.defaultConflictStrategy = strategy;
    logger.info(`Stratégie de résolution de conflit par défaut définie sur: ${strategy}`);
  }
  
  /**
   * Définit une stratégie de résolution de conflit personnalisée pour un type d'entité
   * @param entityType Type d'entité
   * @param strategy Fonction de résolution personnalisée
   */
  setConflictStrategy(entityType: string, strategy: (localData: any, serverData: any) => any): void {
    this.conflictResolutionStrategies.set(entityType, strategy);
    logger.info(`Stratégie de résolution personnalisée définie pour: ${entityType}`);
  }
  
  /**
   * Résout manuellement un conflit stocké
   * @param conflictId ID du conflit
   * @param resolution Données résolues
   */
  async resolveManualConflict(conflictId: string, resolution: any): Promise<boolean> {
    try {
      // Récupérer les conflits
      const conflictsString = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CONFLICTS) || '[]';
      const conflicts = JSON.parse(conflictsString);
      
      // Trouver le conflit par ID
      const conflictIndex = conflicts.findIndex((c: any) => c.id === conflictId);
      if (conflictIndex === -1) {
        logger.warn(`Conflit non trouvé: ${conflictId}`);
        return false;
      }
      
      const conflict = conflicts[conflictIndex];
      
      // Extraire l'endpoint à partir des données de conflit (à adapter selon votre structure)
      // Exemple: si l'objet contient un ID, construire l'endpoint approprié
      const entityId = resolution.id || conflict.serverData.id;
      const endpoint = `/${conflict.entityType}/${entityId}`;
      
      // Envoyer la résolution au serveur
      await ApiClient.put(endpoint, resolution);
      
      // Supprimer le conflit résolu
      conflicts.splice(conflictIndex, 1);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CONFLICTS, JSON.stringify(conflicts));
      
      // Émettre un événement de résolution
      eventEmitter.emit(SYNC_EVENTS.SYNC_CONFLICT_RESOLVED, {
        entity: conflict.entityType,
        resolution: 'manual',
        data: resolution
      });
      
      logger.info(`Conflit ${conflictId} résolu manuellement`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la résolution manuelle du conflit ${conflictId}`, error);
      return false;
    }
  }
  
  /**
   * Récupère les conflits en attente de résolution manuelle
   */
  async getPendingConflicts(): Promise<any[]> {
    try {
      const conflictsString = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CONFLICTS) || '[]';
      return JSON.parse(conflictsString);
    } catch (error) {
      logger.error('Erreur lors de la récupération des conflits en attente', error);
      return [];
    }
  }
  
  /**
   * Tente de synchroniser la file d'attente hors ligne avec le backend
   */
  async syncOfflineQueue(): Promise<boolean> {
    if (this.isSyncing || this.offlineQueue.length === 0) {
      return true;
    }
    
    // Vérifier si l'appareil est connecté au réseau et authentifié
    const canConnect = await canConnectToBackend();
    if (!canConnect) {
      logger.info('Impossible de se connecter au backend pour synchroniser la file d\'attente');
      return false;
    }
    
    try {
      this.isSyncing = true;
      eventEmitter.emit(SYNC_EVENTS.SYNC_STARTED, { actionsCount: this.offlineQueue.length });
      logger.info(`Démarrage de la synchronisation: ${this.offlineQueue.length} actions en attente`);
      
      // Trier la file d'attente par priorité (ordre décroissant)
      const sortedQueue = [...this.offlineQueue].sort((a, b) => b.priority - a.priority);
      const failedActions: OfflineAction[] = [];
      
      let processedCount = 0;
      const totalCount = sortedQueue.length;
      
      for (const action of sortedQueue) {
        try {
          // Vérifier si nous sommes toujours connectés
          const stillConnected = await isOnline();
          if (!stillConnected) {
            logger.warn('Connexion internet perdue pendant la synchronisation');
            failedActions.push(action);
            continue;
          }
          
          // Émettre l'événement de progression
          processedCount++;
          eventEmitter.emit(SYNC_EVENTS.SYNC_PROGRESS, {
            processed: processedCount,
            total: totalCount,
            current: action.entity,
            percentage: Math.round((processedCount / totalCount) * 100)
          });
          
          // Exécuter l'action
          await this.executeOfflineAction(action);
          
          // Si on arrive ici, l'action a été traitée avec succès
          logger.info(`Action synchronisée avec succès: ${action.id} (${action.type} ${action.entity})`);
        } catch (error) {
          logger.error(`Échec de la synchronisation de l'action ${action.id}`, error);
          
          // Incrémenter le compteur de tentatives
          action.retries += 1;
          
          // Si le nombre maximum de tentatives n'est pas atteint, réessayer plus tard
          if (action.retries < API_CONFIG.MAX_SYNC_RETRIES) {
            failedActions.push(action);
          } else {
            logger.warn(`Action abandonnée après ${action.retries} tentatives: ${action.id}`);
            // Ici, vous pourriez implémenter une logique pour notifier l'utilisateur
          }
        }
      }
      
      // Mettre à jour la file d'attente avec les actions échouées
      this.offlineQueue = failedActions;
      await this.saveOfflineQueue();
      
      // Mettre à jour la dernière heure de synchronisation
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, new Date().toISOString());
      
      eventEmitter.emit(SYNC_EVENTS.SYNC_COMPLETED, { remainingActions: failedActions.length });
      logger.info(`Synchronisation terminée. ${failedActions.length} actions en attente`);
      return this.offlineQueue.length === 0;
    } catch (error) {
      eventEmitter.emit(SYNC_EVENTS.SYNC_ERROR, error);
      logger.error('Erreur pendant la synchronisation de la file d\'attente', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Ajoute une action à la file d'attente hors ligne
   */
  async addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'createdAt' | 'retries'>): Promise<string> {
    const actionId = generateUniqueId();
    const newAction: OfflineAction = {
      ...action,
      id: actionId,
      createdAt: new Date().toISOString(),
      retries: 0
    };
    
    // Ajouter à la file d'attente et sauvegarder
    this.offlineQueue.push(newAction);
    await this.saveOfflineQueue();
    
    // Essayer de synchroniser immédiatement si possible
    if (await canConnectToBackend()) {
      this.syncOfflineQueue();
    }
    
    return actionId;
  }

  /**
   * Effectue un appel GET à l'API avec gestion du mode hors ligne
   */
  async get<T>(endpoint: string, params?: any, forceOnline: boolean = false): Promise<T> {
    if (!forceOnline && !(await canConnectToBackend())) {
      // En mode hors ligne, retourner null ou des données en cache
      // À implémenter selon les besoins de l'application
      logger.info(`Mode hors ligne: GET ${endpoint} - pas d'accès au backend`);
      throw new Error('Pas de connexion au backend');
    }
    
    return ApiClient.get<T>(endpoint, params);
  }

  /**
   * Effectue un appel POST à l'API avec gestion du mode hors ligne
   */
  async post<T>(endpoint: string, data?: any, offlineSupport: boolean = true): Promise<T> {
    if (offlineSupport && !(await canConnectToBackend())) {
      // En mode hors ligne, ajouter à la file d'attente
      logger.info(`Mode hors ligne: POST ${endpoint} - ajouté à la file d'attente`);
      const actionId = await this.addToOfflineQueue({
        type: OfflineActionType.CREATE,
        endpoint,
        data,
        priority: 1,
        entity: endpoint.split('/').pop() || 'unknown'
      });
      
      // Retourner une réponse simulée avec l'ID d'action
      return { id: actionId, _offlineAction: true } as unknown as T;
    }
    
    return ApiClient.post<T>(endpoint, data);
  }

  /**
   * Effectue un appel PUT à l'API avec gestion du mode hors ligne
   */
  async put<T>(endpoint: string, data?: any, offlineSupport: boolean = true): Promise<T> {
    if (offlineSupport && !(await canConnectToBackend())) {
      // En mode hors ligne, ajouter à la file d'attente
      logger.info(`Mode hors ligne: PUT ${endpoint} - ajouté à la file d'attente`);
      const actionId = await this.addToOfflineQueue({
        type: OfflineActionType.UPDATE,
        endpoint,
        data,
        priority: 2, // Priorité légèrement plus faible que les créations
        entity: endpoint.split('/').pop() || 'unknown'
      });
      
      // Retourner une réponse simulée avec l'ID d'action
      return { id: actionId, _offlineAction: true } as unknown as T;
    }
    
    return ApiClient.put<T>(endpoint, data);
  }

  /**
   * Effectue un appel DELETE à l'API avec gestion du mode hors ligne
   */
  async delete<T>(endpoint: string, offlineSupport: boolean = true): Promise<T> {
    if (offlineSupport && !(await canConnectToBackend())) {
      // En mode hors ligne, ajouter à la file d'attente
      logger.info(`Mode hors ligne: DELETE ${endpoint} - ajouté à la file d'attente`);
      const actionId = await this.addToOfflineQueue({
        type: OfflineActionType.DELETE,
        endpoint,
        priority: 3, // Priorité plus faible que les mises à jour
        entity: endpoint.split('/').pop() || 'unknown'
      });
      
      // Retourner une réponse simulée avec l'ID d'action
      return { id: actionId, _offlineAction: true } as unknown as T;
    }
    
    return ApiClient.delete<T>(endpoint);
  }

  /**
   * Effectue un upload de fichier à l'API avec gestion du mode hors ligne
   */
  async uploadFile<T>(endpoint: string, formData: FormData, offlineSupport: boolean = true): Promise<T> {
    if (offlineSupport && !(await canConnectToBackend())) {
      // En mode hors ligne, ajouter à la file d'attente si le support hors ligne est activé
      logger.info(`Mode hors ligne: UPLOAD ${endpoint} - ajouté à la file d'attente`);
      
      // Convertir le FormData en objet pour le stockage
      const formDataObject: Record<string, any> = {};
      // Nous ne pouvons pas simplement convertir FormData en objet, donc cela nécessiterait une logique personnalisée
      // Cette implémentation est simplifiée
      
      const actionId = await this.addToOfflineQueue({
        type: OfflineActionType.UPLOAD,
        endpoint,
        data: formDataObject,
        priority: 1, // Haute priorité pour les uploads
        entity: 'file'
      });
      
      // Retourner une réponse simulée avec l'ID d'action
      return { id: actionId, _offlineAction: true } as unknown as T;
    }
    
    return ApiClient.uploadFile<T>(endpoint, formData);
  }

  /**
   * Vérifie l'état de la connexion au backend
   */
  async checkBackendConnection(): Promise<boolean> {
    try {
      // Tentative d'appel à un endpoint léger pour vérifier la connexion
      await ApiClient.get('/health');
      await AsyncStorage.setItem(STORAGE_KEYS.CONNECTION_STATUS, 'online');
      return true;
    } catch (error) {
      await AsyncStorage.setItem(STORAGE_KEYS.CONNECTION_STATUS, 'offline');
      return false;
    }
  }

  /**
   * Force la synchronisation des données maintenant
   */
  async forceSyncNow(): Promise<boolean> {
    return this.syncOfflineQueue();
  }

  /**
   * Nettoyage des ressources à la fermeture de l'application
   */
  cleanup(): void {
    if (this.syncTimeoutId) {
      clearTimeout(this.syncTimeoutId);
      this.syncTimeoutId = null;
    }
    
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
    
    logger.info('Ressources du service API nettoyées');
  }
}

export default new ApiService();