import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import logger from '../utils/logger';
import DatabaseService from './DatabaseService';

// Définir des timeouts pour les opérations critiques
const DB_OPERATION_TIMEOUT = 10000; // 10 secondes
const API_OPERATION_TIMEOUT = 15000; // 15 secondes

// Types d'opérations qui peuvent être mises en file d'attente
export enum QueueOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CUSTOM = 'CUSTOM'
}

// Statut des opérations en file d'attente
export enum QueueItemStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  CONFLICT = 'CONFLICT'
}

// Structure d'un élément dans la file d'attente
export interface QueueItem {
  id?: number;
  endpoint: string;
  operation: QueueOperationType;
  data: any;
  tableName: string;
  localId?: string | number;
  remoteId?: string | number;
  status: QueueItemStatus;
  retries: number;
  maxRetries: number;
  priority: number;
  createdAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
  conflictResolution?: 'LOCAL' | 'REMOTE' | 'MERGE' | 'ASK';
}

/**
 * Service pour gérer la file d'attente des opérations hors ligne
 * qui devront être synchronisées avec le backend une fois en ligne
 */
class OfflineQueueService {
  private static instance: OfflineQueueService;
  private db: SQLite.WebSQLDatabase | null = null;
  private isProcessing = false;
  private autoSync = true;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.initPromise = this.init();
  }

  /**
   * Obtenir l'instance singleton du service de file d'attente
   */
  public static getInstance(): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService();
    }
    return OfflineQueueService.instance;
  }

  /**
   * Attend que l'initialisation soit terminée
   */
  public async waitForInit(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) {
      return this.initPromise;
    }
    return Promise.resolve();
  }

  /**
   * Initialiser le service avec une gestion d'erreurs améliorée
   */
  private async init(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Initialiser la base de données avec timeout
      await Promise.race([
        this.initDatabase(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout lors de l\'initialisation de la base de données')), 
          DB_OPERATION_TIMEOUT)
        )
      ]).catch(error => {
        logger.error('Erreur lors de l\'initialisation de la base de données:', error);
        // Ne pas bloquer le reste de l'initialisation si la BDD échoue
      });

      try {
        // Configurer l'écouteur d'état du réseau avec une gestion d'erreurs
        NetInfo.addEventListener(state => {
          try {
            if (state.isConnected && this.autoSync) {
              logger.info('Connexion réseau rétablie, traitement de la file d\'attente');
              // Ajouter un délai pour éviter les rafales de requêtes
              setTimeout(() => {
                this.processQueue().catch(error => {
                  logger.error('Erreur lors du traitement automatique de la file d\'attente:', error);
                });
              }, 2000);
            }
          } catch (listenerError) {
            logger.error('Erreur dans le gestionnaire de changement d\'état réseau:', listenerError);
          }
        });
      } catch (netInfoError) {
        logger.error('Erreur lors de la configuration de l\'écouteur réseau:', netInfoError);
      }
      
      // Charger la configuration de synchronisation automatique depuis le stockage persistant
      try {
        const autoSyncSetting = await AsyncStorage.getItem('offline_queue_auto_sync');
        this.autoSync = autoSyncSetting ? autoSyncSetting === 'true' : true;
      } catch (storageError) {
        logger.warn('Impossible de charger le paramètre de synchronisation automatique, utilisation de la valeur par défaut (activé):', storageError);
        this.autoSync = true;
      }
      
      this.isInitialized = true;
      logger.debug('Service de file d\'attente hors ligne initialisé');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du service de file d\'attente:', error);
      this.isInitialized = false;
      this.initPromise = null;
    }
  }

  /**
   * Initialiser la base de données pour la file d'attente avec une gestion d'erreur améliorée
   */
  private async initDatabase(): Promise<void> {
    try {
      if (this.db) {
        // La base de données est déjà initialisée
        return;
      }
      
      this.db = await DatabaseService.getDatabase();
      
      // Création de la table avec gestion des erreurs
      await DatabaseService.createTableIfNotExists(
        this.db,
        'offline_queue',
        `id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        table_name TEXT NOT NULL,
        local_id TEXT,
        remote_id TEXT,
        status TEXT NOT NULL,
        retries INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        priority INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_attempt_at TIMESTAMP,
        error_message TEXT,
        conflict_resolution TEXT`
      );
      
      logger.debug('Table offline_queue créée ou vérifiée');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la base de données pour la file d\'attente:', error);
      // Ne pas propager l'erreur pour permettre à l'application de continuer
    }
  }

  /**
   * Ajouter un élément à la file d'attente avec une gestion d'erreur améliorée
   * @param item Élément à ajouter
   * @returns ID de l'élément en file d'attente
   */
  public async enqueue(item: Omit<QueueItem, 'id' | 'status' | 'retries' | 'createdAt'>): Promise<number> {
    try {
      // Attendre que l'initialisation soit terminée
      await this.waitForInit();
      
      if (!this.db) {
        this.db = await DatabaseService.getDatabase().catch(error => {
          logger.error('Erreur lors de la récupération de la base de données:', error);
          throw new Error('Base de données non disponible');
        });
      }
      
      if (!this.db) {
        throw new Error('Base de données non disponible');
      }
      
      const now = new Date().toISOString();
      const status = QueueItemStatus.PENDING;
      const retries = 0;
      
      // Valider les données d'entrée
      if (!item.endpoint) {
        throw new Error('Endpoint manquant dans l\'élément de file d\'attente');
      }
      if (!item.operation) {
        throw new Error('Type d\'opération manquant dans l\'élément de file d\'attente');
      }
      if (!item.tableName) {
        throw new Error('Nom de table manquant dans l\'élément de file d\'attente');
      }
      
      // Sérialiser les données avec validation
      let dataJson = '{}';
      try {
        dataJson = JSON.stringify(item.data || {});
      } catch (jsonError) {
        logger.error('Erreur lors de la sérialisation des données:', jsonError);
        dataJson = '{"error": "Données non sérialisables"}';
      }
      
      // Ajouter l'élément à la base de données avec un timeout
      const [result] = await Promise.race([
        DatabaseService.executeQuery(
          this.db,
          'INSERT INTO offline_queue (endpoint, operation, data, table_name, local_id, remote_id, status, retries, max_retries, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            item.endpoint,
            item.operation,
            dataJson,
            item.tableName,
            item.localId?.toString() || null,
            item.remoteId?.toString() || null,
            status,
            retries,
            item.maxRetries || 3,
            item.priority || 1,
            now
          ]
        ),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout lors de l\'ajout à la file d\'attente')), 
          DB_OPERATION_TIMEOUT)
        )
      ]);
      
      const id = result.insertId || 0;
      logger.debug(`Élément ajouté à la file d'attente avec l'ID ${id}`);
      
      // Si autoSync est activé et que nous sommes en ligne, traiter immédiatement la file d'attente
      if (this.autoSync) {
        try {
          const networkState = await NetInfo.fetch();
          if (networkState.isConnected) {
            // Utiliser setTimeout pour éviter de bloquer l'UI thread
            setTimeout(() => {
              this.processQueue().catch(error => {
                logger.error('Erreur lors du traitement automatique de la file d\'attente:', error);
              });
            }, 100);
          }
        } catch (networkError) {
          logger.warn('Erreur lors de la vérification de l\'état du réseau:', networkError);
        }
      }
      
      return id;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout à la file d\'attente:', error);
      // En cas d'erreur grave, renvoyer un ID invalide mais ne pas faire planter l'application
      return -1;
    }
  }

  /**
   * Wrapper around enqueue method to provide compatibility with existing code that uses addToQueue
   * @param options Options for the queue item
   * @returns ID of the enqueued item
   */
  public async addToQueue(options: {
    endpoint: string;
    method: string;
    data: any;
    priority?: number;
    tableName?: string;
  }): Promise<number> {
    const operation = this.mapMethodToOperation(options.method);
    
    return this.enqueue({
      endpoint: options.endpoint,
      operation,
      data: options.data,
      tableName: options.tableName || 'unknown_table',
      priority: options.priority || 1,
      maxRetries: 3
    });
  }
  
  /**
   * Maps HTTP method to QueueOperationType
   * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
   * @returns Corresponding QueueOperationType
   */
  private mapMethodToOperation(method: string): QueueOperationType {
    switch (method.toUpperCase()) {
      case 'POST':
        return QueueOperationType.CREATE;
      case 'PUT':
      case 'PATCH':
        return QueueOperationType.UPDATE;
      case 'DELETE':
        return QueueOperationType.DELETE;
      default:
        return QueueOperationType.CUSTOM;
    }
  }

  /**
   * Obtenir tous les éléments de la file d'attente avec timeouts
   * @param status (Optionnel) Filtrer par statut
   * @returns Liste des éléments en file d'attente
   */
  public async getQueue(status?: QueueItemStatus): Promise<QueueItem[]> {
    try {
      // Attendre que l'initialisation soit terminée
      await this.waitForInit();
      
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      if (!this.db) {
        return [];
      }
      
      let query = 'SELECT * FROM offline_queue';
      const params: any[] = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY priority DESC, created_at ASC';
      
      // Ajouter un timeout pour éviter les blocages
      const [result] = await Promise.race([
        DatabaseService.executeQuery(this.db, query, params),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout lors de la récupération de la file d\'attente')), 
          DB_OPERATION_TIMEOUT)
        )
      ]);
      
      const items: QueueItem[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        try {
          // Parser les données JSON avec protection contre les erreurs
          let parsedData = {};
          try {
            parsedData = JSON.parse(row.data);
          } catch (jsonError) {
            logger.warn(`Erreur lors du parsing des données pour l'élément ${row.id}:`, jsonError);
          }
          
          items.push({
            id: row.id,
            endpoint: row.endpoint,
            operation: row.operation as QueueOperationType,
            data: parsedData,
            tableName: row.table_name,
            localId: row.local_id,
            remoteId: row.remote_id,
            status: row.status as QueueItemStatus,
            retries: row.retries,
            maxRetries: row.max_retries,
            priority: row.priority,
            createdAt: row.created_at,
            lastAttemptAt: row.last_attempt_at,
            errorMessage: row.error_message,
            conflictResolution: row.conflict_resolution as 'LOCAL' | 'REMOTE' | 'MERGE' | 'ASK'
          });
        } catch (rowError) {
          logger.error(`Erreur lors du traitement de la ligne ${i}:`, rowError);
          // Continuer avec les éléments suivants
        }
      }
      
      return items;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la file d\'attente:', error);
      // En cas d'erreur, renvoyer un tableau vide pour éviter de faire planter l'application
      return [];
    }
  }

  /**
   * Traiter la file d'attente et synchroniser avec le backend avec une meilleure gestion d'erreur
   * @param forceAll Forcer le traitement de tous les éléments, y compris ceux en échec
   * @returns Nombre d'éléments traités avec succès
   */
  public async processQueue(forceAll = false): Promise<number> {
    // Attendre que l'initialisation soit terminée
    await this.waitForInit();
    
    // Éviter le traitement simultané
    if (this.isProcessing) {
      logger.debug('Traitement de la file d\'attente déjà en cours, ignoré');
      return 0;
    }
    
    // Vérifier la connectivité réseau avec gestion d'erreur
    try {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        logger.warn('Pas de connexion réseau, traitement de la file d\'attente reporté');
        return 0;
      }
    } catch (networkError) {
      logger.warn('Erreur lors de la vérification de l\'état du réseau:', networkError);
      return 0;
    }
    
    try {
      this.isProcessing = true;
      
      if (!this.db) {
        try {
          this.db = await DatabaseService.getDatabase();
        } catch (dbError) {
          logger.error('Erreur lors de l\'accès à la base de données:', dbError);
          return 0;
        }
      }
      
      if (!this.db) {
        logger.error('Base de données non disponible');
        return 0;
      }
      
      // Récupérer les éléments à traiter avec timeout
      let query = 'SELECT * FROM offline_queue WHERE status = ? OR status = ?';
      const params = [QueueItemStatus.PENDING, QueueItemStatus.FAILED];
      
      if (!forceAll) {
        query += ' AND retries < max_retries';
      }
      
      query += ' ORDER BY priority DESC, created_at ASC';
      
      const [result] = await Promise.race([
        DatabaseService.executeQuery(this.db, query, params),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout lors de la récupération des éléments de la file d\'attente')),
          DB_OPERATION_TIMEOUT)
        )
      ]);
      
      if (result.rows.length === 0) {
        logger.debug('Pas d\'éléments à traiter dans la file d\'attente');
        return 0;
      }
      
      logger.info(`Traitement de ${result.rows.length} élément(s) dans la file d\'attente`);
      
      let successCount = 0;
      
      for (let i = 0; i < result.rows.length; i++) {
        // Revérifier régulièrement la connectivité réseau
        if (i > 0 && i % 5 === 0) {
          try {
            const networkState = await NetInfo.fetch();
            if (!networkState.isConnected) {
              logger.warn('Connexion réseau perdue pendant le traitement de la file d\'attente');
              break;
            }
          } catch (networkCheckError) {
            logger.warn('Erreur lors de la vérification de l\'état du réseau:', networkCheckError);
          }
        }
        
        const item = result.rows.item(i);
        let queueItem: QueueItem;
        
        try {
          // Parser les données avec sécurité
          let parsedData = {};
          try {
            parsedData = JSON.parse(item.data);
          } catch (jsonError) {
            logger.warn(`Erreur lors du parsing des données pour l'élément ${item.id}:`, jsonError);
          }
          
          queueItem = {
            id: item.id,
            endpoint: item.endpoint,
            operation: item.operation as QueueOperationType,
            data: parsedData,
            tableName: item.table_name,
            localId: item.local_id,
            remoteId: item.remote_id,
            status: item.status as QueueItemStatus,
            retries: item.retries,
            maxRetries: item.max_retries,
            priority: item.priority,
            createdAt: item.created_at,
            lastAttemptAt: item.last_attempt_at,
            errorMessage: item.error_message,
            conflictResolution: item.conflict_resolution as 'LOCAL' | 'REMOTE' | 'MERGE' | 'ASK'
          };
        } catch (parseError) {
          logger.error(`Erreur lors du parsing de l'élément ${item.id}:`, parseError);
          continue;
        }
        
        try {
          // Marquer comme en cours de traitement
          await this.updateItemStatus(queueItem.id!, QueueItemStatus.PROCESSING, null);
          
          // Appeler l'API backend avec un timeout
          const apiResponse = await Promise.race([
            this.callApiEndpoint(queueItem),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout lors de l\'appel à l\'API')),
              API_OPERATION_TIMEOUT)
            )
          ]);
          
          // Mise à jour du statut en fonction de la réponse de l'API
          if (apiResponse.success) {
            await this.updateItemStatus(queueItem.id!, QueueItemStatus.COMPLETED, null, apiResponse.remoteId);
            successCount++;
          } else if (apiResponse.conflict) {
            await this.handleConflict(queueItem, apiResponse);
          } else {
            throw new Error(apiResponse.errorMessage || 'Erreur inconnue');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          logger.error(`Erreur lors du traitement de l'élément de file d'attente ${queueItem.id}:`, errorMessage);
          
          // Incrémenter le compteur de tentatives
          const newRetries = queueItem.retries + 1;
          const status = newRetries >= queueItem.maxRetries ? QueueItemStatus.FAILED : QueueItemStatus.PENDING;
          
          try {
            await this.updateItemStatus(queueItem.id!, status, errorMessage, null, newRetries);
          } catch (updateError) {
            logger.error(`Erreur lors de la mise à jour du statut de l'élément ${queueItem.id}:`, updateError);
          }
        }
      }
      
      logger.info(`Traitement de la file d'attente terminé: ${successCount}/${result.rows.length} opérations réussies`);
      
      return successCount;
    } catch (error) {
      logger.error('Erreur lors du traitement de la file d\'attente:', error);
      return 0;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Mettre à jour le statut d'un élément dans la file d'attente avec gestion des erreurs
   */
  private async updateItemStatus(
    id: number,
    status: QueueItemStatus,
    errorMessage: string | null = null,
    remoteId: string | null = null,
    retries: number | null = null
  ): Promise<void> {
    try {
      if (!this.db) {
        try {
          this.db = await DatabaseService.getDatabase();
        } catch (dbError) {
          logger.error('Erreur lors de l\'accès à la base de données:', dbError);
          return;
        }
      }
      
      if (!this.db) {
        logger.error('Base de données non disponible');
        return;
      }
      
      const now = new Date().toISOString();
      
      let query = 'UPDATE offline_queue SET status = ?, last_attempt_at = ?';
      const params: any[] = [status, now];
      
      if (errorMessage !== null) {
        query += ', error_message = ?';
        params.push(errorMessage);
      }
      
      if (remoteId !== null) {
        query += ', remote_id = ?';
        params.push(remoteId);
      }
      
      if (retries !== null) {
        query += ', retries = ?';
        params.push(retries);
      }
      
      query += ' WHERE id = ?';
      params.push(id);
      
      // Exécuter avec timeout
      await Promise.race([
        DatabaseService.executeQuery(this.db, query, params),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout lors de la mise à jour du statut')),
          DB_OPERATION_TIMEOUT)
        )
      ]);
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du statut de l'élément de file d'attente ${id}:`, error);
      // Ne pas propager l'erreur pour éviter de bloquer le processus de synchronisation
    }
  }

  /**
   * Appeler l'API backend pour traiter un élément de la file d'attente
   * @param item Élément à traiter
   * @returns Réponse de l'API
   */
  private async callApiEndpoint(item: QueueItem): Promise<{
    success: boolean;
    remoteId?: string;
    conflict?: boolean;
    errorMessage?: string;
    serverData?: any;
  }> {
    // Cette méthode devra être connectée à votre service API existant
    // C'est une implémentation temporaire qui devra être remplacée
    
    try {
      // Simuler un délai de réseau (à supprimer en production)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Implémentation réelle - à connecter avec votre API service
      // Par exemple:
      // const apiService = ApiService.getInstance();
      // switch (item.operation) {
      //   case QueueOperationType.CREATE:
      //     const createResponse = await apiService.post(item.endpoint, item.data);
      //     return { success: true, remoteId: createResponse.id };
      //   case QueueOperationType.UPDATE:
      //     await apiService.put(`${item.endpoint}/${item.remoteId}`, item.data);
      //     return { success: true };
      //   case QueueOperationType.DELETE:
      //     await apiService.delete(`${item.endpoint}/${item.remoteId}`);
      //     return { success: true };
      //   case QueueOperationType.CUSTOM:
      //     // Traitement personnalisé ici
      //     return { success: true };
      //   default:
      //     return { success: false, errorMessage: 'Type d\'opération non supporté' };
      // }
      
      // Pour l'instant, nous simulons une réponse réussie
      logger.debug(`Simulation d'appel API pour ${item.operation} sur ${item.endpoint}`);
      return {
        success: true,
        remoteId: item.remoteId ? String(item.remoteId) : `remote-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error(`Erreur lors de l'appel à l'API pour l'élément ${item.id}:`, errorMessage);
      return { success: false, errorMessage };
    }
  }

  /**
   * Gérer un conflit de synchronisation
   * @param item Élément en conflit
   * @param apiResponse Réponse de l'API avec les informations de conflit
   */
  private async handleConflict(item: QueueItem, apiResponse: { serverData?: any }): Promise<void> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      // Par défaut, marquer comme conflit
      await this.updateItemStatus(item.id!, QueueItemStatus.CONFLICT, 'Conflit détecté avec les données du serveur');
      
      // Stocker les données du serveur pour une résolution ultérieure
      if (apiResponse.serverData) {
        await DatabaseService.executeQuery(
          this.db,
          'INSERT INTO sync_conflicts (queue_item_id, local_data, server_data, created_at) VALUES (?, ?, ?, ?)',
          [item.id, JSON.stringify(item.data), JSON.stringify(apiResponse.serverData), new Date().toISOString()]
        );
      }
      
      // La résolution des conflits nécessitera probablement une intervention utilisateur
      // ou une stratégie de fusion automatique qui devra être implémentée séparément
    } catch (error) {
      logger.error(`Erreur lors du traitement d'un conflit pour l'élément ${item.id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer les éléments complétés de la file d'attente
   * @param olderThan Supprimer uniquement les éléments complétés plus vieux que cette date
   * @returns Nombre d'éléments supprimés
   */
  public async purgeCompletedItems(olderThan?: Date): Promise<number> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      let query = 'DELETE FROM offline_queue WHERE status = ?';
      const params: any[] = [QueueItemStatus.COMPLETED];
      
      if (olderThan) {
        query += ' AND created_at < ?';
        params.push(olderThan.toISOString());
      }
      
      const [result] = await DatabaseService.executeQuery(this.db, query, params);
      const deletedCount = result.rowsAffected || 0;
      
      logger.debug(`${deletedCount} élément(s) complété(s) supprimé(s) de la file d'attente`);
      
      return deletedCount;
    } catch (error) {
      logger.error('Erreur lors de la purge des éléments complétés:', error);
      throw error;
    }
  }

  /**
   * Activer ou désactiver la synchronisation automatique
   * @param enable true pour activer, false pour désactiver
   */
  public async setAutoSync(enable: boolean): Promise<void> {
    try {
      this.autoSync = enable;
      await AsyncStorage.setItem('offline_queue_auto_sync', enable ? 'true' : 'false');
      logger.debug(`Synchronisation automatique ${enable ? 'activée' : 'désactivée'}`);
      
      // Si on active la synchronisation automatique et qu'on est en ligne, traiter la file d'attente
      if (enable) {
        const networkState = await NetInfo.fetch();
        if (networkState.isConnected) {
          this.processQueue().catch(error => {
            logger.error('Erreur lors du traitement automatique de la file d\'attente:', error);
          });
        }
      }
    } catch (error) {
      logger.error('Erreur lors de la modification du paramètre de synchronisation automatique:', error);
      throw error;
    }
  }

  /**
   * Vérifier si la synchronisation automatique est activée
   * @returns true si la synchronisation automatique est activée
   */
  public isAutoSyncEnabled(): boolean {
    return this.autoSync;
  }

  /**
   * Obtenir le nombre d'éléments dans la file d'attente
   * @param status Filtrer par statut
   */
  public async getQueueCount(status?: QueueItemStatus): Promise<number> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      let query = 'SELECT COUNT(*) as count FROM offline_queue';
      const params: any[] = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      
      const [result] = await DatabaseService.executeQuery(this.db, query, params);
      return result.rows.item(0).count;
    } catch (error) {
      logger.error('Erreur lors du comptage des éléments de la file d\'attente:', error);
      throw error;
    }
  }
}

// Exporter une instance singleton du service
const offlineQueueService = OfflineQueueService.getInstance();
export default offlineQueueService;