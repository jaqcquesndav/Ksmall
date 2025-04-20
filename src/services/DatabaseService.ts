import * as SQLite from 'expo-sqlite';
import { SQLResultSet } from 'expo-sqlite';
import logger from '../utils/logger';

/**
 * Service pour gérer les opérations de base de données SQLite
 */
class DatabaseService {
  private static DB_NAME = 'ksmall.db';
  private static instance: SQLite.WebSQLDatabase | null = null;

  /**
   * Obtenir l'instance de la base de données
   * @returns Instance de la base de données SQLite
   */
  static async getDatabase(): Promise<SQLite.WebSQLDatabase> {
    if (!this.instance) {
      try {
        this.instance = SQLite.openDatabase(this.DB_NAME);
        logger.debug('Base de données ouverte avec succès:', this.DB_NAME);
      } catch (error) {
        logger.error('Erreur lors de l\'ouverture de la base de données:', error);
        throw error;
      }
    }
    return this.instance;
  }
  
  /**
   * Méthode de compatibilité pour les autres services
   * @returns Instance de la base de données
   */
  static async getDBConnection(): Promise<SQLite.WebSQLDatabase> {
    return this.getDatabase();
  }

  /**
   * Exécuter une requête SQL
   * @param db Instance de la base de données
   * @param query Requête SQL à exécuter
   * @param params Paramètres de la requête
   * @returns Résultat de la requête
   */
  static executeQuery(
    db: SQLite.WebSQLDatabase,
    query: string,
    params: any[] = []
  ): Promise<[SQLResultSet, boolean]> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, result) => resolve([result, true]),
          (_, error) => {
            logger.error('Erreur d\'exécution SQL:', error);
            reject(error);
            return true; // Doit retourner true pour signaler que l'erreur a été gérée
          }
        );
      });
    });
  }

  /**
   * Créer une table si elle n'existe pas
   * @param db Instance de la base de données
   * @param tableName Nom de la table
   * @param columnsDefinition Définition des colonnes
   */
  static async createTableIfNotExists(
    db: SQLite.WebSQLDatabase,
    tableName: string,
    columnsDefinition: string
  ): Promise<void> {
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnsDefinition})`;
    
    try {
      await this.executeQuery(db, createTableQuery);
      logger.debug(`Table ${tableName} vérifiée/créée avec succès`);
    } catch (error) {
      logger.error(`Erreur lors de la création de la table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Initialiser la base de données (méthode de compatibilité avec App.tsx)
   */
  static async initDatabase(): Promise<void> {
    try {
      await this.initializeDatabase();
      logger.info('Base de données initialisée');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la base de données:', error);
      throw error;
    }
  }

  /**
   * Mise à jour des transactions avec calcul de total (méthode de compatibilité)
   */
  static async updateTransactionsWithTotal(): Promise<void> {
    try {
      const db = await this.getDatabase();
      // Cette fonction est vide car elle est juste pour la compatibilité
      // Dans une implémentation réelle, elle contiendrait la logique de mise à jour des transactions
      logger.debug('Mise à jour des transactions avec calcul de total (méthode factice)');
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des transactions:', error);
    }
  }

  /**
   * Initialiser la base de données (créer les tables nécessaires)
   */
  static async initializeDatabase(): Promise<void> {
    try {
      const db = await this.getDatabase();

      // Créer la table company_profile
      await this.createTableIfNotExists(
        db,
        'company_profile',
        `id INTEGER PRIMARY KEY,
        name TEXT,
        legal_form TEXT,
        registration_number TEXT,
        tax_id TEXT,
        id_nat TEXT,
        cnss_number TEXT,
        inpp_number TEXT,
        patent_number TEXT,
        phone TEXT,
        email TEXT, 
        website TEXT,
        logo TEXT,
        logo_last_modified TEXT,
        creation_date TEXT,
        employee_count INTEGER,
        address_street TEXT,
        address_city TEXT,
        address_postal_code TEXT,
        address_country TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
      );

      logger.info('Base de données initialisée avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la base de données:', error);
      throw error;
    }
  }
}

export default DatabaseService;
