import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import logger from '../utils/logger';

interface QueryResult {
  rows: {
    length: number;
    item: (idx: number) => any;
    _array?: any[];
  };
  rowsAffected: number;
  insertId?: number;
}

class DatabaseService {
  private DB_NAME = 'ksmall.db';
  private DB_VERSION = 1;
  
  async getDBConnection(): Promise<SQLite.WebSQLDatabase> {
    return SQLite.openDatabase(this.DB_NAME);
  }
  
  async executeQuery(
    db: SQLite.WebSQLDatabase,
    query: string,
    params: any[] = []
  ): Promise<[QueryResult | undefined, Error | null]> {
    return new Promise((resolve) => {
      logger.debug(`Exécution SQL: ${query}`, { params });
      
      db.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, result) => {
            resolve([result, null]);
          },
          (_, error) => {
            // Create a proper Error from SQLError
            const sqlError = new Error(error.message);
            // Copy properties from SQLError to the new Error
            Object.assign(sqlError, error);
            
            logger.error(`Erreur SQL: ${error.message}`, { query, params });
            resolve([undefined, sqlError]);
            return true; // Nécessaire pour indiquer que l'erreur a été gérée
          }
        );
      });
    });
  }
  
  async initDatabase(): Promise<void> {
    try {
      const db = await this.getDBConnection();
      
      // Check if database exists and has the right schema
      let needsInitialization = false;
      
      try {
        // Try to access the users table - if this fails, we need to initialize
        const [usersTableCheck] = await this.executeQuery(
          db,
          'SELECT name FROM sqlite_master WHERE type="table" AND name="users"',
          []
        );
        
        needsInitialization = !usersTableCheck || usersTableCheck.rows.length === 0;
        logger.debug(`Database initialization needed: ${needsInitialization}`);
      } catch (error) {
        logger.warn("Error checking database schema, will initialize:", error);
        needsInitialization = true;
      }
      
      if (needsInitialization) {
        logger.info("Initializing database from scratch");
        
        // Force migration to create all tables
        await this.runMigration(db, 1);
        
        // Set the database version
        await this.executeQuery(
          db,
          `PRAGMA user_version = ${this.DB_VERSION}`,
          []
        );
        
        // Load demo data now that tables exist
        await this.loadDemoData(db);
      }
      
      logger.info(`Database initialized successfully`);
    } catch (error) {
      logger.error(`Database initialization error`, error);
      throw error;
    }
  }
  
  private async runMigration(
    db: SQLite.WebSQLDatabase,
    version: number
  ): Promise<void> {
    logger.debug(`Exécution de la migration ${version}`);
    
    try {
      switch (version) {
        case 1:
          // Make sure we execute each statement separately for better error handling
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              display_name TEXT NOT NULL,
              email TEXT NOT NULL UNIQUE,
              phone_number TEXT,
              photo_url TEXT,
              position TEXT,
              language TEXT DEFAULT 'fr',
              is_current INTEGER DEFAULT 0
            )`,
            []
          );
          
          logger.info("Table 'users' created successfully");
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS accounts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              type TEXT NOT NULL,
              balance REAL DEFAULT 0,
              currency TEXT DEFAULT 'XOF',
              provider TEXT
            )`,
            []
          );
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS transactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              account_id INTEGER,
              description TEXT,
              amount REAL NOT NULL,
              date TEXT NOT NULL,
              category TEXT,
              FOREIGN KEY (account_id) REFERENCES accounts (id)
            )`,
            []
          );
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS journal_entries (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              reference TEXT,
              date TEXT NOT NULL,
              description TEXT,
              status TEXT DEFAULT 'pending'
            )`,
            []
          );
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS journal_entry_lines (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              entry_id INTEGER,
              account_code TEXT NOT NULL,
              description TEXT,
              debit REAL DEFAULT 0,
              credit REAL DEFAULT 0,
              FOREIGN KEY (entry_id) REFERENCES journal_entries (id)
            )`,
            []
          );
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS inventory_items (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              sku TEXT,
              category TEXT,
              subcategory TEXT,
              quantity INTEGER DEFAULT 0,
              price REAL DEFAULT 0,
              cost REAL DEFAULT 0,
              reorder_point INTEGER DEFAULT 0,
              image_url TEXT,
              description TEXT,
              supplier TEXT,
              location TEXT
            )`,
            []
          );
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS notifications (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              message TEXT,
              type TEXT,
              is_read INTEGER DEFAULT 0,
              created_at TEXT NOT NULL
            )`,
            []
          );
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS user_metrics (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER,
              metric_name TEXT NOT NULL,
              value TEXT,
              updated_at TEXT NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users (id)
            )`,
            []
          );
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS subscription (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER,
              plan_name TEXT NOT NULL,
              features TEXT,
              created_at TEXT NOT NULL,
              expiry_date TEXT NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users (id)
            )`,
            []
          );
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS conversations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              mode TEXT DEFAULT 'regular'
            )`,
            []
          );
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              conversation_id INTEGER,
              content TEXT,
              message_type TEXT NOT NULL,
              is_user INTEGER NOT NULL,
              timestamp TEXT NOT NULL,
              attachments TEXT,
              additional_data TEXT,
              FOREIGN KEY (conversation_id) REFERENCES conversations (id)
            )`,
            []
          );
          
          // Insert a demo user if not exists
          const [userExists] = await this.executeQuery(
            db,
            'SELECT COUNT(*) as count FROM users WHERE email = ?',
            ['demo@example.com']
          );
          
          if (!userExists || userExists.rows.item(0).count === 0) {
            await this.executeQuery(
              db,
              `INSERT INTO users (display_name, email, phone_number, position, is_current)
              VALUES (?, ?, ?, ?, ?)`,
              ['Utilisateur Démo', 'demo@example.com', '+22500000000', 'Gestionnaire', 1]
            );
            logger.info("Demo user created");
          }
          
          break;
          
        // Other migrations for future versions
      }
    } catch (error) {
      logger.error("Error during migration:", error);
      throw error; // Re-throw to handle in the calling function
    }
  }
  
  private async loadDemoData(db: SQLite.WebSQLDatabase): Promise<void> {
    logger.info('Chargement des données de démonstration');
    
    // Vider les tables existantes pour éviter les doublons
    await this.executeQuery(db, 'DELETE FROM transactions', []);
    await this.executeQuery(db, 'DELETE FROM accounts', []);
    
    // Créer les comptes de démo
    await this.executeQuery(
      db,
      `
        INSERT INTO accounts (name, type, balance, currency, provider) VALUES
        ('Compte Courant', 'cash', 1500000, 'XOF', 'Ecobank'),
        ('Compte Épargne', 'cash', 1000000, 'XOF', 'SGBCI'),
        ('Clients', 'receivable', 1750000, 'XOF', null),
        ('Fournisseurs', 'payable', 950000, 'XOF', null)
      `,
      []
    );
    
    // Créer un utilisateur démo
    const [userExists] = await this.executeQuery(
      db,
      'SELECT COUNT(*) as count FROM users WHERE email = ?',
      ['demo@example.com']
    );
    
    if (userExists?.rows?.item(0).count === 0) {
      await this.executeQuery(
        db,
        `
          INSERT INTO users (display_name, email, phone_number, position, is_current)
          VALUES (?, ?, ?, ?, ?)
        `,
        ['Utilisateur Démo', 'demo@example.com', '+22500000000', 'Gestionnaire', 1]
      );
    }
    
    // Créer des métriques utilisateur
    await this.executeQuery(
      db,
      'DELETE FROM user_metrics',
      []
    );
    
    const now = new Date().toISOString();
    
    await this.executeQuery(
      db,
      `
        INSERT INTO user_metrics (user_id, metric_name, value, updated_at)
        VALUES 
        (1, 'credit_score', '78', ?),
        (1, 'esg_rating', 'B+', ?)
      `,
      [now, now]
    );
    
    // Créer un abonnement
    await this.executeQuery(
      db,
      'DELETE FROM subscription',
      []
    );
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    
    await this.executeQuery(
      db,
      `
        INSERT INTO subscription (user_id, plan_name, features, created_at, expiry_date)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        1, 
        'Premium', 
        JSON.stringify(['Comptabilité avancée', 'Support prioritaire', 'Rapports illimités', 'API accès']),
        now,
        expiryDate.toISOString()
      ]
    );
    
    // Créer quelques transactions démo
    const dates = [];
    const futureDate = new Date();
    for (let i = 0; i < 10; i++) {
      futureDate.setDate(futureDate.getDate() + (i % 2 === 0 ? 6 : 1));
      dates.push(futureDate.toISOString());
    }
    
    await this.executeQuery(
      db,
      `
        INSERT INTO transactions (account_id, description, amount, date, category) VALUES
        (1, 'Paiement client ABC', 350000, ?, 'revenue'),
        (1, 'Achat fournitures', -75000, ?, 'expense'),
        (2, 'Transfert épargne', 200000, ?, 'transfer'),
        (1, 'Paiement fournisseur XYZ', -120000, ?, 'expense'),
        (1, 'Vente de services', 450000, ?, 'revenue'),
        (3, 'Facture client DEF', 350000, ?, 'revenue'),
        (4, 'Facture fournisseur UVW', 170000, ?, 'expense'),
        (1, 'Paiement salaires', -650000, ?, 'expense'),
        (1, 'Frais bancaires', -15000, ?, 'expense'),
        (3, 'Contrat client GHI', 500000, ?, 'revenue')
      `,
      dates
    );
    
    // Créer des écritures comptables démo
    await this.executeQuery(
      db,
      'DELETE FROM journal_entries',
      []
    );
    
    await this.executeQuery(
      db,
      'DELETE FROM journal_entry_lines',
      []
    );
    
    await this.executeQuery(
      db,
      `
        INSERT INTO journal_entries (reference, date, description, status) VALUES
        ('JE-2023-001', '2023-10-01', 'Achat de matériel informatique', 'validated'),
        ('JE-2023-002', '2023-10-05', 'Paiement de loyer', 'validated'),
        ('JE-2023-003', '2023-10-10', 'Vente de marchandises', 'validated'),
        ('JE-2023-004', '2023-10-15', 'Paiement de salaires', 'pending')
      `,
      []
    );
    
    // Obtenir les IDs des écritures insérées
    const [entriesResult] = await this.executeQuery(
      db,
      'SELECT id FROM journal_entries ORDER BY id',
      []
    );
    
    if (entriesResult?.rows?.length) {
      const entries = [];
      for (let i = 0; i < entriesResult.rows.length; i++) {
        entries.push(entriesResult.rows.item(i).id);
      }
      
      await this.executeQuery(
        db,
        `
          INSERT INTO journal_entry_lines (entry_id, account_code, description, debit, credit) VALUES
          (?, '24000000', 'Matériel informatique', 1200000, 0),
          (?, '52000000', 'Banque', 0, 1200000),
          (?, '61300000', 'Loyers', 450000, 0),
          (?, '52000000', 'Banque', 0, 450000),
          (?, '41000000', 'Clients', 1800000, 0),
          (?, '70000000', 'Ventes', 0, 1800000),
          (?, '64000000', 'Charges de personnel', 2500000, 0),
          (?, '52000000', 'Banque', 0, 2500000)
        `,
        [
          entries[0], entries[0],
          entries[1], entries[1],
          entries[2], entries[2],
          entries[3], entries[3]
        ]
      );
    }
    
    // Créer des articles de stock démo
    await this.executeQuery(
      db,
      'DELETE FROM inventory_items',
      []
    );
    
    await this.executeQuery(
      db,
      `
        INSERT INTO inventory_items (name, sku, category, subcategory, quantity, price, cost, reorder_point, supplier, location, description) VALUES
        ('Ordinateur portable Dell XPS', 'DELL-XPS-15', 'Informatique', 'Ordinateurs', 12, 1200000, 980000, 5, 'Dell Afrique', 'Magasin principal', 'Ordinateur portable haute performance avec Core i7'),
        ('Écran Dell 27"', 'DELL-P2720D', 'Informatique', 'Écrans', 8, 320000, 240000, 3, 'Dell Afrique', 'Magasin principal', 'Écran QHD 27 pouces avec support ergonomique'),
        ('Chaise de bureau ergonomique', 'CHAIR-ERGO-01', 'Mobilier', 'Chaises', 15, 120000, 85000, 5, 'MobiPlus', 'Entrepôt B', 'Chaise ergonomique avec support lombaire'),
        ('Bureau réglable en hauteur', 'DESK-ADJ-02', 'Mobilier', 'Bureaux', 5, 380000, 290000, 2, 'MobiPlus', 'Entrepôt B', 'Bureau réglable électriquement'),
        ('Papier A4 (Carton)', 'PAPER-A4-BOX', 'Fournitures', 'Papeterie', 24, 25000, 18000, 10, 'Office Plus', 'Réserve fournitures', 'Carton de 5 ramettes de papier A4')
      `,
      []
    );
    
    logger.info('Données de démonstration chargées avec succès');
  }
}

export default new DatabaseService();
