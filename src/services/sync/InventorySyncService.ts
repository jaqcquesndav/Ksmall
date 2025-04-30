/**
 * Service de synchronisation pour l'inventaire
 * Gère la synchronisation des données d'inventaire entre SQLite local et le backend
 */

import * as SQLite from 'expo-sqlite';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../../config/constants';
import logger from '../../utils/logger';
import dbService from '../DatabaseService';
import offlineQueueService from '../OfflineQueueService';
import { BaseSyncService } from './BaseSyncService';
import { BusinessDomain, SyncPriority, SyncCheckpoint, AdvancedSyncOptions } from './SyncTypes';
import { SyncOptions } from './SyncService';

// Extend WebSQLDatabase type to include the executeSql method
declare module 'expo-sqlite' {
  interface WebSQLDatabase {
    executeSql(
      sqlStatement: string, 
      args?: any[]
    ): Promise<[{ rows: { length: number; item: (idx: number) => any; }; insertId?: number; rowsAffected?: number; }]>;
  }
}

class InventorySyncService implements BaseSyncService {
  private static instance: InventorySyncService;
  private db: SQLite.WebSQLDatabase | null = null;
  private lastSyncTimestamp: string | null = null;
  private _isSyncing: boolean = false;
  
  // Propriétés relatives au domaine métier
  private readonly businessDomain: BusinessDomain = BusinessDomain.INVENTORY;
  private readonly businessEntities: string[] = ['stock', 'movements', 'locations'];
  private readonly userFriendlyName: string = 'Inventaire';
  private readonly userFriendlyDescription: string = 'Synchronisation des données d\'inventaire, stocks et mouvements';
  private readonly syncPriority: SyncPriority = SyncPriority.MEDIUM;

  private constructor() {
    // Initialisation du service
    this.initializeDb();
  }

  /**
   * Obtenir l'instance singleton du service
   */
  public static getInstance(): InventorySyncService {
    if (!InventorySyncService.instance) {
      InventorySyncService.instance = new InventorySyncService();
    }
    return InventorySyncService.instance;
  }

  /**
   * Vérifier si une synchronisation est en cours
   */
  public get isSyncing(): boolean {
    return this._isSyncing;
  }

  /**
   * Initialiser la connexion à la base de données
   */
  private async initializeDb(): Promise<void> {
    try {
      this.db = await dbService.getDBConnection();
      
      // Vérifier si la table de configuration de synchronisation existe
      await this.ensureSyncConfigTableExists();
      
      // Récupérer le dernier timestamp de synchronisation
      await this.getLastSyncTimestamp();
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la base de données pour InventorySyncService:', error);
    }
  }

  // Méthodes d'interface BaseSyncService relatives au domaine métier

  /**
   * Obtenir le domaine métier auquel appartient ce service
   */
  public getBusinessDomain(): BusinessDomain {
    return this.businessDomain;
  }
  
  /**
   * Obtenir le nom des entités métier gérées par ce service
   */
  public getBusinessEntities(): string[] {
    return this.businessEntities;
  }
  
  /**
   * Obtenir un nom convivial pour l'utilisateur pour ce service de synchronisation
   */
  public getUserFriendlyName(): string {
    return this.userFriendlyName;
  }
  
  /**
   * Obtenir une description conviviale pour l'utilisateur pour ce service de synchronisation
   */
  public getUserFriendlyDescription(): string {
    return this.userFriendlyDescription;
  }
  
  /**
   * Vérifier si une entité spécifique est gérée par ce service
   */
  public handlesEntity(entityName: string): boolean {
    return this.businessEntities.includes(entityName);
  }
  
  /**
   * Obtenir la priorité de synchronisation pour ce service
   */
  public getPriority(): SyncPriority {
    return this.syncPriority;
  }

