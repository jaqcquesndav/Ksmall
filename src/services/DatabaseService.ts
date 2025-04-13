import * as SQLite from 'expo-sqlite';
// Remove any direct hook imports like useAuth
// import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

// Définir les tables et les schémas
const DATABASE_NAME = 'ksmall.db';
const DATABASE_VERSION = 1;

interface SQLResult {
  rows: {
    _array: any[];
    length: number;
  };
  rowsAffected: number;
  insertId?: number;
}

class DatabaseService {
  private db: SQLite.Database | null = null;
  private isInitialized: boolean = false;
  private mockDataLoaded: boolean = false;
  // Store user data directly instead of using hooks
  private currentUser: any = null;

  constructor() {
    logger.info('Service de base de données initialisé');
  }

  // Add a method to set the current user
  setCurrentUser(user: any) {
    this.currentUser = user;
    logger.debug('User set in DatabaseService:', user?.email || 'null');
  }

  // Replace any useAuth() calls with references to this.currentUser
  private isUserDemo(): boolean {
    return this.currentUser?.isDemo === true;
  }

  /**
   * Initialise la base de données et crée les tables si nécessaires
   */
  async initDatabase(): Promise<boolean> {
    try {
      logger.info(`Initialisation de la base de données ${DATABASE_NAME}`);

      // Ouvrir ou créer la base de données
      this.db = SQLite.openDatabase(DATABASE_NAME);
      
      // Vérifier si la base de données est déjà configurée
      const versionResult = await this.executeSql(
        'PRAGMA user_version;'
      );
      
      const currentVersion = versionResult?.[0]?.user_version || 0;
      logger.debug(`Version actuelle de la base de données: ${currentVersion}`);

      if (currentVersion < DATABASE_VERSION) {
        logger.info(`Mise à jour de la base de données de la version ${currentVersion} à ${DATABASE_VERSION}`);
        await this.setupDatabase();
        
        // Mettre à jour la version
        await this.executeSql(`PRAGMA user_version = ${DATABASE_VERSION};`);
      }

      // Si l'utilisateur est le compte de démo, charger les données de test
      if (this.isUserDemo() && !this.mockDataLoaded) {
        await this.loadMockData();
        this.mockDataLoaded = true;
      }

      this.isInitialized = true;
      logger.info('Base de données initialisée avec succès');
      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la base de données', error);
      return false;
    }
  }

  /**
   * Configure les tables et les données initiales
   */
  private async setupDatabase(): Promise<void> {
    logger.debug('Configuration de la base de données');
    
    // Créer les tables nécessaires
    await this.createTables();
    
    // Ajouter des données de démonstration pour le développement
    if (__DEV__) {
      await this.insertSampleData();
    }
  }

