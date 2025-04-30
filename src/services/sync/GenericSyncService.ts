import * as SQLite from 'expo-sqlite';
// Correction de l'importation pour ISyncService
import type { ISyncService } from './ISyncService';
// Définition locale de SyncPriority si nécessaire
export enum SyncPriority {
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low'
}
// Définition du type SyncCheckpoint
export interface SyncCheckpoint {
  lastSyncTime: Date | null;
  entityType: string;
  status: 'pending' | 'completed' | 'failed';
}
// Type pour les options de synchronisation avancées
export interface AdvancedSyncOptions {
  force?: boolean;
  silent?: boolean;
  [key: string]: any;
}

import DatabaseService from '../DatabaseService';
import ApiService from '../ApiService';
import logger from '../../utils/logger';

// Implémentation temporaire de NetInfoService jusqu'à ce qu'il soit correctement défini
const NetInfoService = {
  isConnected: async (): Promise<boolean> => {
    // Implémenter la logique de vérification de la connexion ici
    return true; 
  }
};

// Implémentation temporaire de OfflineQueueService jusqu'à ce qu'il soit correctement défini
const OfflineQueueService = {
  addToQueue: async (item: any): Promise<void> => {
    // Implémenter la logique de mise en file d'attente ici
    logger.debug('Élément ajouté à la file d\'attente hors ligne', item);
  }
};

/**
 * Service de synchronisation générique qui peut être étendu par des services spécifiques
 */
export abstract class GenericSyncService implements ISyncService {
  protected db: SQLite.WebSQLDatabase | null = null;
  protected tableName: string;
  protected apiEndpoint: string;
  protected primaryKey: string;
  protected lastSyncTimestamp: Date | null = null;
  protected syncInProgress: boolean = false;
  protected autoSync: boolean = true;

  /**
   * Initialise le service de synchronisation générique
   * 
   * @param tableName - Nom de la table SQLite locale
   * @param apiEndpoint - Point de terminaison API pour la synchronisation
   * @param primaryKey - Clé primaire utilisée côté serveur (généralement 'id')
   */
  constructor(tableName: string, apiEndpoint: string, primaryKey: string = 'id') {
    this.tableName = tableName;
    this.apiEndpoint = apiEndpoint;
    this.primaryKey = primaryKey;
  }

  /**
   * Assure que la structure locale existe
   * Cette méthode doit être implémentée par les classes enfants
   */
  public abstract ensureLocalStructure(): Promise<void>;

  /**
   * Synchronisation complète - tire et pousse les données
   */
  public async sync(): Promise<boolean> {
    try {
      if (this.syncInProgress) {
        logger.debug(`Synchronisation déjà en cours pour ${this.tableName}`);
        return false;
      }

      this.syncInProgress = true;
      logger.debug(`Démarrage de la synchronisation pour ${this.tableName}`);

      // Vérifier la connexion réseau
      const isConnected = await NetInfoService.isConnected();
      if (!isConnected) {
        logger.debug(`Pas de connexion réseau, synchronisation de ${this.tableName} reportée`);
        this.syncInProgress = false;
        return false;
      }

      // S'assurer que la structure locale existe
      await this.ensureLocalStructure();

      // Pousser d'abord les modifications locales
      const pushSuccess = await this.pushToServer();
      
      // Puis tirer les nouvelles données du serveur
      const pullSuccess = await this.pullFromServer();

      this.lastSyncTimestamp = new Date();
      this.syncInProgress = false;

      logger.debug(`Synchronisation de ${this.tableName} terminée. Push: ${pushSuccess}, Pull: ${pullSuccess}`);
      return pushSuccess && pullSuccess;
    } catch (error) {
      logger.error(`Erreur lors de la synchronisation de ${this.tableName}:`, error);
      this.syncInProgress = false;
      return false;
    }
  }

