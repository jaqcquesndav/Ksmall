import * as SQLite from 'expo-sqlite';
import { GenericSyncService } from './GenericSyncService';
import DatabaseService from '../DatabaseService';
import logger from '../../utils/logger';

/**
 * Service de synchronisation spécifique pour les clients
 */
export class ClientSyncService extends GenericSyncService {
  /**
   * Initialiser le service de synchronisation des clients
   */
  constructor() {
    // Appel du constructeur parent avec les paramètres spécifiques
    super('clients', '/api/clients', 'id');
  }
  
  /**
   * Créer la structure de table clients si elle n'existe pas
   */
  public async ensureLocalStructure(): Promise<void> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      await DatabaseService.createTableIfNotExists(
        this.db,
        this.tableName,
        `id INTEGER PRIMARY KEY AUTOINCREMENT,
        remote_id TEXT,
        code TEXT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        tax_id TEXT,
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        credit_limit REAL DEFAULT 0,
        balance REAL DEFAULT 0,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        last_purchase_at TIMESTAMP,
        is_dirty INTEGER DEFAULT 0,
        created_locally INTEGER DEFAULT 0,
        last_sync TIMESTAMP,
        sync_status TEXT DEFAULT 'pending'`
      );
      
      // Créer les index nécessaires pour de meilleures performances
      await DatabaseService.createIndexIfNotExists(
        this.db, 
        'idx_clients_remote_id', 
        this.tableName, 
        'remote_id'
      );
      
      await DatabaseService.createIndexIfNotExists(
        this.db, 
        'idx_clients_code', 
        this.tableName, 
        'code'
      );
      
      await DatabaseService.createIndexIfNotExists(
        this.db, 
        'idx_clients_is_dirty', 
        this.tableName, 
        'is_dirty'
      );
      