  /**
   * Crée toutes les tables nécessaires
   */
  private async createTables(): Promise<void> {
    logger.debug('Création des tables');

    // Table des comptes
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL DEFAULT 0,
        currency TEXT DEFAULT 'USD',
        provider TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table des transactions
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      );
    `);

    // Table pour les écritures comptables
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reference TEXT,
        description TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table pour les lignes d'écritures
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS journal_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER,
        account_code TEXT NOT NULL,
        description TEXT,
        debit REAL DEFAULT 0,
        credit REAL DEFAULT 0,
        tax_code TEXT,
        FOREIGN KEY (entry_id) REFERENCES journal_entries(id)
      );
    `);

    // Table pour les articles d'inventaire
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        quantity REAL DEFAULT 0,
        price REAL DEFAULT 0,
        cost REAL DEFAULT 0,
        category TEXT,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  /**
   * Charge les données fictives pour le compte de démonstration
   */
  private async loadMockData(): Promise<void> {
    logger.info('Chargement des données de démonstration');

    try {
      // Vider les tables existantes
      await this.executeSql('DELETE FROM transactions');
      await this.executeSql('DELETE FROM accounts');
      
      // Insérer des comptes de démonstration
      await this.executeSql(`
        INSERT INTO accounts (name, type, balance, currency, provider) VALUES 
        ('Compte Courant', 'checking', 3750.42, 'EUR', 'BanquePopulaire'),
        ('Compte Épargne', 'savings', 15230.87, 'EUR', 'BanquePopulaire'),
        ('Carte Crédit', 'credit', -1245.30, 'EUR', 'Visa'),
        ('Investissements', 'investment', 8500.00, 'EUR', 'BourseDirect');
      `);
      
      // Insérer des transactions de démonstration
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      await this.executeSql(`
        INSERT INTO transactions (account_id, description, amount, date, category) VALUES 
        (1, 'Salaire Mai 2023', 2800.00, ?, 'Revenu'),
        (1, 'Loyer Appartement', -850.00, ?, 'Logement'),
        (1, 'Courses Supermarché', -125.42, ?, 'Alimentation'),
        (1, 'Restaurant Le Gourmet', -78.50, ?, 'Sorties'),
        (1, 'Facture Électricité', -95.30, ?, 'Factures'),
        (3, 'Achat Amazon', -149.99, ?, 'Shopping'),
        (3, 'Abonnement Netflix', -12.99, ?, 'Abonnements'),
        (1, 'Transfert Épargne', -500.00, ?, 'Transferts'),
        (2, 'Transfert du Compte Courant', 500.00, ?, 'Transferts'),
        (1, 'Retrait DAB', -100.00, ?, 'Retraits');
      `, [
        lastWeek.toISOString(),
        lastWeek.toISOString(),
        yesterday.toISOString(),
        yesterday.toISOString(),
        today.toISOString(),
        yesterday.toISOString(),
        today.toISOString(),
        yesterday.toISOString(),
        yesterday.toISOString(),
        today.toISOString()
      ]);
      
      logger.info('Données de démonstration chargées avec succès');
    } catch (error) {
      logger.error('Erreur lors du chargement des données de démonstration', error);
      throw error;
    }
  }

  /**
   * Insère des données d'exemple pour le développement
   */
  private async insertSampleData(): Promise<void> {
    logger.debug('Insertion des données d\'exemple');
    
    try {
      // Vérifier si des données existent déjà
      const existingAccounts = await this.executeSql('SELECT COUNT(*) as count FROM accounts');
      if (existingAccounts?.[0]?.count > 0) {
        logger.debug('Les données d\'exemple existent déjà');
        return;
      }

      // Insérer des exemples de comptes
      await this.executeSql(`
        INSERT INTO accounts (name, type, balance, currency, provider) VALUES 
        ('Compte Courant', 'checking', 2500.75, 'USD', 'BankOne'),
        ('Épargne', 'savings', 12750.42, 'USD', 'BankOne'),
        ('Carte de Crédit', 'credit', -450.30, 'USD', 'CreditCorp'),
        ('Investissements', 'investment', 5430.20, 'USD', 'InvestFirm');
      `);

      // Insérer des exemples de transactions
      await this.executeSql(`
        INSERT INTO transactions (account_id, description, amount, date, category) VALUES 
        (1, 'Salaire Avril', 3200.00, '2023-04-25 10:00:00', 'Revenu'),
        (1, 'Location Appartement', -1200.00, '2023-05-01 09:30:00', 'Logement'),
        (1, 'Supermarché', -85.42, '2023-05-02 18:20:00', 'Alimentation'),
        (1, 'Restaurant', -45.80, '2023-05-03 20:15:00', 'Restaurants'),
        (3, 'Achat Amazon', -120.35, '2023-05-04 12:30:00', 'Shopping');
      `);

      // Insérer des exemples d'articles d'inventaire
      await this.executeSql(`
        INSERT INTO inventory_items (sku, name, description, quantity, price, cost, category, location) VALUES 
        ('PROD-001', 'Produit A', 'Description produit A', 25, 19.99, 10.50, 'Électronique', 'Entrepôt A'),
        ('PROD-002', 'Produit B', 'Description produit B', 15, 29.99, 15.75, 'Électronique', 'Entrepôt A'),
        ('PROD-003', 'Produit C', 'Description produit C', 50, 9.99, 5.25, 'Fournitures', 'Entrepôt B');
      `);

      logger.debug('Données d\'exemple insérées avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'insertion des données d\'exemple', error);
    }
  }

  /**
   * Exécute une requête SQL et retourne les résultats
   */
  async executeSql(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) {
      throw new Error('Base de données non initialisée');
    }

    logger.debug(`Exécution SQL: ${sql.slice(0, 100)}${sql.length > 100 ? '...' : ''}`, { params });

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          sql, 
          params,
          (_, result) => resolve(result.rows._array),
          (_, error) => {
            logger.error(`Erreur SQL: ${sql}`, error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Vérifie si la base de données est initialisée
   */
  isDbInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Exécute une requête SQL avec gestion robuste des erreurs
   */
  async executeQuery(query: string, params: any[] = []): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        logger.warn('Tentative d\'exécuter une requête sur une base de données non initialisée');
        
        // Tentative d'initialisation automatique
        const initialized = await this.initDatabase();
        if (!initialized) {
          throw new Error('La base de données n\'a pas pu être initialisée');
        }
      }
      
      return await this.executeSql(query, params);
    } catch (error) {
      logger.error(`Erreur lors de l'exécution de la requête: ${query}`, error);
      
      return [];
    }
  }
}

export default new DatabaseService();