  /**
   * Tirer les données depuis le serveur
   */
  public async pullFromServer(): Promise<boolean> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }

      // Obtenir le timestamp de la dernière synchronisation
      let lastSyncDate: string | null = null;
      if (this.lastSyncTimestamp) {
        lastSyncDate = this.lastSyncTimestamp.toISOString();
      } else {
        // Récupérer le dernier timestamp de synchronisation depuis la base de données
        const [result] = await DatabaseService.executeQuery(
          this.db, 
          `SELECT MAX(last_sync) as last_sync FROM ${this.tableName}`,
          []
        );
        
        if (result.rows.length > 0 && result.rows.item(0).last_sync) {
          lastSyncDate = result.rows.item(0).last_sync;
        }
      }

      // Construire le paramètre de requête pour obtenir uniquement les données modifiées après la dernière synchronisation
      let endpoint = this.apiEndpoint;
      if (lastSyncDate) {
        endpoint += `?updated_after=${encodeURIComponent(lastSyncDate)}`;
      }

      // Récupérer les données du serveur
      const response = await ApiService.get(endpoint);
      
      if (!response || !response.data) {
        logger.warn(`Réponse vide ou invalide de ${endpoint}`);
        return false;
      }

      const items = Array.isArray(response.data) ? response.data : 
                     (response.data.items || response.data.results || []);

      if (items.length === 0) {
        logger.debug(`Aucun nouvel élément à synchroniser depuis ${endpoint}`);
        return true;
      }

      logger.debug(`${items.length} éléments récupérés depuis ${endpoint}`);

      // Traitement par lots pour éviter les problèmes de mémoire
      const batchSize = 50;
      let processed = 0;

      while (processed < items.length) {
        const batch = items.slice(processed, processed + batchSize);
        await this.processPullBatch(batch);
        processed += batch.length;
      }

      return true;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données depuis ${this.apiEndpoint}:`, error);
      return false;
    }
  }

  /**
   * Traiter un lot d'éléments récupérés du serveur
   * Correction pour utiliser la méthode locale withTransaction au lieu de DatabaseService.withTransaction
   */
  protected async processPullBatch(items: any[]): Promise<void> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }

      await this.withTransaction(this.db, (tx) => {
        for (const item of items) {
          // Vérifier si l'élément existe déjà localement
          tx.executeSql(
            `SELECT id, is_dirty FROM ${this.tableName} WHERE remote_id = ?`,
            [item[this.primaryKey]],
            (_, result) => {
              if (result.rows.length > 0) {
                const localItem = result.rows.item(0);
                
                // Si l'élément local est marqué comme "dirty", c'est qu'il a des modifications
                // qui n'ont pas encore été synchronisées. Dans ce cas, ne pas écraser.
                if (localItem.is_dirty !== 1) {
                  this.updateItem(tx, item);
                } else {
                  logger.debug(`Élément ${item[this.primaryKey]} est dirty, conservation des modifications locales`);
                }
              } else {
                this.insertItem(tx, item);
              }
            },
            (_, error) => {
              logger.error(`Erreur lors de la vérification de l'existence de l'élément ${item[this.primaryKey]}:`, error);
              return true; // Continuer malgré l'erreur
            }
          );
        }
      });
    } catch (error) {
      logger.error(`Erreur lors du traitement du lot de synchronisation:`, error);
      throw error;
    }
  }

  /**
   * Insérer un nouvel élément dans la base de données locale
   * Cette méthode doit être implémentée par les classes enfants
   */
  protected abstract insertItem(tx: SQLite.SQLTransaction, item: any): void;

  /**
   * Mettre à jour un élément existant dans la base de données locale
   * Cette méthode doit être implémentée par les classes enfants
   */
  protected abstract updateItem(tx: SQLite.SQLTransaction, item: any): void;

  /**
   * Pousser les modifications locales vers le serveur
   */
  public async pushToServer(immediate: boolean = false): Promise<boolean> {
    try {
      // Si ce n'est pas une synchronisation immédiate et qu'il n'y a pas de connexion, 
      // mettre les modifications en file d'attente pour plus tard
      const isConnected = await NetInfoService.isConnected();
      if (!isConnected && !immediate) {
        logger.debug(`Pas de connexion réseau, les modifications de ${this.tableName} seront mises en file d'attente`);
        await this.queueLocalChanges();
        return false;
      }

      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }

      // Obtenir tous les éléments modifiés localement (is_dirty = 1)
      const [result] = await DatabaseService.executeQuery(
        this.db,
        `SELECT * FROM ${this.tableName} WHERE is_dirty = 1`,
        []
      );

      if (result.rows.length === 0) {
        logger.debug(`Aucune modification locale à pousser pour ${this.tableName}`);
        return true;
      }

      logger.debug(`${result.rows.length} modifications locales à pousser pour ${this.tableName}`);

      const items = [];
      for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i));
      }

      // Traitement par lots pour éviter les problèmes de mémoire
      const batchSize = 20;
      let processed = 0;
      let allSuccess = true;

      while (processed < items.length) {
        const batch = items.slice(processed, processed + batchSize);
        const batchSuccess = await this.processPushBatch(batch);
        if (!batchSuccess) allSuccess = false;
        processed += batch.length;
      }

      return allSuccess;
    } catch (error) {
      logger.error(`Erreur lors de la poussée des modifications locales pour ${this.tableName}:`, error);
      return false;
    }
  }

  /**
   * Traiter un lot d'éléments à pousser vers le serveur
   */
  protected async processPushBatch(items: any[]): Promise<boolean> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }

      let allSuccess = true;

      for (const item of items) {
        try {
          // Préparer les données pour l'API
          const apiData = this.prepareDataForSync(item);
          
          let response;
          
          // Si créé localement, faire un POST, sinon un PUT
          if (item.created_locally === 1) {
            response = await ApiService.post(this.apiEndpoint, apiData);
          } else {
            const endpoint = `${this.apiEndpoint}/${apiData.id || item.remote_id}`;
            response = await ApiService.put(endpoint, apiData);
          }
          
          if (response && response.data) {
            // Mise à jour du statut de synchronisation
            await DatabaseService.executeQuery(
              this.db,
              `UPDATE ${this.tableName} SET 
               is_dirty = 0, 
               remote_id = ?, 
               created_locally = 0, 
               last_sync = ?, 
               sync_status = 'synced' 
               WHERE id = ?`,
              [
                response.data.id || item.remote_id,
                new Date().toISOString(),
                item.id
              ]
            );
          } else {
            logger.warn(`Réponse invalide lors de la synchronisation de l'élément ${item.id}`);
            allSuccess = false;
          }
        } catch (error) {
          logger.error(`Erreur lors de la synchronisation de l'élément ${item.id}:`, error);
          allSuccess = false;
          
          // Mettre à jour le statut de synchronisation
          await DatabaseService.executeQuery(
            this.db,
            `UPDATE ${this.tableName} SET sync_status = 'error' WHERE id = ?`,
            [item.id]
          );
          
          // Ajouter à la file d'attente hors ligne pour réessayer plus tard
          await OfflineQueueService.addToQueue({
            tableName: this.tableName,
            recordId: item.id,
            action: item.created_locally === 1 ? 'create' : 'update',
            data: this.prepareDataForSync(item)
          });
        }
      }
      
      return allSuccess;
    } catch (error) {
      logger.error(`Erreur lors du traitement du lot de synchronisation:`, error);
      return false;
    }
  }

  /**
   * Préparer les données pour la synchronisation
   * Cette méthode doit être implémentée par les classes enfants
   */
  protected abstract prepareDataForSync(item: any): any;

  /**
   * Mettre les modifications locales en file d'attente pour synchronisation ultérieure
   */
  protected async queueLocalChanges(): Promise<void> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }

      // Obtenir tous les éléments modifiés localement
      const [result] = await DatabaseService.executeQuery(
        this.db,
        `SELECT * FROM ${this.tableName} WHERE is_dirty = 1`,
        []
      );

      if (result.rows.length === 0) {
        return;
      }

      for (let i = 0; i < result.rows.length; i++) {
        const item = result.rows.item(i);
        const action = item.created_locally === 1 ? 'create' : 'update';
        
        await OfflineQueueService.addToQueue({
          tableName: this.tableName,
          recordId: item.id,
          action: action,
          data: this.prepareDataForSync(item)
        });
      }

      logger.debug(`${result.rows.length} éléments de ${this.tableName} mis en file d'attente pour synchronisation`);
    } catch (error) {
      logger.error(`Erreur lors de la mise en file d'attente des modifications locales:`, error);
      throw error;
    }
  }

  /**
   * Obtenir tous les éléments de la table
   */
  public async getAll(options: { limit?: number, offset?: number, where?: string, params?: any[] } = {}): Promise<any[]> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }

      let query = `SELECT * FROM ${this.tableName}`;
      const params: any[] = [];
      
      if (options.where) {
        query += ` WHERE ${options.where}`;
        if (options.params) {
          params.push(...options.params);
        }
      }
      
      if (options.limit) {
        query += ` LIMIT ?`;
        params.push(options.limit);
        
        if (options.offset) {
          query += ` OFFSET ?`;
          params.push(options.offset);
        }
      }
      
      const [result] = await DatabaseService.executeQuery(this.db, query, params);
      
      const items = [];
      for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i));
      }
      
      return items;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des éléments dans ${this.tableName}:`, error);
      throw error;
    }
  }
  
  /**
   * Définir le mode de synchronisation automatique
   */
  public setAutoSync(enable: boolean): void {
    this.autoSync = enable;
  }
  
  /**
   * Vérifier si le mode de synchronisation automatique est activé
   */
  public isAutoSyncEnabled(): boolean {
    return this.autoSync;
  }
  
  /**
   * Obtenir la date de dernière synchronisation
   */
  public getLastSyncTime(): Date | null {
    return this.lastSyncTimestamp;
  }
  
  /**
   * Vérifier si une synchronisation est en cours
   */
  public isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Synchronize data between local database and remote server
   * Implementation of ISyncService interface
   */
  public async synchronize(forceFullSync?: boolean, options?: AdvancedSyncOptions): Promise<boolean> {
    // Par défaut, on utilise la méthode sync existante
    return this.sync();
  }
  
  /**
   * Get resource name for this sync service
   */
  public getResourceName(): string {
    return this.tableName;
  }
  
  /**
   * Get priority for this sync service
   */
  public getPriority(): SyncPriority {
    return SyncPriority.NORMAL;
  }
  
  /**
   * Load checkpoint for sync service
   */
  public async loadCheckpoint(): Promise<SyncCheckpoint | null> {
    // Implémenter la logique de chargement du point de contrôle
    return {
      lastSyncTime: this.lastSyncTimestamp,
      entityType: this.tableName,
      status: 'completed'
    };
  }
  
  /**
   * Save checkpoint for sync service
   */
  public async saveCheckpoint(checkpoint: SyncCheckpoint): Promise<void> {
    // Implémenter la logique de sauvegarde du point de contrôle
    if (checkpoint.lastSyncTime) {
      this.lastSyncTimestamp = checkpoint.lastSyncTime;
    }
  }
  
  /**
   * Initialize the sync service
   */
  public async initialize(): Promise<void> {
    // Initialisation par défaut
    this.db = await DatabaseService.getDatabase();
    await this.ensureLocalStructure();
  }
  
  /**
   * Check if data is synced with server
   */
  public async isDataSynced(entityType: string, entityId: string): Promise<boolean> {
    // Implémenter la vérification du statut de synchronisation
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      const [result] = await DatabaseService.executeQuery(
        this.db,
        `SELECT sync_status FROM ${this.tableName} WHERE id = ? OR remote_id = ?`,
        [entityId, entityId]
      );
      
      if (result.rows.length > 0) {
        return result.rows.item(0).sync_status === 'synced';
      }
      
      return false;
    } catch (error) {
      logger.error(`Erreur lors de la vérification du statut de synchronisation:`, error);
      return false;
    }
  }
  
  /**
   * Get local data with sync status
   */
  public async getLocalDataWithSyncStatus<T>(entityType: string, query?: any): Promise<Array<T & { isSynced: boolean }>> {
    // Implémenter la logique pour obtenir les données avec leur statut de synchronisation
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      let sqlQuery = `SELECT *, (sync_status = 'synced') as isSynced FROM ${this.tableName}`;
      const params: any[] = [];
      
      if (query && query.where) {
        sqlQuery += ` WHERE ${query.where}`;
        if (query.params) {
          params.push(...query.params);
        }
      }
      
      const [result] = await DatabaseService.executeQuery(this.db, sqlQuery, params);
      
      const items: Array<T & { isSynced: boolean }> = [];
      for (let i = 0; i < result.rows.length; i++) {
        const item = result.rows.item(i);
        items.push({
          ...item as T,
          isSynced: item.isSynced === 1
        });
      }
      
      return items;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données avec statut:`, error);
      return [];
    }
  }
  
  /**
   * Perform local operation to be synchronized later
   */
  public async performLocalOperation(
    entityType: string,
    operation: 'create' | 'update' | 'delete',
    data: any,
    priority?: number
  ): Promise<{ success: boolean; localId: string; error?: string }> {
    // Implémenter la logique pour effectuer une opération locale
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      let localId = '';
      let success = false;
      
      // Temporaire : cette méthode devrait être implémentée différemment selon l'opération
      if (operation === 'create' || operation === 'update') {
        // Logique d'insertion/mise à jour à implémenter selon les besoins spécifiques
        localId = data.id || '';
        success = true;
      }
      
      return { success, localId };
    } catch (error: any) {
      logger.error(`Erreur lors de l'opération locale:`, error);
      return { success: false, localId: '', error: error.message };
    }
  }
  
  /**
   * Check connection to server
   */
  public async isConnectedToServer(): Promise<boolean> {
    return NetInfoService.isConnected();
  }
  
  /**
   * Extension de la fonctionnalité DatabaseService.withTransaction, utilisée en remplacement
   * de DatabaseService.withTransaction qui n'existe pas encore
   */
  protected async withTransaction(db: SQLite.WebSQLDatabase, callback: (tx: SQLite.SQLTransaction) => void): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      db.transaction(
        tx => {
          try {
            callback(tx);
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        error => reject(error),
        () => resolve()
      );
    });
  }
}