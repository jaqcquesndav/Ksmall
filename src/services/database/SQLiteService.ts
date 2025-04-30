/**
 * Service SQLite pour gérer les opérations de base de données
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';

class SQLiteService {
  private static instance: SQLiteService;
  private db: SQLite.WebSQLDatabase | null = null;
  private readonly dbName = 'ksmall.db';

  private constructor() {
    // Constructeur privé pour empêcher l'instanciation directe
  }

  /**
   * Obtient l'instance unique du service SQLite (Singleton pattern)
   */
  public static getInstance(): SQLiteService {
    if (!SQLiteService.instance) {
      SQLiteService.instance = new SQLiteService();
    }
    return SQLiteService.instance;
  }

  /**
   * Initialise la connexion à la base de données
   */
  public async initialize(): Promise<void> {
    try {
      if (this.db) {
        return; // Déjà initialisé
      }

      this.db = SQLite.openDatabase(this.dbName);
      logger.info('Base de données SQLite initialisée avec succès');
      
      // Créer la table de file d'attente de synchronisation si elle n'existe pas
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          retry_count INTEGER DEFAULT 0,
          status TEXT NOT NULL,
          last_error TEXT
        );
      `);

      // Créer les index pour la file d'attente de synchronisation
      await this.executeQuery(`
        CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue (status);
      `);
      await this.executeQuery(`
        CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue (entity_type, entity_id);
      `);

      logger.info('Table de synchronisation initialisée avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la base de données SQLite', error);
      throw error;
    }
  }

  /**
   * Vérifie si la connexion à la base de données est active
   */
  private ensureConnection(): SQLite.WebSQLDatabase {
    if (!this.db) {
      throw new Error('La base de données n\'est pas initialisée. Appelez initialize() d\'abord.');
    }
    return this.db;
  }

  /**
   * Exécute une requête SQL avec des paramètres
   */
  public async executeQuery(query: string, params: any[] = []): Promise<SQLite.SQLResultSet> {
    return new Promise((resolve, reject) => {
      const db = this.ensureConnection();
      db.transaction(
        (tx) => {
          tx.executeSql(
            query,
            params,
            (_, result) => resolve(result),
            (_, error) => {
              logger.error(`Erreur SQL: ${query}`, error);
              reject(error);
              return false;
            }
          );
        },
        (error) => {
          logger.error('Erreur de transaction SQL', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Exécute plusieurs requêtes SQL dans une transaction unique
   */
  public async executeTransaction(
    queries: { query: string; params: any[] }[]
  ): Promise<SQLite.SQLResultSet[]> {
    return new Promise((resolve, reject) => {
      const db = this.ensureConnection();
      const results: SQLite.SQLResultSet[] = [];

      db.transaction(
        (tx) => {
          for (const { query, params } of queries) {
            tx.executeSql(
              query,
              params,
              (_, result) => {
                results.push(result);
              },
              (_, error) => {
                logger.error(`Erreur SQL dans transaction: ${query}`, error);
                reject(error);
                return false;
              }
            );
          }
        },
        (error) => {
          logger.error('Erreur de transaction SQL multiple', error);
          reject(error);
        },
        () => {
          resolve(results);
        }
      );
    });
  }

  /**
   * Sélectionne des données dans une table
   */
  public async select(
    table: string,
    columns: string[] = ['*'],
    whereClause: string = '',
    params: any[] = [],
    orderBy: string = '',
    limit: number = 0
  ): Promise<any[]> {
    let query = `SELECT ${columns.join(', ')} FROM ${table}`;

    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    if (limit > 0) {
      query += ` LIMIT ${limit}`;
    }

    try {
      const result = await this.executeQuery(query, params);
      const rows: any[] = [];

      // Convertir le résultat en tableau d'objets
      for (let i = 0; i < result.rows.length; i++) {
        rows.push(result.rows.item(i));
      }

      return rows;
    } catch (error) {
      logger.error(`Erreur lors de la sélection dans ${table}`, error);
      throw error;
    }
  }

  /**
   * Insère des données dans une table
   */
  public async insert(table: string, data: Record<string, any>): Promise<number> {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(column => data[column]);

    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    try {
      const result = await this.executeQuery(query, values);
      return result.insertId || 0;
    } catch (error) {
      logger.error(`Erreur lors de l'insertion dans ${table}`, error);
      throw error;
    }
  }

  /**
   * Met à jour des données dans une table
   */
  public async update(
    table: string,
    data: Record<string, any>,
    whereClause: string,
    params: any[]
  ): Promise<number> {
    const columns = Object.keys(data);
    const setClause = columns.map(column => `${column} = ?`).join(', ');
    const values = [...columns.map(column => data[column]), ...params];

    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;

    try {
      const result = await this.executeQuery(query, values);
      return result.rowsAffected;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour dans ${table}`, error);
      throw error;
    }
  }

  /**
   * Supprime des données d'une table
   */
  public async delete(
    table: string,
    whereClause: string,
    params: any[]
  ): Promise<number> {
    const query = `DELETE FROM ${table} WHERE ${whereClause}`;

    try {
      const result = await this.executeQuery(query, params);
      return result.rowsAffected;
    } catch (error) {
      logger.error(`Erreur lors de la suppression dans ${table}`, error);
      throw error;
    }
  }

  /**
   * Vérifie si une table existe dans la base de données
   */
  public async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.executeQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Erreur lors de la vérification de l'existence de la table ${tableName}`, error);
      throw error;
    }
  }

  /**
   * Obtient le schéma d'une table (informations sur les colonnes)
   */
  public async getTableSchema(tableName: string): Promise<any[]> {
    try {
      const result = await this.executeQuery(`PRAGMA table_info(${tableName});`);
      const columns = [];
      
      for (let i = 0; i < result.rows.length; i++) {
        columns.push(result.rows.item(i));
      }
      
      return columns;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du schéma de la table ${tableName}`, error);
      throw error;
    }
  }

  /**
   * Ferme la connexion à la base de données
   */
  public async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.closeAsync();
        logger.info('Connexion à la base de données fermée');
        this.db = null;
      } catch (error) {
        logger.error('Erreur lors de la fermeture de la connexion à la base de données', error);
        throw error;
      }
    }
  }
}

// Export une instance unique du service
export default SQLiteService.getInstance();