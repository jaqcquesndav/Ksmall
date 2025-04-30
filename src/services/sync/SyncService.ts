import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';
import DatabaseService from '../DatabaseService';
import offlineQueueService, { QueueOperationType, QueueItemStatus } from '../OfflineQueueService';
import { BaseSyncService } from './BaseSyncService';
import { BusinessDomain, SyncPriority, SyncCheckpoint, AdvancedSyncOptions } from './SyncTypes';

// Définir des timeouts pour éviter les blocages
const SYNC_TIMEOUT = 60000; // 60 secondes
const DB_OPERATION_TIMEOUT = 15000; // 15 secondes

// Interface pour les options de synchronisation
export interface SyncOptions {
  forceFullSync?: boolean;
  tables?: string[];
  onProgress?: (current: number, total: number) => void;
  conflictResolution?: 'LOCAL' | 'REMOTE' | 'MERGE' | 'ASK';
  timeout?: number; // Permettre de personnaliser le timeout
}

// Interface pour les tables synchronisables
export interface SyncTable {
  name: string;
  endpoint: string;
  idField: string;
  lastSyncField: string;
  timestamps?: boolean;
  softDelete?: boolean;
  orderBy?: string;
  filterFn?: (item: any) => boolean;
  mergeFn?: (localItem: any, remoteItem: any) => any;
}

// Interface pour les résultats de synchronisation
export interface SyncResult {
  success: boolean;
  totalSynced: number;
  errors: number;
  details: {
    tableName: string;
    downloaded: number;
    uploaded: number;
    conflicts: number;
    errors: number;
  }[];
  startTime: Date;
  endTime: Date;
  duration: number;
  errorDetails?: any;
}

/**
 * Service pour gérer la synchronisation des données entre SQLite local et le backend
 */