      logger.debug('Structure de la table clients initialisée');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la structure de la table clients:', error);
      throw error;
    }
  }
  
  /**
   * Insérer un nouveau client dans la base de données locale
   */
  protected insertItem(tx: SQLite.SQLTransaction, item: any): void {
    const now = new Date().toISOString();
    
    tx.executeSql(
      `INSERT INTO ${this.tableName} (
        remote_id, code, name, email, phone, address, city, country, 
        tax_id, notes, is_active, credit_limit, balance,
        created_at, updated_at, last_purchase_at, 
        is_dirty, created_locally, last_sync, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'synced')`,
      [
        item.id || null,
        item.code || null,
        item.name,
        item.email || null,
        item.phone || null,
        item.address || null,
        item.city || null,
        item.country || null,
        item.tax_id || null,
        item.notes || null,
        item.is_active ? 1 : 0,
        item.credit_limit || 0,
        item.balance || 0,
        item.created_at || now,
        item.updated_at || now,
        item.last_purchase_at || null,
        now
      ],
      (_, result) => {
        logger.debug(`Client inséré: ${result.insertId}`);
      },
      (_, error) => {
        logger.error(`Erreur lors de l'insertion du client ${item.id || 'nouveau'}:`, error);
        return true; // Indiquer que l'erreur a été gérée
      }
    );
  }
  
  /**
   * Mettre à jour un client existant dans la base de données locale
   */
  protected updateItem(tx: SQLite.SQLTransaction, item: any): void {
    const now = new Date().toISOString();
    
    tx.executeSql(
      `UPDATE ${this.tableName} SET
        code = ?, name = ?, email = ?, phone = ?, address = ?, 
        city = ?, country = ?, tax_id = ?, notes = ?, 
        is_active = ?, credit_limit = ?, balance = ?,
        updated_at = ?, last_purchase_at = ?, 
        is_dirty = 0, last_sync = ?, sync_status = 'synced'
      WHERE remote_id = ?`,
      [
        item.code || null,
        item.name,
        item.email || null,
        item.phone || null,
        item.address || null,
        item.city || null,
        item.country || null,
        item.tax_id || null,
        item.notes || null,
        item.is_active ? 1 : 0,
        item.credit_limit || 0,
        item.balance || 0,
        item.updated_at || now,
        item.last_purchase_at || null,
        now,
        item.id
      ],
      (_, result) => {
        if (result.rowsAffected > 0) {
          logger.debug(`Client mis à jour: ${item.id}`);
        } else {
          // Si aucune ligne n'est affectée, c'est peut-être parce que le client n'existe pas localement avec cet ID distant
          // Dans ce cas, on essaie de le retrouver par d'autres champs (comme le code)
          tx.executeSql(
            `UPDATE ${this.tableName} SET
              remote_id = ?, code = ?, name = ?, email = ?, phone = ?, address = ?, 
              city = ?, country = ?, tax_id = ?, notes = ?, 
              is_active = ?, credit_limit = ?, balance = ?,
              updated_at = ?, last_purchase_at = ?, 
              is_dirty = 0, last_sync = ?, sync_status = 'synced'
            WHERE code = ? AND remote_id IS NULL`,
            [
              item.id,
              item.code || null,
              item.name,
              item.email || null,
              item.phone || null,
              item.address || null,
              item.city || null,
              item.country || null,
              item.tax_id || null,
              item.notes || null,
              item.is_active ? 1 : 0,
              item.credit_limit || 0,
              item.balance || 0,
              item.updated_at || now,
              item.last_purchase_at || null,
              now,
              item.code
            ],
            (_, innerResult) => {
              if (innerResult.rowsAffected > 0) {
                logger.debug(`Client mis à jour via code: ${item.id}`);
              } else {
                // Si toujours pas de correspondance, on insère comme nouveau
                this.insertItem(tx, item);
              }
            },
            (_, error) => {
              logger.error(`Erreur lors de la mise à jour du client par code ${item.id}:`, error);
              return true;
            }
          );
        }
      },
      (_, error) => {
        logger.error(`Erreur lors de la mise à jour du client ${item.id}:`, error);
        return true;
      }
    );
  }
  
  /**
   * Préparer les données du client pour la synchronisation
   */
  protected prepareDataForSync(item: any): any {
    const data = { ...item };
    
    // Supprimer les champs locaux
    delete data.id;  // Supprimer l'ID local
    delete data.is_dirty;
    delete data.created_locally;
    delete data.last_sync;
    delete data.sync_status;
    
    // Renommer l'ID distant pour correspondre à l'API
    if (data.remote_id) {
      data.id = data.remote_id;
      delete data.remote_id;
    }
    
    // Convertir les valeurs booléennes et numériques au format approprié
    data.is_active = data.is_active === 1;
    data.credit_limit = parseFloat(data.credit_limit || 0);
    data.balance = parseFloat(data.balance || 0);
    
    return data;
  }
  
  /**
   * Rechercher des clients par nom ou code
   */
  public async searchClients(term: string, limit: number = 20): Promise<any[]> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE name LIKE ? OR code LIKE ?
        ORDER BY name ASC
        LIMIT ?
      `;
      
      const searchTerm = `%${term}%`;
      const [result] = await DatabaseService.executeQuery(
        this.db, 
        query, 
        [searchTerm, searchTerm, limit]
      );
      
      const clients = [];
      for (let i = 0; i < result.rows.length; i++) {
        clients.push(result.rows.item(i));
      }
      
      return clients;
    } catch (error) {
      logger.error('Erreur lors de la recherche de clients:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir un client par ID
   */
  public async getClientById(id: number): Promise<any | null> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      const [result] = await DatabaseService.executeQuery(
        this.db, 
        `SELECT * FROM ${this.tableName} WHERE id = ?`, 
        [id]
      );
      
      return result.rows.length > 0 ? result.rows.item(0) : null;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du client ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Créer un nouveau client localement
   */
  public async createClient(clientData: any): Promise<number> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      const now = new Date().toISOString();
      
      const [result] = await DatabaseService.executeQuery(
        this.db,
        `INSERT INTO ${this.tableName} (
          name, code, email, phone, address, city, country, 
          tax_id, notes, is_active, credit_limit,
          created_at, updated_at, 
          is_dirty, created_locally, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'pending')`,
        [
          clientData.name,
          clientData.code || null,
          clientData.email || null,
          clientData.phone || null,
          clientData.address || null,
          clientData.city || null,
          clientData.country || null,
          clientData.tax_id || null,
          clientData.notes || null,
          clientData.is_active ? 1 : 0,
          clientData.credit_limit || 0,
          now,
          now
        ]
      );
      
      const id = result.insertId || 0;
      
      // Si autoSync est activé, tenter une synchronisation immédiate
      await this.pushToServer(true);
      
      return id;
    } catch (error) {
      logger.error('Erreur lors de la création du client:', error);
      throw error;
    }
  }
  
  /**
   * Mettre à jour un client localement
   */
  public async updateClient(id: number, clientData: any): Promise<boolean> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      const now = new Date().toISOString();
      
      const [result] = await DatabaseService.executeQuery(
        this.db,
        `UPDATE ${this.tableName} SET
          name = ?, code = ?, email = ?, phone = ?, address = ?, 
          city = ?, country = ?, tax_id = ?, notes = ?, 
          is_active = ?, credit_limit = ?,
          updated_at = ?, is_dirty = 1, sync_status = 'pending'
        WHERE id = ?`,
        [
          clientData.name,
          clientData.code || null,
          clientData.email || null,
          clientData.phone || null,
          clientData.address || null,
          clientData.city || null,
          clientData.country || null,
          clientData.tax_id || null,
          clientData.notes || null,
          clientData.is_active ? 1 : 0,
          clientData.credit_limit || 0,
          now,
          id
        ]
      );
      
      const success = result.rowsAffected > 0;
      
      // Si autoSync est activé, tenter une synchronisation immédiate
      if (success) {
        await this.pushToServer(true);
      }
      
      return success;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du client ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Marquer un client comme supprimé
   * Note: Nous ne supprimons pas réellement les enregistrements pour maintenir l'intégrité des données
   */
  public async deleteClient(id: number): Promise<boolean> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      const now = new Date().toISOString();
      
      const [result] = await DatabaseService.executeQuery(
        this.db,
        `UPDATE ${this.tableName} SET
          is_active = 0, is_dirty = 1, updated_at = ?, sync_status = 'pending'
        WHERE id = ?`,
        [now, id]
      );
      
      const success = result.rowsAffected > 0;
      
      // Si autoSync est activé, tenter une synchronisation immédiate
      if (success) {
        await this.pushToServer(true);
      }
      
      return success;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du client ${id}:`, error);
      throw error;
    }
  }
}

// Créer une instance singleton
const clientSyncService = new ClientSyncService();
export default clientSyncService;