  /**
   * Sauvegarder l'état actuel de la synchronisation pour reprise ultérieure
   */
  public async saveCheckpoint(checkpoint: SyncCheckpoint): Promise<void> {
    try {
      // Sérialiser le checkpoint en JSON pour le stockage
      const checkpointData = JSON.stringify(checkpoint);
      
      if (!this.db) {
        this.db = await dbService.getDBConnection();
      }
      
      // Stocker le checkpoint dans la table de configuration
      await this.db?.executeSql(`
        INSERT OR REPLACE INTO sync_config (entity_name, last_sync_timestamp, checkpoint_data)
        VALUES ('inventory_checkpoint', ?, ?)
      `, [new Date().toISOString(), checkpointData]);
      
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du checkpoint pour l\'inventaire:', error);
    }
  }

  /**
   * Charger l'état de la dernière synchronisation pour reprise
   */
  public async loadCheckpoint(): Promise<SyncCheckpoint | null> {
    try {
      if (!this.db) {
        this.db = await dbService.getDBConnection();
      }
      
      // Récupérer le checkpoint depuis la table de configuration
      const [result] = await this.db?.executeSql(`
        SELECT checkpoint_data FROM sync_config WHERE entity_name = 'inventory_checkpoint'
      `);
      
      if (result.rows.length > 0 && result.rows.item(0).checkpoint_data) {
        return JSON.parse(result.rows.item(0).checkpoint_data);
      }
      
      return null;
    } catch (error) {
      logger.error('Erreur lors du chargement du checkpoint pour l\'inventaire:', error);
      return null;
    }
  }

  /**
   * Synchroniser un lot de données
   */
  public async synchronizeBatch(batchIndex: number, batchSize: number, checkpoint?: SyncCheckpoint): Promise<SyncCheckpoint> {
    const newCheckpoint: SyncCheckpoint = checkpoint || {
      batchIndex: 0,
      processedCount: 0,
      completed: false
    };
    
    try {
      // Récupérer un lot d'éléments d'inventaire non synchronisés
      const [result] = await this.db?.executeSql(`
        SELECT * FROM inventory_items 
        WHERE is_synced = 0 AND is_deleted = 0
        ORDER BY id
        LIMIT ? OFFSET ?
      `, [batchSize, batchIndex * batchSize]);
      
      const items = [];
      for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i));
      }
      
      // Si aucun élément à synchroniser, marquer comme terminé
      if (items.length === 0) {
        newCheckpoint.completed = true;
        return newCheckpoint;
      }
      
      // Synchroniser les éléments du lot
      for (const item of items) {
        try {
          // Appeler l'API pour envoyer l'élément au serveur
          if (!global.__DEMO_MODE__ && !global.__OFFLINE_MODE__) {
            await axios.post(`${API_BASE_URL}/api/inventory/${item.id}`, item);
            
            // Marquer l'élément comme synchronisé
            await this.db?.executeSql(
              'UPDATE inventory_items SET is_synced = 1 WHERE id = ?',
              [item.id]
            );
          } else {
            // En mode démo, simuler la synchronisation
            await this.db?.executeSql(
              'UPDATE inventory_items SET is_synced = 1 WHERE id = ?',
              [item.id]
            );
          }
          
          // Incrémenter le compteur d'éléments traités
          newCheckpoint.processedCount++;
        } catch (error) {
          logger.error(`Erreur lors de la synchronisation de l'élément d'inventaire ${item.id}:`, error);
          // Continuer avec le prochain élément
        }
      }
      
      // Mettre à jour l'index du lot pour le prochain appel
      newCheckpoint.batchIndex = batchIndex + 1;
      
      // Vérifier s'il reste des éléments à synchroniser
      const [countResult] = await this.db?.executeSql(
        'SELECT COUNT(*) as count FROM inventory_items WHERE is_synced = 0 AND is_deleted = 0'
      );
      
      if (countResult.rows.item(0).count === 0) {
        newCheckpoint.completed = true;
      }
      
      return newCheckpoint;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation par lots des éléments d\'inventaire:', error);
      throw error;
    }
  }

  /**
   * S'assurer que la table de configuration de synchronisation existe
   */
  private async ensureSyncConfigTableExists(): Promise<void> {
    if (!this.db) {
      await this.initializeDb();
    }
    
    try {
      await this.db?.executeSql(`
        CREATE TABLE IF NOT EXISTS sync_config (
          entity_name TEXT PRIMARY KEY,
          last_sync_timestamp TEXT,
          checkpoint_data TEXT
        );
      `);
    } catch (error) {
      logger.error('Erreur lors de la création de la table sync_config:', error);
    }
  }

  /**
   * Créer la structure de table locale si elle n'existe pas
   */
  public async ensureLocalStructure(): Promise<void> {
    if (!this.db) {
      await this.initializeDb();
    }
    
    try {
      // Créer la table d'inventaire si elle n'existe pas
      await this.db?.executeSql(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          server_id TEXT,
          product_id INTEGER NOT NULL,
          quantity REAL NOT NULL DEFAULT 0,
          location_id INTEGER,
          status TEXT,
          created_at TEXT,
          last_updated TEXT,
          is_synced INTEGER DEFAULT 0,
          is_deleted INTEGER DEFAULT 0
        );
      `);
      
      // Créer la table d'emplacements si elle n'existe pas
      await this.db?.executeSql(`
        CREATE TABLE IF NOT EXISTS inventory_locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          server_id TEXT,
          name TEXT NOT NULL,
          description TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT,
          is_synced INTEGER DEFAULT 0,
          is_deleted INTEGER DEFAULT 0
        );
      `);
      
      // Créer la table de mouvements d'inventaire si elle n'existe pas
      await this.db?.executeSql(`
        CREATE TABLE IF NOT EXISTS inventory_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          server_id TEXT,
          product_id INTEGER NOT NULL,
          from_location_id INTEGER,
          to_location_id INTEGER,
          quantity REAL NOT NULL,
          reason TEXT,
          reference TEXT,
          date TEXT,
          created_by TEXT,
          created_at TEXT,
          is_synced INTEGER DEFAULT 0
        );
      `);
      
      logger.debug('Structures des tables d\'inventaire créées ou vérifiées');
    } catch (error) {
      logger.error('Erreur lors de la création des tables d\'inventaire:', error);
      throw error;
    }
  }

  /**
   * Récupérer le dernier timestamp de synchronisation
   */
  private async getLastSyncTimestamp(): Promise<string | null> {
    if (!this.db) {
      await this.initializeDb();
    }

    try {
      const [result] = await this.db?.executeSql(`
        SELECT last_sync_timestamp FROM sync_config WHERE entity_name = 'inventory';
      `);

      if (result.rows.length > 0) {
        this.lastSyncTimestamp = result.rows.item(0).last_sync_timestamp;
      } else {
        // Insérer une entrée initiale si elle n'existe pas
        await this.db?.executeSql(`
          INSERT INTO sync_config (entity_name, last_sync_timestamp) VALUES ('inventory', NULL);
        `);
        this.lastSyncTimestamp = null;
      }

      return this.lastSyncTimestamp;
    } catch (error) {
      logger.error('Erreur lors de la récupération du timestamp de synchronisation de l\'inventaire:', error);
      return null;
    }
  }

  /**
   * Mettre à jour le timestamp de dernière synchronisation
   */
  private async updateLastSyncTimestamp(timestamp: string): Promise<void> {
    if (!this.db) {
      await this.initializeDb();
    }

    try {
      await this.db?.executeSql(`
        UPDATE sync_config SET last_sync_timestamp = ? WHERE entity_name = 'inventory';
      `, [timestamp]);
      
      this.lastSyncTimestamp = timestamp;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du timestamp de synchronisation de l\'inventaire:', error);
    }
  }

  /**
   * Synchroniser l'inventaire entre la base de données locale et le backend
   * @param forceFullSync Forcer une synchronisation complète, ignorant le timestamp
   * @param options Options additionnelles de synchronisation
   * @returns true si la synchronisation réussit, false sinon
   */
  public async synchronize(forceFullSync: boolean = false, options?: SyncOptions & AdvancedSyncOptions): Promise<boolean> {
    // Vérifier si une synchronisation est déjà en cours
    if (this._isSyncing) {
      logger.warn(`Une synchronisation de ${this.getUserFriendlyName()} est déjà en cours`);
      return false;
    }

    // Vérifier la connexion internet
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      logger.warn(`Pas de connexion internet, la synchronisation de ${this.getUserFriendlyName()} ne peut pas être effectuée`);
      return false;
    }

    if (!this.db) {
      await this.initializeDb();
    }

    this._isSyncing = true;
    logger.info(`Démarrage de la synchronisation de ${this.getUserFriendlyName()}`);

    try {
      // 1. D'abord, envoyer les modifications locales vers le backend
      await this.pushToServer(true, options);
      
      // 2. Récupérer les mises à jour du backend
      await this.pullFromServer(forceFullSync, undefined, options);
      
      // 3. Mettre à jour le timestamp de dernière synchronisation
      const currentTimestamp = new Date().toISOString();
      await this.updateLastSyncTimestamp(currentTimestamp);

      logger.info(`Synchronisation de ${this.getUserFriendlyName()} terminée avec succès`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la synchronisation de ${this.getUserFriendlyName()}:`, error);
      return false;
    } finally {
      this._isSyncing = false;
    }
  }

  /**
   * Envoyer les modifications locales non synchronisées vers le serveur
   */
  public async pushToServer(onlyModified: boolean = true, options?: AdvancedSyncOptions): Promise<number> {
    try {
      // Récupérer les modifications locales non synchronisées
      const [result] = await this.db?.executeSql(`
        SELECT * FROM inventory_items WHERE is_synced = 0 AND is_deleted = 0;
      `);

      if (result.rows.length === 0) {
        logger.debug(`Aucune modification locale de ${this.getUserFriendlyName()} à synchroniser`);
        return 0;
      }

      // Transformer les résultats en tableau d'objets
      const unsyncedItems = [];
      for (let i = 0; i < result.rows.length; i++) {
        unsyncedItems.push(result.rows.item(i));
      }

      // Envoyer les données au serveur par lots
      const batchSize = options?.batchSize || 50;
      let syncedCount = 0;
      
      for (let i = 0; i < unsyncedItems.length; i += batchSize) {
        const batch = unsyncedItems.slice(i, i + batchSize);
        
        try {
          if (!global.__DEMO_MODE__ && !global.__OFFLINE_MODE__) {
            await axios.post(`${API_BASE_URL}/api/inventory/batch-update`, { items: batch });
          }
          
          // Marquer les éléments comme synchronisés
          for (const item of batch) {
            await this.db?.executeSql(`
              UPDATE inventory_items SET is_synced = 1 WHERE id = ?;
            `, [item.id]);
            syncedCount++;
          }
        } catch (error) {
          // En cas d'erreur, ajouter à la file d'attente hors ligne pour réessayer plus tard
          offlineQueueService.addToQueue({
            endpoint: '/api/inventory/batch-update',
            method: 'POST',
            data: { items: batch },
            priority: 2 // priorité moyenne
          });
          throw error;
        }
      }

      logger.info(`${syncedCount} éléments d'inventaire synchronisés vers le serveur`);
      return syncedCount;
    } catch (error) {
      logger.error(`Erreur lors de l'envoi des modifications de ${this.getUserFriendlyName()} au serveur:`, error);
      throw error;
    }
  }

  /**
   * Récupérer les mises à jour du serveur et les appliquer localement
   */
  public async pullFromServer(forceFullSync: boolean = false, lastSyncTime?: Date, options?: AdvancedSyncOptions): Promise<number> {
    try {
      // Déterminer l'URL et les paramètres pour la requête
      let url = `${API_BASE_URL}/api/inventory`;
      let params: any = {};
      
      const syncTimestamp = lastSyncTime?.toISOString() || this.lastSyncTimestamp;
      if (!forceFullSync && syncTimestamp) {
        params.last_sync = syncTimestamp;
      }

      // Récupérer les données du serveur
      let serverItems: any[] = [];
      
      if (!global.__DEMO_MODE__ && !global.__OFFLINE_MODE__) {
        const response = await axios.get(url, { params });
        serverItems = response.data;
      } else {
        // En mode démo, utiliser des données fictives
        serverItems = [];
      }

      if (serverItems.length === 0) {
        logger.debug(`Aucune mise à jour de ${this.getUserFriendlyName()} à récupérer du serveur`);
        return 0;
      }

      // Commencer une transaction pour les mises à jour de la base de données
      await this.db?.executeSql('BEGIN TRANSACTION;');
      let updatedCount = 0;

      try {
        // Pour chaque élément d'inventaire du serveur
        for (const item of serverItems) {
          // Vérifier si l'élément existe déjà en local
          const [existingResult] = await this.db?.executeSql(
            'SELECT id FROM inventory_items WHERE server_id = ?;',
            [item.id]
          );

          if (existingResult.rows.length > 0) {
            // Mettre à jour l'élément existant
            await this.db?.executeSql(
              `UPDATE inventory_items SET 
               product_id = ?,
               quantity = ?,
               location_id = ?,
               status = ?,
               last_updated = ?,
               is_synced = 1
               WHERE server_id = ?;`,
              [
                item.product_id,
                item.quantity,
                item.location_id,
                item.status,
                item.updated_at,
                item.id
              ]
            );
          } else {
            // Insérer un nouvel élément
            await this.db?.executeSql(
              `INSERT INTO inventory_items 
               (server_id, product_id, quantity, location_id, status, created_at, last_updated, is_synced)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1);`,
              [
                item.id,
                item.product_id,
                item.quantity,
                item.location_id,
                item.status,
                item.created_at,
                item.updated_at
              ]
            );
          }
          updatedCount++;
        }

        // Valider la transaction
        await this.db?.executeSql('COMMIT;');
        logger.info(`${updatedCount} éléments d'inventaire mis à jour depuis le serveur`);
      } catch (error) {
        // Annuler la transaction en cas d'erreur
        await this.db?.executeSql('ROLLBACK;');
        throw error;
      }
      
      return updatedCount;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des mises à jour de ${this.getUserFriendlyName()} du serveur:`, error);
      throw error;
    }
  }

  /**
   * Résoudre un conflit entre les données locales et distantes
   */
  public async resolveConflict(localData: any, serverData: any, strategy: 'LOCAL' | 'REMOTE' | 'MERGE' | 'ASK'): Promise<any> {
    switch (strategy) {
      case 'LOCAL':
        return localData;
      case 'REMOTE':
        return serverData;
      case 'MERGE':
        // Logique pour fusionner les données locales et distantes
        return {
          ...serverData,
          quantity: localData.quantity > serverData.quantity ? localData.quantity : serverData.quantity,
          lastUpdated: new Date().toISOString()
        };
      case 'ASK':
        // En attendant une intervention de l'utilisateur, conserver les deux versions
        // Dans un cas réel, on pourrait émettre un événement pour demander à l'utilisateur
        return { localData, serverData, needsResolution: true };
      default:
        return serverData;
    }
  }

  /**
   * Mettre à jour un élément d'inventaire localement
   * @param item Élément d'inventaire à mettre à jour
   */
  public async updateInventoryItem(item: any): Promise<boolean> {
    if (!this.db) {
      await this.initializeDb();
    }

    try {
      // Déterminer si c'est une mise à jour ou une insertion
      const [existingResult] = await this.db?.executeSql(
        'SELECT id FROM inventory_items WHERE id = ? OR server_id = ?;',
        [item.id, item.server_id]
      );

      const now = new Date().toISOString();

      if (existingResult.rows.length > 0) {
        // Mettre à jour l'élément existant
        await this.db?.executeSql(
          `UPDATE inventory_items SET 
           product_id = ?,
           quantity = ?,
           location_id = ?,
           status = ?,
           last_updated = ?,
           is_synced = 0
           WHERE id = ?;`,
          [
            item.product_id,
            item.quantity,
            item.location_id,
            item.status,
            now,
            existingResult.rows.item(0).id
          ]
        );
      } else {
        // Insérer un nouvel élément
        await this.db?.executeSql(
          `INSERT INTO inventory_items 
           (server_id, product_id, quantity, location_id, status, created_at, last_updated, is_synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0);`,
          [
            item.server_id || null,
            item.product_id,
            item.quantity,
            item.location_id,
            item.status,
            now,
            now
          ]
        );
      }

      // Tenter de synchroniser immédiatement si la connexion internet est disponible
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && !this._isSyncing) {
        this.synchronize();
      }

      return true;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour d'un élément de ${this.getUserFriendlyName()}:`, error);
      return false;
    }
  }

  /**
   * Récupérer tous les éléments d'inventaire locaux
   */
  public async getAllInventoryItems(): Promise<any[]> {
    if (!this.db) {
      await this.initializeDb();
    }

    try {
      const [result] = await this.db?.executeSql(`
        SELECT * FROM inventory_items WHERE is_deleted = 0 ORDER BY last_updated DESC;
      `);

      const items = [];
      for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i));
      }

      return items;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des éléments de ${this.getUserFriendlyName()}:`, error);
      return [];
    }
  }

  /**
   * Récupérer un élément d'inventaire par son ID
   */
  public async getInventoryItemById(id: number | string): Promise<any | null> {
    if (!this.db) {
      await this.initializeDb();
    }

    try {
      const [result] = await this.db?.executeSql(`
        SELECT * FROM inventory_items WHERE (id = ? OR server_id = ?) AND is_deleted = 0;
      `, [id, id]);

      if (result.rows.length > 0) {
        return result.rows.item(0);
      }
      return null;
    } catch (error) {
      logger.error(`Erreur lors de la récupération d'un élément de ${this.getUserFriendlyName()}:`, error);
      return null;
    }
  }

  /**
   * Supprimer un élément d'inventaire
   */
  public async deleteInventoryItem(id: number | string): Promise<boolean> {
    if (!this.db) {
      await this.initializeDb();
    }

    try {
      // Récupérer l'élément pour avoir le server_id si disponible
      const item = await this.getInventoryItemById(id);
      if (!item) {
        return false;
      }

      // Si l'élément a un server_id, marquer comme supprimé au lieu de le supprimer
      if (item.server_id) {
        await this.db?.executeSql(`
          UPDATE inventory_items SET is_deleted = 1, is_synced = 0 WHERE id = ?;
        `, [item.id]);
        
        // Ajouter à la file d'attente hors ligne
        offlineQueueService.addToQueue({
          endpoint: `/api/inventory/${item.server_id}`,
          method: 'DELETE',
          data: {},
          priority: 2
        });
      } else {
        // Si pas encore synchronisé avec le serveur, supprimer directement
        await this.db?.executeSql(`
          DELETE FROM inventory_items WHERE id = ?;
        `, [item.id]);
      }

      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression d'un élément de ${this.getUserFriendlyName()}:`, error);
      return false;
    }
  }
}

// Exporter une instance singleton du service
const inventorySyncService = InventorySyncService.getInstance();
export default inventorySyncService;