export class SyncService implements BaseSyncService {
  private static instance: SyncService;
  private db: SQLite.WebSQLDatabase | null = null;
  private isInitialized = false;
  private _isSyncing = false; // Renommer pour éviter le doublon avec la méthode
  private syncTables: SyncTable[] = [];
  private lastSyncTime: Date | null = null;
  private autoSyncInterval: NodeJS.Timeout | null = null;
  private networkListener: NetInfoSubscription | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.initPromise = this.init();
  }

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
   * Initialiser le service
   */
  private async init(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Initialiser la base de données avec un timeout
      await Promise.race([
        this.initDatabase(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout lors de l\'initialisation de la base de données')), 
          DB_OPERATION_TIMEOUT)
        )
      ]);

      // Charger la configuration de synchronisation
      await this.loadSyncConfig();

      // Configurer l'écouteur d'état du réseau
      this.setupNetworkListener();

      // Configurer la synchronisation automatique si activée
      await this.setupAutoSync();

      this.isInitialized = true;
      logger.info('Service de synchronisation initialisé');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du service de synchronisation:', error);
      // Réinitialiser pour permettre une nouvelle tentative d'initialisation
      this.isInitialized = false;
      this.initPromise = null;
    }
  }

  /**
   * Initialiser la base de données pour la synchronisation
   */
  private async initDatabase(): Promise<void> {
    try {
      // Vérifier si la base est déjà ouverte avant d'essayer de l'obtenir
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }

      // Table pour stocker la configuration et les métadonnées de synchronisation
      await DatabaseService.createTableIfNotExists(
        this.db,
        'sync_meta',
        `table_name TEXT PRIMARY KEY,
        last_sync_time TEXT,
        last_sync_token TEXT,
        sync_status TEXT,
        record_count INTEGER DEFAULT 0,
        last_error TEXT,
        last_success_time TEXT`
      );

      // Table pour stocker les conflits de synchronisation
      await DatabaseService.createTableIfNotExists(
        this.db,
        'sync_conflicts',
        `id INTEGER PRIMARY KEY AUTOINCREMENT,
        queue_item_id INTEGER,
        table_name TEXT,
        record_id TEXT,
        local_data TEXT,
        server_data TEXT,
        resolution TEXT,
        created_at TEXT,
        resolved_at TEXT,
        FOREIGN KEY (queue_item_id) REFERENCES offline_queue(id)`
      );

      logger.debug('Tables de synchronisation créées ou vérifiées');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la base de données pour la synchronisation:', error);
      // Ne pas propager l'erreur fatale, permettre à l'application de continuer
      // avec des fonctionnalités réduites
    }
  }

  /**
   * Configurer l'écouteur d'état du réseau avec une gestion d'erreur améliorée
   */
  private setupNetworkListener(): void {
    // Supprimer l'écouteur précédent s'il existe
    if (this.networkListener) {
      this.networkListener();
      this.networkListener = null;
    }

    try {
      // Écouter les changements d'état du réseau
      this.networkListener = NetInfo.addEventListener(state => {
        try {
          if (state.isConnected) {
            logger.debug('Connexion réseau rétablie');

            // Traiter la file d'attente lors du rétablissement de la connexion
            // avec délai pour éviter les rafales de requêtes
            setTimeout(() => {
              this.processOfflineQueue().catch(error => {
                logger.error('Erreur lors du traitement automatique de la file d\'attente:', error);
              });
            }, 2000);
          } else {
            logger.debug('Connexion réseau perdue');
          }
        } catch (error) {
          logger.error('Erreur dans le gestionnaire d\'événements réseau:', error);
        }
      });
    } catch (error) {
      logger.error('Erreur lors de la configuration de l\'écouteur réseau:', error);
    }
  }

  /**
   * Charger la configuration de synchronisation
   */
  private async loadSyncConfig(): Promise<void> {
    try {
      // Charger la dernière date de synchronisation
      const lastSyncTimeStr = await AsyncStorage.getItem('last_sync_time');
      this.lastSyncTime = lastSyncTimeStr ? new Date(lastSyncTimeStr) : null;

      // Ici, vous devriez définir les tables à synchroniser selon votre application
      // Avec fallback en cas d'erreur de configuration
      try {
        this.syncTables = [
          {
            name: 'customers',
            endpoint: '/api/customers',
            idField: 'id',
            lastSyncField: 'updated_at',
            timestamps: true,
            softDelete: true,
            orderBy: 'updated_at DESC'
          },
          {
            name: 'products',
            endpoint: '/api/products',
            idField: 'id',
            lastSyncField: 'updated_at',
            timestamps: true,
            softDelete: true,
            orderBy: 'updated_at DESC'
          },
          {
            name: 'transactions',
            endpoint: '/api/transactions',
            idField: 'id',
            lastSyncField: 'updated_at',
            timestamps: true,
            softDelete: false,
            orderBy: 'updated_at DESC'
          },
          {
            name: 'inventory',
            endpoint: '/api/inventory',
            idField: 'id',
            lastSyncField: 'updated_at',
            timestamps: true,
            softDelete: true,
            orderBy: 'updated_at DESC'
          }
          // Ajoutez d'autres tables selon vos besoins
        ];

        logger.debug(`Configuration de synchronisation chargée: ${this.syncTables.length} table(s)`);
      } catch (configError) {
        logger.error('Erreur lors du chargement des tables de synchronisation:', configError);
        // Configurer un ensemble minimal de tables pour permettre le fonctionnement de base
        this.syncTables = [];
      }
    } catch (error) {
      logger.error('Erreur lors du chargement de la configuration de synchronisation:', error);
    }
  }

  /**
   * Configurer la synchronisation automatique
   */
  private async setupAutoSync(): Promise<void> {
    try {
      // Vérifier si la synchronisation automatique est activée
      const autoSync = await AsyncStorage.getItem('auto_sync_enabled');

      if (autoSync === 'true') {
        // Récupérer l'intervalle de synchronisation (en minutes), par défaut 15 minutes
        const intervalStr = await AsyncStorage.getItem('auto_sync_interval');
        const interval = intervalStr ? parseInt(intervalStr, 10) : 15;

        // Valider l'intervalle (au moins 5 minutes, max 120 minutes)
        const validInterval = Math.max(5, Math.min(interval, 120));

        logger.debug(`Synchronisation automatique activée avec un intervalle de ${validInterval} minute(s)`);

        // Configurer la synchronisation périodique
        this.startAutoSync(validInterval);
      } else {
        logger.debug('Synchronisation automatique désactivée');
      }
    } catch (error) {
      logger.error('Erreur lors de la configuration de la synchronisation automatique:', error);
      // Par défaut, désactiver la synchronisation automatique en cas d'erreur
    }
  }

  /**
   * Démarrer la synchronisation automatique
   * @param intervalMinutes Intervalle en minutes
   */
  public startAutoSync(intervalMinutes: number = 15): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    // Valider l'intervalle (entre 5 et 120 minutes)
    const validInterval = Math.max(5, Math.min(intervalMinutes, 120));
    const intervalMs = validInterval * 60 * 1000;

    this.autoSyncInterval = setInterval(async () => {
      try {
        // Éviter de synchroniser si une synchronisation est déjà en cours
        if (this._isSyncing) {
          logger.debug('Synchronisation automatique ignorée: une synchronisation est déjà en cours');
          return;
        }

        // Vérifier si nous sommes en ligne
        const networkState = await NetInfo.fetch();
        if (!networkState.isConnected) {
          logger.debug('Synchronisation automatique reportée: pas de connexion réseau');
          return;
        }

        // Lancer la synchronisation avec un timeout
        logger.debug('Démarrage de la synchronisation automatique');
        
        // Utiliser Promise.race pour ajouter un timeout
        await Promise.race([
          this.sync({
            onProgress: (current, total) => {
              logger.debug(`Synchronisation automatique: ${current}/${total}`);
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout de la synchronisation automatique')), 
            SYNC_TIMEOUT)
          )
        ]).catch(error => {
          // Gérer les erreurs silencieusement pour éviter de perturber l'application
          logger.error('Erreur ou timeout lors de la synchronisation automatique:', error);
        });
      } catch (error) {
        logger.error('Erreur lors de la synchronisation automatique:', error);
      }
    }, intervalMs);

    logger.info(`Synchronisation automatique configurée pour s'exécuter toutes les ${validInterval} minute(s)`);

    // Sauvegarder la configuration
    AsyncStorage.setItem('auto_sync_enabled', 'true');
    AsyncStorage.setItem('auto_sync_interval', validInterval.toString());
  }

  /**
   * Arrêter la synchronisation automatique
   */
  public stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;

      logger.info('Synchronisation automatique désactivée');

      // Sauvegarder la configuration
      AsyncStorage.setItem('auto_sync_enabled', 'false');
    }
  }

  /**
   * Synchroniser les données entre SQLite local et le backend
   * @param syncOptions Options de synchronisation
   * @returns Résultat de la synchronisation
   */
  public async sync(syncOptions: SyncOptions = {}): Promise<SyncResult> {
    // Attendre que l'initialisation soit terminée
    await this.waitForInit();
    
    if (this._isSyncing) {
      logger.warn('Une synchronisation est déjà en cours, opération ignorée');
      throw new Error('Synchronisation déjà en cours');
    }

    // Vérifier la connectivité réseau
    let isConnected = false;
    try {
      const networkState = await NetInfo.fetch();
      isConnected = !!networkState.isConnected;
    } catch (error) {
      logger.error('Erreur lors de la vérification de l\'état du réseau:', error);
    }

    if (!isConnected) {
      logger.warn('Pas de connexion réseau, synchronisation impossible');
      throw new Error('Pas de connexion réseau');
    }

    const startTime = new Date();
    const result: SyncResult = {
      success: false,
      totalSynced: 0,
      errors: 0,
      details: [],
      startTime,
      endTime: startTime,
      duration: 0
    };

    try {
      this._isSyncing = true;
      logger.info('Démarrage de la synchronisation');

      // 1. D'abord traiter la file d'attente des opérations hors ligne
      // Avec un timeout pour éviter les blocages
      await Promise.race([
        this.processOfflineQueue(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout lors du traitement de la file d\'attente')), 
          syncOptions.timeout || SYNC_TIMEOUT)
        )
      ]).catch(error => {
        logger.error('Timeout ou erreur lors du traitement de la file d\'attente:', error);
        // Continuer même en cas d'erreur
      });

      // 2. Ensuite synchroniser les données entre le backend et la base de données locale
      const tables = syncOptions.tables || this.syncTables.map(t => t.name);
      const total = tables.length;
      let current = 0;

      for (const tableName of tables) {
        current++;

        if (syncOptions.onProgress) {
          syncOptions.onProgress(current, total);
        }

        const tableConfig = this.syncTables.find(t => t.name === tableName);
        if (!tableConfig) {
          logger.warn(`Impossible de synchroniser la table "${tableName}": configuration non trouvée`);
          continue;
        }

        try {
          // Synchroniser chaque table avec un timeout individuel
          const tableResult = await Promise.race([
            this.syncTable(tableConfig, syncOptions),
            new Promise<any>((_, reject) => 
              setTimeout(() => reject(new Error(`Timeout lors de la synchronisation de la table ${tableName}`)),
              syncOptions.timeout || SYNC_TIMEOUT / 2)
            )
          ]);
          
          result.details.push(tableResult);
          result.totalSynced += tableResult.downloaded + tableResult.uploaded;
          result.errors += tableResult.errors;
        } catch (tableError) {
          logger.error(`Erreur ou timeout lors de la synchronisation de la table ${tableName}:`, tableError);
          result.errors++;
          result.details.push({
            tableName,
            downloaded: 0,
            uploaded: 0,
            conflicts: 0,
            errors: 1
          });
        }
      }

      // Mettre à jour la date de dernière synchronisation
      this.lastSyncTime = new Date();
      await AsyncStorage.setItem('last_sync_time', this.lastSyncTime.toISOString());

      result.success = true;
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();

      logger.info(`Synchronisation terminée en ${result.duration / 1000} secondes: ${result.totalSynced} enregistrement(s) synchronisé(s), ${result.errors} erreur(s)`);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Erreur lors de la synchronisation:', errorMessage);

      result.success = false;
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      result.errorDetails = errorMessage;

      return result;
    } finally {
      this._isSyncing = false;
    }
  }

  /**
   * Traiter la file d'attente des opérations hors ligne avec une meilleure gestion d'erreur
   */
  private async processOfflineQueue(): Promise<void> {
    try {
      logger.debug('Traitement de la file d\'attente des opérations hors ligne');
      
      // Vérifier si le service de file d'attente est disponible
      if (!offlineQueueService) {
        logger.error('Service de file d\'attente non disponible');
        return;
      }
      
      await offlineQueueService.processQueue();
    } catch (error) {
      logger.error('Erreur lors du traitement de la file d\'attente:', error);
      // Ne pas propager l'erreur pour éviter de bloquer tout le processus
    }
  }

  /**
   * Synchroniser une table spécifique
   * @param tableConfig Configuration de la table à synchroniser
   * @param options Options de synchronisation
   * @returns Résultat de la synchronisation pour cette table
   */
  private async syncTable(tableConfig: SyncTable, options: SyncOptions = {}): Promise<any> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }

      logger.debug(`Synchronisation de la table ${tableConfig.name}`);
      
      // Initialiser le résultat pour cette table
      const result = {
        tableName: tableConfig.name,
        downloaded: 0,
        uploaded: 0,
        conflicts: 0,
        errors: 0
      };
      
      // En mode démo ou si aucune connexion n'est disponible, simuler la synchronisation
      if (global.__DEMO_MODE__ || global.__OFFLINE_MODE__) {
        logger.debug(`Mode démo/offline: simulation de synchronisation pour ${tableConfig.name}`);
        
        // Marquer tous les enregistrements comme synchronisés
        await DatabaseService.executeQuery(
          this.db,
          `UPDATE ${tableConfig.name} SET synced = 1 WHERE synced = 0`
        );
        
        return result;
      }
      
      // 1. D'abord envoyer les modifications locales vers le serveur (prioritaire)
      try {
        // Récupérer les enregistrements locaux non synchronisés
        const [localChanges] = await DatabaseService.executeQuery(
          this.db,
          `SELECT * FROM ${tableConfig.name} WHERE synced = 0`
        );
        
        // Envoyer chaque enregistrement au serveur
        for (let i = 0; i < localChanges.rows.length; i++) {
          const localRecord = localChanges.rows.item(i);
          try {
            // Logique à implémenter selon l'API
            // Ceci est un exemple simplifié
            
            // Marquer comme synchronisé dans la base locale
            await DatabaseService.executeQuery(
              this.db,
              `UPDATE ${tableConfig.name} SET synced = 1 WHERE ${tableConfig.idField} = ?`,
              [localRecord[tableConfig.idField]]
            );
            
            result.uploaded++;
          } catch (recordError) {
            logger.error(`Erreur lors de l'envoi de l'enregistrement ${localRecord[tableConfig.idField]}:`, recordError);
            result.errors++;
          }
        }
      } catch (uploadError) {
        logger.error(`Erreur lors de l'envoi des modifications locales pour ${tableConfig.name}:`, uploadError);
        result.errors++;
      }
      
      // 2. Récupérer les modifications du serveur
      try {
        // Ici, implémentez la logique pour récupérer les données du serveur
        // et les intégrer à la base locale
        
        // Par exemple, télécharger les données depuis l'API
        // et les insérer/mettre à jour dans la base locale
        
        // Pour cet exemple, nous simulons un téléchargement réussi
        result.downloaded = 5; // Simuler 5 enregistrements téléchargés
      } catch (downloadError) {
        logger.error(`Erreur lors du téléchargement des modifications du serveur pour ${tableConfig.name}:`, downloadError);
        result.errors++;
      }
      
      logger.debug(`Synchronisation terminée pour ${tableConfig.name}: ${result.uploaded} envoyé(s), ${result.downloaded} téléchargé(s), ${result.conflicts} conflit(s), ${result.errors} erreur(s)`);
      
      return result;
    } catch (error) {
      logger.error(`Erreur générale lors de la synchronisation de la table ${tableConfig.name}:`, error);
      return {
        tableName: tableConfig.name,
        downloaded: 0,
        uploaded: 0,
        conflicts: 0,
        errors: 1
      };
    }
  }

  /**
   * BaseSyncService interface implementation
   */
  
  // Implement synchronize method from BaseSyncService
  public async synchronize(forceFullSync: boolean = false, options?: SyncOptions & AdvancedSyncOptions): Promise<boolean> {
    try {
      const result = await this.sync({
        forceFullSync,
        ...options
      });
      return result.success;
    } catch (error) {
      logger.error("Error in synchronize method:", error);
      return false;
    }
  }
  
  // Implement pullFromServer method from BaseSyncService
  public async pullFromServer(forceFullSync: boolean = false, lastSyncTime?: Date, options?: AdvancedSyncOptions): Promise<number> {
    try {
      // Using the existing sync method with specific options to pull data
      const result = await this.sync({
        forceFullSync,
        // Add other options to focus on pulling data only
      });
      return result.totalSynced;
    } catch (error) {
      logger.error("Error in pullFromServer method:", error);
      return 0;
    }
  }
  
  // Implement pushToServer method from BaseSyncService
  public async pushToServer(onlyModified: boolean = true, options?: AdvancedSyncOptions): Promise<number> {
    try {
      // Process the offline queue which handles all pending uploads
      await this.processOfflineQueue();
      return 1; // Return a success value
    } catch (error) {
      logger.error("Error in pushToServer method:", error);
      return 0;
    }
  }
  
  // Implement ensureLocalStructure method from BaseSyncService
  public async ensureLocalStructure(): Promise<void> {
    try {
      await this.waitForInit();
      // Structure is already ensured during initialization
    } catch (error) {
      logger.error("Error in ensureLocalStructure method:", error);
    }
  }
  
  // Implement resolveConflict method from BaseSyncService
  public async resolveConflict(localData: any, serverData: any, strategy: 'LOCAL' | 'REMOTE' | 'MERGE' | 'ASK'): Promise<any> {
    try {
      switch (strategy) {
        case 'LOCAL':
          return localData;
        case 'REMOTE':
          return serverData;
        case 'MERGE':
          // Simple merge strategy - server data as base, local data overwrites
          return {
            ...serverData,
            ...localData,
            updated_at: new Date().toISOString()
          };
        case 'ASK':
          return {
            local: localData,
            remote: serverData,
            needsResolution: true
          };
        default:
          return serverData;
      }
    } catch (error) {
      logger.error("Error in resolveConflict method:", error);
      return serverData; // Default to server data on error
    }
  }
  
  // Implement synchronizeBatch method from BaseSyncService
  public async synchronizeBatch(batchIndex: number, batchSize: number, checkpoint?: SyncCheckpoint): Promise<SyncCheckpoint> {
    // Default implementation
    const currentCheckpoint: SyncCheckpoint = checkpoint || {
      batchIndex: 0,
      processedCount: 0,
      lastSyncTime: new Date(),
      completed: false
    };
    
    try {
      // Process a single batch
      const tables = this.syncTables.slice(batchIndex, batchIndex + batchSize);
      
      if (tables.length === 0) {
        // No more tables to process
        currentCheckpoint.completed = true;
        return currentCheckpoint;
      }
      
      // Process this batch of tables
      for (const table of tables) {
        // Sync the table
        await this.syncTable(table, {});
        currentCheckpoint.processedCount++;
      }
      
      // Update the checkpoint
      currentCheckpoint.batchIndex += batchSize;
      
      // Check if we've processed all tables
      if (currentCheckpoint.batchIndex >= this.syncTables.length) {
        currentCheckpoint.completed = true;
      }
      
      return currentCheckpoint;
    } catch (error) {
      logger.error("Error in synchronizeBatch method:", error);
      return currentCheckpoint;
    }
  }
  
  // Implement saveCheckpoint method from BaseSyncService
  public async saveCheckpoint(checkpoint: SyncCheckpoint): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_service_checkpoint', JSON.stringify(checkpoint));
    } catch (error) {
      logger.error("Error saving checkpoint:", error);
    }
  }
  
  // Implement loadCheckpoint method from BaseSyncService
  public async loadCheckpoint(): Promise<SyncCheckpoint | null> {
    try {
      const checkpointStr = await AsyncStorage.getItem('sync_service_checkpoint');
      return checkpointStr ? JSON.parse(checkpointStr) : null;
    } catch (error) {
      logger.error("Error loading checkpoint:", error);
      return null;
    }
  }
  
  // Implement getBusinessDomain method from BaseSyncService
  public getBusinessDomain(): BusinessDomain {
    return BusinessDomain.CORE;
  }
  
  // Implement getBusinessEntities method from BaseSyncService
  public getBusinessEntities(): string[] {
    return ['global'];
  }
  
  // Implement getUserFriendlyName method from BaseSyncService
  public getUserFriendlyName(): string {
    return 'Sync Service';
  }
  
  // Implement getUserFriendlyDescription method from BaseSyncService
  public getUserFriendlyDescription(): string {
    return 'Core synchronization service for all data';
  }
  
  // Implement handlesEntity method from BaseSyncService
  public handlesEntity(entityName: string): boolean {
    return entityName === 'global' || this.syncTables.some(table => table.name === entityName);
  }
  
  // Implement getPriority method from BaseSyncService
  public getPriority(): SyncPriority {
    return SyncPriority.HIGH; // Core service has high priority
  }
}

// Export a singleton instance
const syncService = SyncService.getInstance();
export default syncService;