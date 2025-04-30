/**
 * Service de synchronisation spécifique pour les transactions
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';
import syncService from './SyncService';
import DatabaseService from '../DatabaseService';
import { SyncOptions, SyncResult } from './SyncService';
import { BaseSyncService } from './BaseSyncService';
import { BusinessDomain, SyncPriority, SyncCheckpoint, AdvancedSyncOptions } from './SyncTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

class TransactionSyncService implements BaseSyncService {
  private static instance: TransactionSyncService;
  private db: SQLite.WebSQLDatabase | null = null;
  private transactionsTable = 'transactions';
  private transactionItemsTable = 'transaction_items';
  private endpoint = '/api/transactions';
  
  // Propriétés relatives au domaine métier pour BaseSyncService
  private readonly businessDomain: BusinessDomain = BusinessDomain.FINANCIAL;
  private readonly businessEntities: string[] = ['transactions', 'payments'];
  private readonly userFriendlyName: string = 'Transactions';
  private readonly userFriendlyDescription: string = 'Synchronisation des transactions et paiements';
  private readonly syncPriority: SyncPriority = SyncPriority.HIGH;

  private constructor() {
    // Initialiser la base de données au démarrage
    this.initDatabase();
  }

  /**
   * Obtenir l'instance singleton du service
   */
  public static getInstance(): TransactionSyncService {
    if (!TransactionSyncService.instance) {
      TransactionSyncService.instance = new TransactionSyncService();
    }
    return TransactionSyncService.instance;
  }

  /**
   * Initialiser la base de données pour les transactions
   */
  private async initDatabase(): Promise<void> {
    try {
      this.db = await DatabaseService.getDatabase();
      
      // Créer la table des transactions si elle n'existe pas
      await DatabaseService.createTableIfNotExists(
        this.db,
        this.transactionsTable,
        `id TEXT PRIMARY KEY,
        transaction_number TEXT,
        customer_id TEXT,
        total_amount REAL,
        subtotal REAL,
        tax_amount REAL,
        discount_amount REAL,
        payment_method TEXT,
        payment_status TEXT,
        transaction_type TEXT,
        transaction_date TEXT,
        notes TEXT,
        created_by TEXT,
        created_at TEXT,
        updated_at TEXT,
        deleted_at TEXT,
        synced INTEGER DEFAULT 0,
        remote_id TEXT`
      );
      
      // Créer la table des éléments de transaction si elle n'existe pas
      await DatabaseService.createTableIfNotExists(
        this.db,
        this.transactionItemsTable,
        `id TEXT PRIMARY KEY,
        transaction_id TEXT,
        product_id TEXT,
        quantity INTEGER,
        unit_price REAL,
        discount REAL,
        tax_rate REAL,
        subtotal REAL,
        created_at TEXT,
        updated_at TEXT,
        deleted_at TEXT,
        synced INTEGER DEFAULT 0,
        remote_id TEXT,
        FOREIGN KEY (transaction_id) REFERENCES ${this.transactionsTable} (id) ON DELETE CASCADE`
      );
      
      logger.debug('Tables des transactions créées ou vérifiées');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation des tables de transactions:', error);
    }
  }

  /**
   * Synchroniser les données des transactions
   */
  public async sync(options: SyncOptions = {}): Promise<SyncResult> {
    return syncService.sync({
      ...options,
      tables: [this.transactionsTable, this.transactionItemsTable]
    });
  }

  /**
   * Créer une nouvelle transaction avec ses éléments
   * @param transaction Données de la transaction
   * @param items Éléments de la transaction
   * @returns ID de la transaction créée ou null en cas d'erreur
   */
  public async createTransaction(transaction: any, items: any[]): Promise<string | null> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      // Démarrer une transaction SQL pour garantir l'atomicité
      await DatabaseService.executeQuery(this.db, 'BEGIN TRANSACTION');
      
      // Générer un ID local temporaire
      const transactionId = `local_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Préparer les données avec les timestamps
      const now = new Date().toISOString();
      const transactionData = {
        ...transaction,
        id: transactionId,
        created_at: now,
        updated_at: now,
        synced: 0 // Pas encore synchronisé
      };
      
      // Insérer la transaction dans la base de données locale
      const columns = Object.keys(transactionData).join(', ');
      const placeholders = Object.keys(transactionData).map(() => '?').join(', ');
      const values = Object.values(transactionData);
      
      await DatabaseService.executeQuery(
        this.db,
        `INSERT INTO ${this.transactionsTable} (${columns}) VALUES (${placeholders})`,
        values
      );
      
      // Insérer les éléments de la transaction
      for (const item of items) {
        const itemId = `local_${Date.now()}_${Math.floor(Math.random() * 1000)}_${Math.floor(Math.random() * 1000)}`;
        const itemData = {
          ...item,
          id: itemId,
          transaction_id: transactionId,
          created_at: now,
          updated_at: now,
          synced: 0
        };
        
        const itemColumns = Object.keys(itemData).join(', ');
        const itemPlaceholders = Object.keys(itemData).map(() => '?').join(', ');
        const itemValues = Object.values(itemData);
        
        await DatabaseService.executeQuery(
          this.db,
          `INSERT INTO ${this.transactionItemsTable} (${itemColumns}) VALUES (${itemPlaceholders})`,
          itemValues
        );
      }
      
      // Valider la transaction SQL
      await DatabaseService.executeQuery(this.db, 'COMMIT');
      
      // Ajouter à la file d'attente de synchronisation
      await syncService.sync({
        tables: [this.transactionsTable, this.transactionItemsTable],
        forceFullSync: false
      });
      
      return transactionId;
    } catch (error) {
      // Annuler la transaction SQL en cas d'erreur
      if (this.db) {
        await DatabaseService.executeQuery(this.db, 'ROLLBACK');
      }
      logger.error('Erreur lors de la création d\'une transaction:', error);
      return null;
    }
  }

  /**
   * Récupérer une transaction par son ID, incluant ses éléments
   * @param id ID de la transaction
   * @returns Données de la transaction avec ses éléments ou null si non trouvée
   */
  public async getTransactionById(id: string): Promise<any | null> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      // Récupérer la transaction
      const [transactionResult] = await DatabaseService.executeQuery(
        this.db,
        `SELECT * FROM ${this.transactionsTable} WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );
      
      if (transactionResult.rows.length === 0) {
        return null;
      }
      
      const transaction = transactionResult.rows.item(0);
      
      // Récupérer les éléments de la transaction
      const [itemsResult] = await DatabaseService.executeQuery(
        this.db,
        `SELECT * FROM ${this.transactionItemsTable} WHERE transaction_id = ? AND deleted_at IS NULL`,
        [id]
      );
      
      const items = [];
      for (let i = 0; i < itemsResult.rows.length; i++) {
        items.push(itemsResult.rows.item(i));
      }
      
      // Retourner la transaction avec ses éléments
      return {
        ...transaction,
        items
      };
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la transaction ${id}:`, error);
      return null;
    }
  }

  /**
   * Récupérer toutes les transactions
   * @param filters Filtres optionnels (type, date, etc.)
   * @returns Liste des transactions
   */
  public async getAllTransactions(filters: any = {}): Promise<any[]> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      // Construire la requête avec les filtres
      let query = `SELECT * FROM ${this.transactionsTable} WHERE deleted_at IS NULL`;
      const params = [];
      
      if (filters.type) {
        query += ' AND transaction_type = ?';
        params.push(filters.type);
      }
      
      if (filters.startDate) {
        query += ' AND transaction_date >= ?';
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        query += ' AND transaction_date <= ?';
        params.push(filters.endDate);
      }
      
      if (filters.paymentStatus) {
        query += ' AND payment_status = ?';
        params.push(filters.paymentStatus);
      }
      
      if (filters.customerId) {
        query += ' AND customer_id = ?';
        params.push(filters.customerId);
      }
      
      // Ajouter l'ordre de tri
      query += ' ORDER BY transaction_date DESC, created_at DESC';
      
      // Exécuter la requête
      const [result] = await DatabaseService.executeQuery(this.db, query, params);
      
      // Récupérer les résultats
      const transactions = [];
      for (let i = 0; i < result.rows.length; i++) {
        transactions.push(result.rows.item(i));
      }
      
      // Pour chaque transaction, récupérer ses éléments
      for (const transaction of transactions) {
        const [itemsResult] = await DatabaseService.executeQuery(
          this.db,
          `SELECT * FROM ${this.transactionItemsTable} WHERE transaction_id = ? AND deleted_at IS NULL`,
          [transaction.id]
        );
        
        const items = [];
        for (let i = 0; i < itemsResult.rows.length; i++) {
          items.push(itemsResult.rows.item(i));
        }
        
        transaction.items = items;
      }
      
      return transactions;
    } catch (error) {
      logger.error('Erreur lors de la récupération des transactions:', error);
      return [];
    }
  }

  /**
   * Mettre à jour une transaction existante
   * @param id ID de la transaction à mettre à jour
   * @param transactionData Nouvelles données de la transaction
   * @returns true si la mise à jour a réussi, false sinon
   */
  public async updateTransaction(id: string, transactionData: any): Promise<boolean> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      // Vérifier si la transaction existe
      const [checkResult] = await DatabaseService.executeQuery(
        this.db,
        `SELECT * FROM ${this.transactionsTable} WHERE id = ?`,
        [id]
      );
      
      if (checkResult.rows.length === 0) {
        logger.warn(`Transaction introuvable avec l'ID ${id}`);
        return false;
      }
      
      // Mettre à jour l'horodatage
      transactionData.updated_at = new Date().toISOString();
      transactionData.synced = 0; // Marquer comme non synchronisé
      
      // Construire la requête de mise à jour
      const setClause = Object.keys(transactionData)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = [
        ...Object.values(transactionData),
        id // Pour la clause WHERE
      ];
      
      await DatabaseService.executeQuery(
        this.db,
        `UPDATE ${this.transactionsTable} SET ${setClause} WHERE id = ?`,
        values
      );
      
      // Déclencher la synchronisation
      await syncService.sync({
        tables: [this.transactionsTable],
        forceFullSync: false
      });
      
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la transaction ${id}:`, error);
      return false;
    }
  }

  /**
   * Supprimer une transaction (soft delete)
   * @param id ID de la transaction à supprimer
   * @returns true si la suppression a réussi, false sinon
   */
  public async deleteTransaction(id: string): Promise<boolean> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      // Vérifier si la transaction existe
      const [checkResult] = await DatabaseService.executeQuery(
        this.db,
        `SELECT * FROM ${this.transactionsTable} WHERE id = ?`,
        [id]
      );
      
      if (checkResult.rows.length === 0) {
        logger.warn(`Transaction introuvable avec l'ID ${id}`);
        return false;
      }
      
      // Démarrer une transaction SQL
      await DatabaseService.executeQuery(this.db, 'BEGIN TRANSACTION');
      
      try {
        // Mettre à jour pour soft delete
        const now = new Date().toISOString();
        
        // Supprimer la transaction principale
        await DatabaseService.executeQuery(
          this.db,
          `UPDATE ${this.transactionsTable} SET deleted_at = ?, updated_at = ?, synced = 0 WHERE id = ?`,
          [now, now, id]
        );
        
        // Supprimer les éléments de la transaction
        await DatabaseService.executeQuery(
          this.db,
          `UPDATE ${this.transactionItemsTable} SET deleted_at = ?, updated_at = ?, synced = 0 WHERE transaction_id = ?`,
          [now, now, id]
        );
        
        // Valider la transaction SQL
        await DatabaseService.executeQuery(this.db, 'COMMIT');
        
        // Déclencher la synchronisation
        await syncService.sync({
          tables: [this.transactionsTable, this.transactionItemsTable],
          forceFullSync: false
        });
        
        return true;
      } catch (error) {
        // Annuler la transaction SQL en cas d'erreur
        await DatabaseService.executeQuery(this.db, 'ROLLBACK');
        throw error;
      }
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la transaction ${id}:`, error);
      return false;
    }
  }

  /**
   * Obtenir les statistiques des transactions
   * @param filters Filtres optionnels (période, type, etc.)
   * @returns Statistiques des transactions
   */
  public async getTransactionStats(filters: any = {}): Promise<any> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      // Définir les conditions de filtrage
      let whereClause = 'deleted_at IS NULL';
      const params = [];
      
      if (filters.type) {
        whereClause += ' AND transaction_type = ?';
        params.push(filters.type);
      }
      
      if (filters.startDate) {
        whereClause += ' AND transaction_date >= ?';
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        whereClause += ' AND transaction_date <= ?';
        params.push(filters.endDate);
      }
      
      // Requêtes pour les statistiques
      const queries = {
        count: `SELECT COUNT(*) as count FROM ${this.transactionsTable} WHERE ${whereClause}`,
        total: `SELECT SUM(total_amount) as total FROM ${this.transactionsTable} WHERE ${whereClause}`,
        average: `SELECT AVG(total_amount) as average FROM ${this.transactionsTable} WHERE ${whereClause}`,
        byPaymentMethod: `
          SELECT payment_method, COUNT(*) as count, SUM(total_amount) as total 
          FROM ${this.transactionsTable} 
          WHERE ${whereClause} 
          GROUP BY payment_method
        `
      };
      
      // Exécuter les requêtes et recueillir les résultats
      const [countResult] = await DatabaseService.executeQuery(this.db, queries.count, params);
      const [totalResult] = await DatabaseService.executeQuery(this.db, queries.total, params);
      const [averageResult] = await DatabaseService.executeQuery(this.db, queries.average, params);
      const [paymentMethodsResult] = await DatabaseService.executeQuery(this.db, queries.byPaymentMethod, params);
      
      // Traiter les résultats des méthodes de paiement
      const paymentMethods = [];
      for (let i = 0; i < paymentMethodsResult.rows.length; i++) {
        paymentMethods.push(paymentMethodsResult.rows.item(i));
      }
      
      // Retourner les statistiques compilées
      return {
        count: countResult.rows.item(0).count || 0,
        totalAmount: totalResult.rows.item(0).total || 0,
        averageAmount: averageResult.rows.item(0).average || 0,
        paymentMethods
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques de transactions:', error);
      return {
        count: 0,
        totalAmount: 0,
        averageAmount: 0,
        paymentMethods: []
      };
    }
  }

  /**
   * Synchroniser les données entre la base locale et le serveur distant (implementation of BaseSyncService)
   */
  public async synchronize(forceFullSync: boolean = false, options?: SyncOptions & AdvancedSyncOptions): Promise<boolean> {
    try {
      logger.info(`Démarrage de la synchronisation des ${this.userFriendlyName}`);
      const result = await this.sync({
        ...options,
        forceFullSync,
      });
      return result.success;
    } catch (error) {
      logger.error(`Erreur lors de la synchronisation des ${this.userFriendlyName}:`, error);
      return false;
    }
  }
  
  /**
   * Obtenir les données depuis le serveur et les stocker localement
   */
  public async pullFromServer(forceFullSync: boolean = false, lastSyncTime?: Date, options?: AdvancedSyncOptions): Promise<number> {
    try {
      // Utilise le service global pour la synchronisation
      const result = await syncService.sync({
        tables: [this.transactionsTable, this.transactionItemsTable],
        forceFullSync,
      });
      
      // Retourne le nombre d'enregistrements synchronisés
      return result.totalSynced;
    } catch (error) {
      logger.error(`Erreur lors du pull des ${this.userFriendlyName}:`, error);
      return 0;
    }
  }
  
  /**
   * Envoyer les données locales vers le serveur
   */
  public async pushToServer(onlyModified: boolean = true, options?: AdvancedSyncOptions): Promise<number> {
    try {
      // Récupère les transactions à synchroniser
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      const query = onlyModified 
        ? `SELECT COUNT(*) as count FROM ${this.transactionsTable} WHERE synced = 0 AND deleted_at IS NULL`
        : `SELECT COUNT(*) as count FROM ${this.transactionsTable} WHERE deleted_at IS NULL`;
        
      const [result] = await DatabaseService.executeQuery(this.db, query);
      const countToSync = result.rows.item(0).count || 0;
      
      // Synchronise les données
      await syncService.sync({
        tables: [this.transactionsTable, this.transactionItemsTable],
        forceFullSync: false,
      });
      
      return countToSync;
    } catch (error) {
      logger.error(`Erreur lors du push des ${this.userFriendlyName}:`, error);
      return 0;
    }
  }
  
  /**
   * Créer la structure de table locale si elle n'existe pas
   */
  public async ensureLocalStructure(): Promise<void> {
    try {
      // Déjà fait dans initDatabase(), donc on appelle cette méthode
      if (!this.db) {
        await this.initDatabase();
      }
    } catch (error) {
      logger.error(`Erreur lors de la création de la structure locale pour ${this.userFriendlyName}:`, error);
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
          // Stratégie de fusion simple - priorité aux champs modifiés localement
          return {
            ...serverData,
            ...localData,
            updated_at: new Date().toISOString(),
            synced: 0
          };
        case 'ASK':
          // Retourne les deux versions pour que l'UI puisse demander à l'utilisateur
          return {
            local: localData,
            server: serverData,
            needsResolution: true
          };
        default:
          return serverData;
      }
    } catch (error) {
      logger.error(`Erreur lors de la résolution du conflit pour ${this.userFriendlyName}:`, error);
      // En cas d'erreur, priorité au serveur
      return serverData;
    }
  }
  
  /**
   * Synchroniser un lot de données
   */
  public async synchronizeBatch(batchIndex: number, batchSize: number, checkpoint?: SyncCheckpoint): Promise<SyncCheckpoint> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      // Initialiser le checkpoint ou le récupérer
      const currentCheckpoint: SyncCheckpoint = checkpoint || {
        batchIndex: 0,
        processedCount: 0,
        lastSyncTime: new Date(),
        completed: false
      };
      
      // Récupérer les enregistrements non synchronisés
      const [result] = await DatabaseService.executeQuery(
        this.db,
        `SELECT * FROM ${this.transactionsTable} WHERE synced = 0 AND deleted_at IS NULL LIMIT ? OFFSET ?`,
        [batchSize, batchIndex * batchSize]
      );
      
      // Vérifier s'il y a des enregistrements à traiter
      if (result.rows.length === 0) {
        currentCheckpoint.completed = true;
        return currentCheckpoint;
      }
      
      // Traiter le lot
      let processedCount = 0;
      for (let i = 0; i < result.rows.length; i++) {
        const transaction = result.rows.item(i);
        
        // Synchroniser cet enregistrement (simulation)
        await DatabaseService.executeQuery(
          this.db,
          `UPDATE ${this.transactionsTable} SET synced = 1 WHERE id = ?`,
          [transaction.id]
        );
        
        processedCount++;
      }
      
      // Mettre à jour le checkpoint
      currentCheckpoint.processedCount += processedCount;
      currentCheckpoint.batchIndex = batchIndex + 1;
      
      // Vérifier s'il reste des enregistrements à synchroniser
      const [countResult] = await DatabaseService.executeQuery(
        this.db,
        `SELECT COUNT(*) as count FROM ${this.transactionsTable} WHERE synced = 0 AND deleted_at IS NULL`
      );
      
      if (countResult.rows.item(0).count === 0) {
        currentCheckpoint.completed = true;
      }
      
      return currentCheckpoint;
    } catch (error) {
      logger.error(`Erreur lors de la synchronisation par lot pour ${this.userFriendlyName}:`, error);
      throw error;
    }
  }
  
  /**
   * Sauvegarder l'état actuel de la synchronisation pour reprise ultérieure
   */
  public async saveCheckpoint(checkpoint: SyncCheckpoint): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `transactions_sync_checkpoint`,
        JSON.stringify(checkpoint)
      );
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde du point de contrôle pour ${this.userFriendlyName}:`, error);
    }
  }
  
  /**
   * Charger l'état de la dernière synchronisation pour reprise
   */
  public async loadCheckpoint(): Promise<SyncCheckpoint | null> {
    try {
      const checkpointStr = await AsyncStorage.getItem(`transactions_sync_checkpoint`);
      return checkpointStr ? JSON.parse(checkpointStr) : null;
    } catch (error) {
      logger.error(`Erreur lors du chargement du point de contrôle pour ${this.userFriendlyName}:`, error);
      return null;
    }
  }
  
  // Méthodes pour l'interface BaseSyncService relatives au domaine métier
  
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
   * Obtenir la priorité de synchronisation
   */
  public getPriority(): SyncPriority {
    return this.syncPriority;
  }
}

// Exporter une instance singleton du service
const transactionSyncService = TransactionSyncService.getInstance();
export default transactionSyncService;