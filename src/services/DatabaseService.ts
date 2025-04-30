import * as SQLite from 'expo-sqlite';
// Remove direct import of SQLResultSet and use SQLite.SQLResultSet instead
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
  ): Promise<[SQLite.SQLResultSet, boolean]> {
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
   * Convertit un SQLResultSet en tableau d'objets
   * @param resultSet Résultat de la requête SQLite
   * @returns Tableau d'objets typés
   */
  static mapResultSetToArray<T>(resultSet: SQLite.SQLResultSet): T[] {
    const { rows } = resultSet;
    const result: T[] = [];
    
    for (let i = 0; i < rows.length; i++) {
      result.push(rows.item(i) as T);
    }
    
    return result;
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
   * Ajouter une colonne à une table si elle n'existe pas déjà
   * @param db Instance de la base de données
   * @param tableName Nom de la table
   * @param columnName Nom de la colonne
   * @param columnType Type de la colonne
   */
  static async addColumnIfNotExists(
    db: SQLite.WebSQLDatabase,
    tableName: string,
    columnName: string,
    columnType: string
  ): Promise<void> {
    try {
      // Vérifier si la colonne existe déjà
      const [result] = await this.executeQuery(
        db,
        `PRAGMA table_info(${tableName})`,
        []
      );
      
      let columnExists = false;
      if (result && result.rows && result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          if (result.rows.item(i).name === columnName) {
            columnExists = true;
            break;
          }
        }
      }
      
      // Ajouter la colonne si elle n'existe pas
      if (!columnExists) {
        await this.executeQuery(
          db,
          `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`,
          []
        );
        logger.debug(`Colonne ${columnName} ajoutée à la table ${tableName}`);
      }
    } catch (error) {
      logger.error(`Erreur lors de l'ajout de la colonne ${columnName} à la table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Exécuter les migrations nécessaires de la base de données
   */
  static async runMigrations(): Promise<void> {
    try {
      const db = await this.getDatabase();
      
      // Vérifier si la table company_profile existe
      const [tableCheck] = await this.executeQuery(
        db,
        "SELECT name FROM sqlite_master WHERE type='table' AND name='company_profile'",
        []
      );
      
      if (tableCheck?.rows?.length > 0) {
        // Ajouter la colonne user_id à la table company_profile si elle n'existe pas déjà
        await this.addColumnIfNotExists(db, 'company_profile', 'user_id', 'TEXT');
      }
      
      // Migrer la table user_profile
      await this.migrateUserProfileTable();
      
      logger.info('Migrations de base de données exécutées avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'exécution des migrations de base de données:', error);
      throw error;
    }
  }

  /**
   * Migrer la table user_profile pour ajouter les colonnes manquantes
   */
  static async migrateUserProfileTable(): Promise<void> {
    try {
      const db = await this.getDatabase();
      
      // Vérifier si la table user_profile existe
      const [tableExists] = await this.executeQuery(
        db,
        "SELECT name FROM sqlite_master WHERE type='table' AND name='user_profile'",
        []
      );
      
      if (!tableExists || tableExists.rows.length === 0) {
        // La table n'existe pas encore, elle sera créée correctement lors de l'initialisation
        logger.debug("La table user_profile n'existe pas encore, pas besoin de migration");
        return;
      }
      
      // Ajouter les colonnes nécessaires
      await this.addColumnIfNotExists(db, 'user_profile', 'display_name', 'TEXT');
      await this.addColumnIfNotExists(db, 'user_profile', 'email', 'TEXT');
      await this.addColumnIfNotExists(db, 'user_profile', 'phone_number', 'TEXT');
      await this.addColumnIfNotExists(db, 'user_profile', 'photo_url', 'TEXT');
      await this.addColumnIfNotExists(db, 'user_profile', 'language', 'TEXT');
      
      logger.info("Migration de la table user_profile terminée avec succès");
    } catch (error) {
      logger.error("Erreur lors de la migration de la table user_profile:", error);
      throw error;
    }
  }

  /**
   * Initialiser la base de données (méthode de compatibilité avec App.tsx)
   */
  static async initDatabase(): Promise<void> {
    try {
      await this.initializeDatabase();
      await this.runMigrations();
      logger.info('Base de données initialisée et migrée avec succès');
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
        user_id TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
      );

      // Créer la table user_profile si elle n'existe pas
      await this.createTableIfNotExists(
        db,
        'user_profile',
        `id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        display_name TEXT,
        email TEXT,
        phone_number TEXT,
        photo_url TEXT,
        language TEXT,
        theme TEXT,
        preferences TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
      );
      
      // Créer la table subscription si elle n'existe pas
      await this.createTableIfNotExists(
        db,
        'subscription',
        `id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        status TEXT NOT NULL,
        start_date TEXT NOT NULL,
        expiry_date TEXT NOT NULL,
        payment_method TEXT,
        payment_id TEXT,
        price REAL,
        currency TEXT,
        auto_renew INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
