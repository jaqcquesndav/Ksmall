import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import DatabaseService from './DatabaseService';
import logger from '../utils/logger';
import ApiService from './ApiService';

// Types d'opérations pour la synchronisation
export enum SyncOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

// Interface pour les opérations de synchronisation
interface SyncOperation {
  id: number;
  operation_type: SyncOperationType;
  table_name: string;
  api_endpoint: string;
  payload: string; // JSON stringified
  created_at: string;
}

class SyncService {
  private static instance: SyncService;
  private db: SQLite.WebSQLDatabase | null = null;
  private initialized: boolean = false;
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private syncRetryTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  /**
   * Obtenir l'instance singleton du service de synchronisation
   */
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Initialiser le service de synchronisation
   */
  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await DatabaseService.getDatabase();
      await this.setupTables();
      this.setupNetworkListener();
      this.setupAutoSync();
      this.initialized = true;
      logger.debug('Service de synchronisation initialisé avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du service de synchronisation:', error);
      throw error;
    }
  }

  /**
   * Configuration des tables nécessaires pour la synchronisation
   */
  private async setupTables(): Promise<void> {
    if (!this.db) return;

    // Table pour stocker les opérations de synchronisation en attente
    await DatabaseService.createTableIfNotExists(
      this.db,
      'sync_operations',
      `id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT NOT NULL,
      table_name TEXT NOT NULL,
      api_endpoint TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    );

    // Table pour suivre l'état de synchronisation de chaque table
    await DatabaseService.createTableIfNotExists(
      this.db,
      'sync_status',
      `table_name TEXT PRIMARY KEY,
      last_synced TIMESTAMP,
      is_synced INTEGER DEFAULT 0`
    );

    // Ajouter des colonnes de synchronisation aux tables existantes si nécessaire
    // Cette méthode sera appelée pour chaque table qui nécessite un suivi de synchronisation
    // Nous le ferons dans les services spécifiques lors de leur initialisation
  }

  /**
   * Configuration de l'écouteur de réseau
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // Si nous venons de passer en ligne, déclencher une synchronisation
      if (!wasOnline && this.isOnline) {
        logger.info('Connexion réseau rétablie, démarrage de la synchronisation');
        this.syncWithBackend()
          .then(() => logger.info('Synchronisation automatique terminée après reconnexion'))
          .catch(error => logger.error('Erreur de synchronisation après reconnexion:', error));
      }
    });

    // Vérifier l'état initial de la connexion
    NetInfo.fetch().then(state => {
      this.isOnline = state.isConnected ?? false;
      logger.debug(`État initial de la connexion: ${this.isOnline ? 'En ligne' : 'Hors ligne'}`);
    });
  }

  /**
   * Configuration de la synchronisation automatique
   */
  private setupAutoSync(): void {
    // Synchronisation périodique (toutes les 15 minutes)
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        logger.debug('Démarrage de la synchronisation périodique');
        this.syncWithBackend().catch(error => 
          logger.error('Erreur lors de la synchronisation périodique:', error)
        );
      }
    }, 15 * 60 * 1000); // 15 minutes
  }

  /**
   * Effectuer une opération locale et l'enregistrer pour synchronisation
   */
  public static async performLocalOperation<T>(
    operationType: SyncOperationType,
    tableName: string,
    apiEndpoint: string,
    data: T,
    sqlQuery: string,
    params: any[]
  ): Promise<SQLite.SQLResultSet> {
    const syncService = SyncService.getInstance();
    await syncService.init();

    if (!syncService.db) {
      throw new Error('Base de données non initialisée');
    }

    try {
      // Exécuter l'opération locale
      const [resultSet, success] = await DatabaseService.executeQuery(syncService.db, sqlQuery, params);

      if (!success) {
        throw new Error(`Operation failed on table ${tableName}`);
      }

      // Enregistrer l'opération pour la synchronisation future
      if (syncService.isOnline) {
        // Si en ligne, essayer de synchroniser immédiatement
        try {
          await syncService.sendOperationToBackend(operationType, apiEndpoint, data);
          // Mise à jour du statut de synchronisation pour cette table
          await syncService.updateTableSyncStatus(tableName, true);
        } catch (error) {
          // En cas d'échec, stocker pour synchronisation future
          logger.warn(`Échec de synchronisation immédiate pour ${tableName}. Mise en file d'attente pour plus tard.`, error);
          await syncService.queueSyncOperation(operationType, tableName, apiEndpoint, data);
        }
      } else {
        // Si hors ligne, mettre en file d'attente pour synchronisation future
        await syncService.queueSyncOperation(operationType, tableName, apiEndpoint, data);
        // Marquer la table comme non synchronisée
        await syncService.updateTableSyncStatus(tableName, false);
      }

      return resultSet;
    } catch (error) {
      logger.error(`Erreur lors de l'opération locale sur la table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Ajouter une opération à la file d'attente de synchronisation
   */
  private async queueSyncOperation<T>(
    operationType: SyncOperationType,
    tableName: string,
    apiEndpoint: string,
    data: T
  ): Promise<void> {
    if (!this.db) return;

    try {
      await DatabaseService.executeQuery(
        this.db,
        `INSERT INTO sync_operations 
        (operation_type, table_name, api_endpoint, payload) 
        VALUES (?, ?, ?, ?)`,
        [operationType, tableName, apiEndpoint, JSON.stringify(data)]
      );
      
      logger.debug(`Opération ${operationType} sur ${tableName} mise en file d'attente`);
    } catch (error) {
      logger.error(`Erreur lors de la mise en file d'attente de l'opération ${operationType} sur ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Envoyer une opération au backend
   */
  private async sendOperationToBackend<T>(
    operationType: SyncOperationType,
    apiEndpoint: string,
    data: T
  ): Promise<any> {
    try {
      let response;
      switch (operationType) {
        case SyncOperationType.CREATE:
          response = await ApiService.post(apiEndpoint, data);
          break;
        case SyncOperationType.UPDATE:
          response = await ApiService.put(apiEndpoint, data);
          break;
        case SyncOperationType.DELETE:
          response = await ApiService.delete(apiEndpoint);
          break;
        default:
          throw new Error(`Type d'opération non pris en charge: ${operationType}`);
      }
      return response;
    } catch (error) {
      logger.error(`Erreur lors de l'envoi de l'opération ${operationType} à ${apiEndpoint}:`, error);
      throw error;
    }
  }

  /**
   * Synchroniser toutes les opérations en attente avec le backend
   */
  public async syncWithBackend(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    logger.info('Démarrage de la synchronisation avec le backend');

    try {
      if (!this.db) {
        await this.init();
        if (!this.db) throw new Error('La base de données n\'a pas pu être initialisée');
      }

      // Récupérer toutes les opérations en attente
      const [resultSet, success] = await DatabaseService.executeQuery(
        this.db,
        'SELECT * FROM sync_operations ORDER BY created_at ASC'
      );

      if (!success) {
        logger.error('Échec de la récupération des opérations en attente');
        this.syncInProgress = false;
        return;
      }

      const { rows } = resultSet;

      if (rows.length === 0) {
        logger.debug('Aucune opération en attente à synchroniser');
        this.syncInProgress = false;
        return;
      }

      logger.info(`${rows.length} opérations en attente à synchroniser`);

      // Parcourir et traiter chaque opération
      const tablesUpdated = new Set<string>();
      
      for (let i = 0; i < rows.length; i++) {
        const op = rows.item(i) as SyncOperation;
        
        try {
          const payload = JSON.parse(op.payload);
          await this.sendOperationToBackend(
            op.operation_type as SyncOperationType,
            op.api_endpoint,
            payload
          );
          
          // Supprimer l'opération après synchronisation réussie
          await DatabaseService.executeQuery(
            this.db,
            'DELETE FROM sync_operations WHERE id = ?',
            [op.id]
          );
          
          tablesUpdated.add(op.table_name);
          logger.debug(`Opération #${op.id} synchronisée avec succès`);
        } catch (error) {
          logger.error(`Échec de la synchronisation pour l'opération #${op.id}:`, error);
          // Continuer avec les autres opérations
          continue;
        }
      }
      
      // Mettre à jour le statut de synchronisation pour toutes les tables modifiées
      for (const tableName of tablesUpdated) {
        await this.updateTableSyncStatus(tableName, true);
      }
      
      logger.info('Synchronisation terminée');
    } catch (error) {
      logger.error('Erreur lors de la synchronisation avec le backend:', error);
      
      // Planifier une nouvelle tentative
      if (this.syncRetryTimeout) {
        clearTimeout(this.syncRetryTimeout);
      }
      
      this.syncRetryTimeout = setTimeout(() => {
        logger.debug('Nouvelle tentative de synchronisation planifiée');
        this.syncInProgress = false;
        this.syncWithBackend().catch(e => 
          logger.error('Échec de la nouvelle tentative de synchronisation:', e)
        );
      }, 60 * 1000); // Réessayer après 1 minute
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Mettre à jour le statut de synchronisation d'une table
   */
  private async updateTableSyncStatus(tableName: string, isSynced: boolean): Promise<void> {
    if (!this.db) return;

    try {
      // Vérifier si la table a déjà une entrée dans sync_status
      const [resultSet, success] = await DatabaseService.executeQuery(
        this.db,
        'SELECT * FROM sync_status WHERE table_name = ?',
        [tableName]
      );

      if (!success) {
        logger.error(`Échec de la vérification du statut pour ${tableName}`);
        return;
      }

      const { rows } = resultSet;

      if (rows.length === 0) {
        // Insérer une nouvelle entrée
        await DatabaseService.executeQuery(
          this.db,
          'INSERT INTO sync_status (table_name, last_synced, is_synced) VALUES (?, CURRENT_TIMESTAMP, ?)',
          [tableName, isSynced ? 1 : 0]
        );
      } else {
        // Mettre à jour l'entrée existante
        await DatabaseService.executeQuery(
          this.db,
          'UPDATE sync_status SET last_synced = CURRENT_TIMESTAMP, is_synced = ? WHERE table_name = ?',
          [isSynced ? 1 : 0, tableName]
        );
      }
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du statut de synchronisation pour ${tableName}:`, error);
    }
  }

  /**
   * Vérifier si une table est synchronisée
   */
  public static async isDataSynced(tableName: string): Promise<boolean> {
    const syncService = SyncService.getInstance();
    await syncService.init();

    if (!syncService.db) return false;

    try {
      // Vérifier dans la table sync_status
      const [resultSet, success] = await DatabaseService.executeQuery(
        syncService.db,
        'SELECT is_synced FROM sync_status WHERE table_name = ?',
        [tableName]
      );

      if (!success) {
        logger.error(`Échec de la vérification du statut de synchronisation pour ${tableName}`);
        return false;
      }

      const { rows } = resultSet;

      if (rows.length === 0) {
        return false; // Pas d'entrée = pas synchronisé
      }

      return rows.item(0).is_synced === 1;
    } catch (error) {
      logger.error(`Erreur lors de la vérification du statut de synchronisation pour ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Obtenir les données locales avec leur statut de synchronisation
   */
  public static async getLocalDataWithSyncStatus<T>(
    tableName: string, 
    query: string, 
    params: any[] = []
  ): Promise<(T & {_syncStatus?: string, _lastSynced?: string | null})[]> {
    const syncService = SyncService.getInstance();
    await syncService.init();

    if (!syncService.db) throw new Error('Base de données non initialisée');

    try {
      // Exécuter la requête pour obtenir les données
      const [resultSet, success] = await DatabaseService.executeQuery(syncService.db, query, params);
      
      if (!success) {
        logger.error(`Échec de l'exécution de la requête pour ${tableName}`);
        return [];
      }
      
      const { rows } = resultSet;
      
      // Obtenir le statut de synchronisation de la table
      const [syncStatusResult, syncSuccess] = await DatabaseService.executeQuery(
        syncService.db,
        'SELECT is_synced, last_synced FROM sync_status WHERE table_name = ?',
        [tableName]
      );
      
      if (!syncSuccess) {
        logger.error(`Échec de la récupération du statut de synchronisation pour ${tableName}`);
        return [];
      }
      
      const syncStatusRows = syncStatusResult.rows;
      
      const resultData: (T & {_syncStatus?: string, _lastSynced?: string | null})[] = [];
      
      for (let i = 0; i < rows.length; i++) {
        const item = rows.item(i) as T;
        
        if (syncStatusRows.length > 0) {
          const syncStatus = syncStatusRows.item(0);
          // Ajouter des métadonnées de synchronisation à chaque élément
          (item as any)._syncStatus = syncStatus.is_synced === 1 ? 'synced' : 'not_synced';
          (item as any)._lastSynced = syncStatus.last_synced;
        } else {
          (item as any)._syncStatus = 'unknown';
          (item as any)._lastSynced = null;
        }
        
        resultData.push(item as T & {_syncStatus?: string, _lastSynced?: string | null});
      }
      
      return resultData;
    } catch (error) {
      logger.error(`Erreur lors de l'obtention des données avec statut de synchronisation pour ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Nettoyer les ressources
   */
  public cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.syncRetryTimeout) {
      clearTimeout(this.syncRetryTimeout);
      this.syncRetryTimeout = null;
    }
  }

  /**
   * Exécuter une requête et obtenir les résultats sous forme de tableau
   */
  static async executeQueryAndGetResults<T>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const [resultSet, success] = await DatabaseService.executeQuery(
        await DatabaseService.getDBConnection(),
        query,
        params
      );
      
      if (!success) {
        console.error('Query failed:', query);
        return [];
      }

      return DatabaseService.mapResultSetToArray<T>(resultSet);
    } catch (error) {
      console.error('Error executing query:', error, query);
      return [];
    }
  }

  /**
   * Obtenir les données locales
   */
  static async getLocalData<T>(tableName: string, whereClause: string = '', params: any[] = []): Promise<T[]> {
    const query = `SELECT * FROM ${tableName} ${whereClause ? 'WHERE ' + whereClause : ''}`;
    try {
      const [resultSet, success] = await DatabaseService.executeQuery(
        await DatabaseService.getDBConnection(),
        query,
        params
      );

      if (!success) {
        console.error(`Failed to get data from ${tableName}`);
        return [];
      }

      return DatabaseService.mapResultSetToArray<T>(resultSet);
    } catch (error) {
      console.error(`Error getting data from ${tableName}:`, error);
      return [];
    }
  }
}

// Exporter l'instance singleton
const syncService = SyncService.getInstance();
export default syncService;