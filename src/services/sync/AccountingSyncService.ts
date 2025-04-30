/**
 * Service de synchronisation spécifique pour la comptabilité
 * Gère la synchronisation des données comptables entre le mode hors ligne et en ligne
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';
import NetInfo from '@react-native-community/netinfo';
import DatabaseService from '../DatabaseService';
import { BaseSyncService } from './BaseSyncService';
import { BusinessDomain, SyncPriority, SyncCheckpoint, AdvancedSyncOptions } from './SyncTypes';
import { api } from '../../services';
import { SyncOptions } from './SyncService';

// Tables à synchroniser
const ACCOUNTING_TABLES = {
  TRANSACTIONS: 'accounting_transactions',
  ENTRIES: 'accounting_entries',
  ACCOUNTS: 'accounting_accounts',
  JOURNAL: 'accounting_journal',
  ATTACHMENTS: 'accounting_attachments',
  REPORTS: 'accounting_reports'
};

class AccountingSyncService implements BaseSyncService {
  private static instance: AccountingSyncService;
  private db: SQLite.WebSQLDatabase | null = null;
  
  // Propriétés relatives au domaine métier
  private readonly businessDomain: BusinessDomain = BusinessDomain.FINANCIAL;
  private readonly businessEntities: string[] = ['accounting', 'transactions', 'payments'];
  private readonly userFriendlyName: string = 'Comptabilité';
  private readonly userFriendlyDescription: string = 'Synchronisation des données comptables, transactions et paiements';
  private readonly syncPriority: SyncPriority = SyncPriority.HIGH;

  private constructor() {
    // Initialiser la base de données au démarrage
    this.initDatabase();
  }

  /**
   * Obtenir l'instance singleton du service
   */
  public static getInstance(): AccountingSyncService {
    if (!AccountingSyncService.instance) {
      AccountingSyncService.instance = new AccountingSyncService();
    }
    return AccountingSyncService.instance;
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
   * Définir la priorité de synchronisation
   */
  public setPriority(priority: SyncPriority): void {
    (this as any).syncPriority = priority;
  }

  /**
   * Obtenir la priorité de synchronisation
   */
  public getPriority(): SyncPriority {
    return this.syncPriority;
  }

  /**
   * Initialiser la base de données pour la comptabilité
   */
  private async initDatabase(): Promise<void> {
    try {
      this.db = await DatabaseService.getDatabase();
      
      // S'assurer que toutes les tables nécessaires existent
      await this.ensureLocalStructure();
      
      logger.debug('Tables comptables créées ou vérifiées');
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation des tables de ${this.getUserFriendlyName()}:`, error);
    }
  }

  /**
   * S'assurer que toutes les tables nécessaires existent
   */
  public async ensureLocalStructure(): Promise<void> {
    if (!this.db) return;

    // Table des transactions comptables
    await DatabaseService.createTableIfNotExists(
      this.db,
      ACCOUNTING_TABLES.TRANSACTIONS,
      `id TEXT PRIMARY KEY,
       reference TEXT,
       date TEXT,
       description TEXT,
       status TEXT,
       total REAL,
       created_at TEXT,
       updated_at TEXT,
       created_by TEXT,
       updated_by TEXT,
       validated_by TEXT,
       validated_at TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT,
       deleted_at TEXT`
    );
    
    // Table des écritures comptables
    await DatabaseService.createTableIfNotExists(
      this.db,
      ACCOUNTING_TABLES.ENTRIES,
      `id TEXT PRIMARY KEY,
       transaction_id TEXT,
       account_code TEXT,
       description TEXT,
       debit REAL DEFAULT 0,
       credit REAL DEFAULT 0,
       created_at TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT,
       FOREIGN KEY(transaction_id) REFERENCES ${ACCOUNTING_TABLES.TRANSACTIONS}(id) ON DELETE CASCADE`
    );
    
    // Table du plan comptable
    await DatabaseService.createTableIfNotExists(
      this.db,
      ACCOUNTING_TABLES.ACCOUNTS,
      `code TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       type TEXT, 
       balance REAL DEFAULT 0,
       is_active INTEGER DEFAULT 1,
       parent_code TEXT,
       description TEXT,
       created_at TEXT,
       updated_at TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT`
    );
    
    // Table des journaux comptables
    await DatabaseService.createTableIfNotExists(
      this.db,
      ACCOUNTING_TABLES.JOURNAL,
      `id TEXT PRIMARY KEY,
       code TEXT NOT NULL,
       name TEXT NOT NULL,
       type TEXT,
       description TEXT,
       is_active INTEGER DEFAULT 1,
       created_at TEXT,
       updated_at TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT`
    );
    
    // Table des pièces jointes
    await DatabaseService.createTableIfNotExists(
      this.db,
      ACCOUNTING_TABLES.ATTACHMENTS,
      `id TEXT PRIMARY KEY,
       transaction_id TEXT,
       filename TEXT NOT NULL,
       file_path TEXT,
       file_type TEXT,
       file_size INTEGER,
       uploaded INTEGER DEFAULT 0,
       created_at TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT,
       FOREIGN KEY(transaction_id) REFERENCES ${ACCOUNTING_TABLES.TRANSACTIONS}(id) ON DELETE CASCADE`
    );
    
    // Table des rapports financiers
    await DatabaseService.createTableIfNotExists(
      this.db,
      ACCOUNTING_TABLES.REPORTS,
      `id TEXT PRIMARY KEY,
       title TEXT NOT NULL,
       type TEXT NOT NULL,
       start_date TEXT,
       end_date TEXT,
       file_path TEXT,
       created_at TEXT,
       created_by TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT`
    );
  }

  /**
   * Synchroniser les données comptables
   * @param forceFullSync Force une synchronisation complète
   * @param options Options avancées de synchronisation
   */
  public async synchronize(forceFullSync: boolean = false, options?: SyncOptions & AdvancedSyncOptions): Promise<boolean> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      logger.info(`Démarrage de la synchronisation de ${this.getUserFriendlyName()}`);
      
      // Synchronisation du plan comptable (données de base)
      await this.syncAccounts(forceFullSync);
      
      // Synchronisation des journaux (données de base)
      await this.syncJournals(forceFullSync);
      
      // Synchronisation des transactions et écritures (données de transaction)
      await this.syncTransactions(forceFullSync);
      
      // Synchronisation des pièces jointes (fichiers)
      await this.syncAttachments();
      
      logger.info(`Synchronisation de ${this.getUserFriendlyName()} terminée avec succès`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la synchronisation de ${this.getUserFriendlyName()}:`, error);
      return false;
    }
  }

  /**
   * Synchroniser les données comptables par lots (pour les grandes quantités)
   * @param batchIndex Index du lot à synchroniser
   * @param batchSize Taille du lot
   * @param checkpoint Point de contrôle pour la reprise
   */
  public async synchronizeBatch(
    batchIndex: number = 0,
    batchSize: number = 50,
    checkpoint?: SyncCheckpoint
  ): Promise<SyncCheckpoint> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      // Initialiser le checkpoint avec les valeurs par défaut
      const currentCheckpoint: SyncCheckpoint = checkpoint || {
        batchIndex: 0,
        processedCount: 0,
        lastSyncTime: new Date(),
        completed: false
      };
      
      // Déterminer quelle entité est en cours de synchronisation en fonction du batchIndex
      if (batchIndex < 2) {
        // Synchroniser les comptes (priorité aux données de base)
        await this.syncAccounts(false);
        currentCheckpoint.batchIndex = 2;
        currentCheckpoint.processedCount += 1;
      } else if (batchIndex < 4) {
        // Synchroniser les journaux
        await this.syncJournals(false);
        currentCheckpoint.batchIndex = 4;
        currentCheckpoint.processedCount += 1;
      } else {
        // Synchroniser les transactions par lot
        const startIndex = (batchIndex - 4) * batchSize;
        await this.syncTransactionsBatch(startIndex, batchSize);
        
        // Vérifier s'il reste des transactions à synchroniser
        const [countResult] = await DatabaseService.executeQuery(
          this.db,
          `SELECT COUNT(*) as count FROM ${ACCOUNTING_TABLES.TRANSACTIONS} WHERE synced = 0 AND deleted_at IS NULL LIMIT 1`
        );
        
        const hasMoreTransactions = countResult.rows.item(0).count > 0;
        
        if (hasMoreTransactions) {
          // Passer au lot suivant
          currentCheckpoint.batchIndex = batchIndex + 1;
          currentCheckpoint.processedCount += batchSize;
        } else {
          // Traiter les pièces jointes
          await this.syncAttachments();
          currentCheckpoint.completed = true;
          currentCheckpoint.lastSyncTime = new Date();
        }
      }
      
      return currentCheckpoint;
    } catch (error) {
      logger.error(`Erreur lors de la synchronisation par lots de ${this.getUserFriendlyName()}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les données depuis le serveur et les stocker localement
   */
  public async pullFromServer(forceFullSync: boolean = false, lastSyncTime?: Date, options?: AdvancedSyncOptions): Promise<number> {
    try {
      // La méthode pullFromServer intègre toutes les fonctionnalités de synchronisation depuis le serveur
      // Pour simplifier, nous utiliserons les méthodes spécifiques existantes
      let totalUpdated = 0;
      
      // Synchroniser les comptes depuis le serveur
      if (!global.__DEMO_MODE__ && !global.__OFFLINE_MODE__) {
        try {
          const syncTimestamp = lastSyncTime?.toISOString();
          const response = await api.get('/accounting/accounts', { 
            params: syncTimestamp ? { updated_since: syncTimestamp } : {}
          });
          
          if (response.data && Array.isArray(response.data)) {
            totalUpdated += response.data.length;
            
            // Le traitement des données est fait dans les méthodes spécifiques
            // qui seront appelées par la méthode synchronize
          }
        } catch (error) {
          logger.error(`Erreur lors du pull des comptes de ${this.getUserFriendlyName()}:`, error);
        }
      }
      
      // Les autres entités sont synchronisées dans leurs méthodes respectives
      
      return totalUpdated;
    } catch (error) {
      logger.error(`Erreur générale lors du pull des données de ${this.getUserFriendlyName()}:`, error);
      throw error;
    }
  }

  /**
   * Envoyer les données locales vers le serveur
   */
  public async pushToServer(onlyModified: boolean = true, options?: AdvancedSyncOptions): Promise<number> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      let totalPushed = 0;
      
      // Récupérer les transactions non synchronisées
      const query = onlyModified 
        ? `SELECT * FROM ${ACCOUNTING_TABLES.TRANSACTIONS} WHERE synced = 0 AND deleted_at IS NULL`
        : `SELECT * FROM ${ACCOUNTING_TABLES.TRANSACTIONS} WHERE deleted_at IS NULL`;
        
      const [transactions] = await DatabaseService.executeQuery(
        this.db,
        query
      );
      
      // Envoyer les transactions par lot
      const batchSize = options?.batchSize || 50;
      
      for (let i = 0; i < transactions.rows.length; i++) {
        const transaction = transactions.rows.item(i);
        
        try {
          if (!global.__DEMO_MODE__ && !global.__OFFLINE_MODE__) {
            // Récupérer les écritures associées
            const [entries] = await DatabaseService.executeQuery(
              this.db,
              `SELECT * FROM ${ACCOUNTING_TABLES.ENTRIES} WHERE transaction_id = ?`,
              [transaction.id]
            );
            
            // Préparer l'objet transaction complet avec ses écritures
            const transactionData = {
              ...transaction,
              entries: Array.from({ length: entries.rows.length }, (_, j) => entries.rows.item(j))
            };
            
            // Envoyer au serveur
            const response = await api.post('/accounting/transactions', transactionData);
            
            if (response.data && response.data.id) {
              // Marquer comme synchronisé
              await DatabaseService.executeQuery(
                this.db,
                `UPDATE ${ACCOUNTING_TABLES.TRANSACTIONS} SET synced = 1, remote_id = ? WHERE id = ?`,
                [response.data.id, transaction.id]
              );
              
              await DatabaseService.executeQuery(
                this.db,
                `UPDATE ${ACCOUNTING_TABLES.ENTRIES} SET synced = 1 WHERE transaction_id = ?`,
                [transaction.id]
              );
              
              totalPushed++;
            }
          } else {
            // En mode démo, simuler la synchronisation
            await DatabaseService.executeQuery(
              this.db,
              `UPDATE ${ACCOUNTING_TABLES.TRANSACTIONS} SET synced = 1 WHERE id = ?`,
              [transaction.id]
            );
            
            totalPushed++;
          }
        } catch (error) {
          logger.error(`Erreur lors du push de la transaction ${transaction.id}:`, error);
          // Continuer avec la prochaine transaction
        }
      }
      
      return totalPushed;
    } catch (error) {
      logger.error(`Erreur générale lors du push des données de ${this.getUserFriendlyName()}:`, error);
      throw error;
    }
  }

  /**
   * Résoudre un conflit entre les données locales et distantes
   */
  public async resolveConflict(localData: any, serverData: any, strategy: 'LOCAL' | 'REMOTE' | 'MERGE' | 'ASK'): Promise<any> {
    try {
      switch (strategy) {
        case 'LOCAL':
          return localData;
        case 'REMOTE':
          return serverData;
        case 'MERGE':
          // Stratégie de fusion personnalisée pour les données comptables
          // Dans le cas de la comptabilité, la fusion est délicate car on doit préserver l'équilibre débit/crédit
          if (localData.type === 'transaction') {
            return this.mergeTransactions(localData, serverData);
          } else {
            // Pour les autres types de données, conserver les champs modifiés localement
            return {
              ...serverData,
              ...this.getLocallyModifiedFields(localData, serverData),
              updated_at: new Date().toISOString()
            };
          }
        case 'ASK':
          // Retourner les deux versions et laisser l'UI gérer la résolution
          return {
            conflict: true,
            local: localData,
            remote: serverData,
            entityType: 'accounting',
            entityId: localData.id || serverData.id
          };
        default:
          return serverData;
      }
    } catch (error) {
      logger.error(`Erreur lors de la résolution de conflit pour ${this.getUserFriendlyName()}:`, error);
      // En cas d'erreur, privilégier la version serveur
      return serverData;
    }
  }
  
  /**
   * Méthode utilitaire pour fusionner deux transactions en conflit
   */
  private mergeTransactions(localTransaction: any, serverTransaction: any): any {
    // Logique de fusion spécifique pour préserver l'équilibre comptable
    // Cette implémentation est simplifiée et devrait être adaptée aux besoins réels
    
    // Conserver l'ID de la version serveur
    const mergedTransaction = {
      ...serverTransaction,
      // Préserver la description locale si modifiée
      description: localTransaction.updated_at > serverTransaction.updated_at
        ? localTransaction.description
        : serverTransaction.description,
      // Prendre la date la plus récente
      updated_at: new Date().toISOString()
    };
    
    return mergedTransaction;
  }
  
  /**
   * Extraire les champs qui ont été modifiés localement par rapport à la version serveur
   */
  private getLocallyModifiedFields(localData: any, serverData: any): any {
    const modifiedFields: any = {};
    
    // Comparer chaque champ et ne conserver que ceux modifiés localement
    Object.keys(localData).forEach(key => {
      // Ignorer les champs techniques
      if (['id', 'remote_id', 'synced', 'created_at'].includes(key)) {
        return;
      }
      
      // Si la date de mise à jour locale est plus récente ou si le champ est différent
      const localValue = localData[key];
      const serverValue = serverData[key];
      
      if (localData.updated_at > serverData.updated_at && localValue !== serverValue) {
        modifiedFields[key] = localValue;
      }
    });
    
    return modifiedFields;
  }

  /**
   * Sauvegarder l'état actuel de la synchronisation pour reprise ultérieure
   */
  public async saveCheckpoint(checkpoint: SyncCheckpoint): Promise<void> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      const checkpointKey = 'accounting_sync_checkpoint';
      const checkpointData = JSON.stringify(checkpoint);
      
      // Vérifier si un checkpoint existe déjà
      const [existingResult] = await DatabaseService.executeQuery(
        this.db,
        `SELECT * FROM sync_config WHERE key = ?`,
        [checkpointKey]
      );
      
      if (existingResult.rows.length > 0) {
        // Mettre à jour le checkpoint existant
        await DatabaseService.executeQuery(
          this.db,
          `UPDATE sync_config SET value = ?, updated_at = ? WHERE key = ?`,
          [checkpointData, new Date().toISOString(), checkpointKey]
        );
      } else {
        // Créer un nouveau checkpoint
        await DatabaseService.executeQuery(
          this.db,
          `INSERT INTO sync_config (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)`,
          [checkpointKey, checkpointData, new Date().toISOString(), new Date().toISOString()]
        );
      }
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde du checkpoint pour ${this.getUserFriendlyName()}:`, error);
    }
  }

  /**
   * Charger l'état de la dernière synchronisation pour reprise
   */
  public async loadCheckpoint(): Promise<SyncCheckpoint | null> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      const checkpointKey = 'accounting_sync_checkpoint';
      
      const [result] = await DatabaseService.executeQuery(
        this.db,
        `SELECT value FROM sync_config WHERE key = ?`,
        [checkpointKey]
      );
      
      if (result.rows.length > 0 && result.rows.item(0).value) {
        return JSON.parse(result.rows.item(0).value);
      }
      
      return null;
    } catch (error) {
      logger.error(`Erreur lors du chargement du checkpoint pour ${this.getUserFriendlyName()}:`, error);
      return null;
    }
  }

  /**
   * Synchroniser le plan comptable
   */
  private async syncAccounts(forceFullSync: boolean): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les journaux comptables
   */
  private async syncJournals(forceFullSync: boolean): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les transactions comptables
   */
  private async syncTransactions(forceFullSync: boolean): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser un lot de transactions comptables
   * @param startIndex Index de départ
   * @param batchSize Taille du lot
   */
  private async syncTransactionsBatch(startIndex: number, batchSize: number): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les pièces jointes des transactions
   */
  private async syncAttachments(): Promise<void> {
    // ...existing code...
  }

  /**
   * Obtenir la date de dernière synchronisation pour une table
   */
  private async getLastSyncDate(tableName: string): Promise<Date | null> {
    // Implementation would go here
    return null;
  }

  /**
   * Définir la date de dernière synchronisation pour une table
   */
  private async setLastSyncDate(tableName: string, date: Date): Promise<void> {
    // Implementation would go here
  }
}

// Exporter une instance singleton du service
const accountingSyncService = AccountingSyncService.getInstance();
export default accountingSyncService;