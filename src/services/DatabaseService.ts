import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import logger from '../utils/logger';
import { BondIssuance, BondPayment } from '../hooks/useBondIssuances';

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
  async getDatabase(): Promise<SQLite.WebSQLDatabase> {
    return this.getDBConnection();
  }
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
      
      // Always initialize accounting tables and data, regardless of whether the
      // main database was just initialized or not
      await this.initAccountingTables();
      await this.initAccountingAccountsTable();
      await this.updateTransactionsWithTotal();
      
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

          // Ajouter la table des fournisseurs
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS inventory_suppliers (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              contact_person TEXT,
              email TEXT,
              phone TEXT,
              address TEXT,
              payment_terms TEXT,
              notes TEXT,
              created_at TEXT,
              updated_at TEXT
            )`,
            []
          );

          // Ajouter la table des transactions d'inventaire
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS inventory_transactions (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              date TEXT NOT NULL,
              reference TEXT NOT NULL,
              supplier_id TEXT,
              customer_name TEXT,
              status TEXT NOT NULL,
              notes TEXT,
              total_amount REAL DEFAULT 0,
              created_at TEXT,
              updated_at TEXT
            )`,
            []
          );

          // Ajouter la table des éléments de transactions d'inventaire
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS inventory_transaction_items (
              id TEXT PRIMARY KEY,
              transaction_id TEXT NOT NULL,
              product_id INTEGER NOT NULL,
              quantity INTEGER NOT NULL,
              unit_price REAL,
              unit_cost REAL,
              total_price REAL,
              total_cost REAL,
              reason TEXT,
              FOREIGN KEY (transaction_id) REFERENCES inventory_transactions (id) ON DELETE CASCADE,
              FOREIGN KEY (product_id) REFERENCES inventory_items (id)
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
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS bond_issuances (
              id TEXT PRIMARY KEY,
              issuer_id TEXT NOT NULL,
              issuance_date TEXT NOT NULL,
              maturity_date TEXT NOT NULL,
              amount REAL NOT NULL,
              interest_rate REAL NOT NULL,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )`,
            []
          );
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS bond_payments (
              id TEXT PRIMARY KEY,
              issuance_id TEXT NOT NULL,
              payment_date TEXT NOT NULL,
              payment_amount REAL NOT NULL,
              payment_type TEXT NOT NULL,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY (issuance_id) REFERENCES bond_issuances (id)
            )`,
            []
          );
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS investments (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              amount REAL NOT NULL,
              term INTEGER NOT NULL,
              financialInstitution TEXT NOT NULL,
              isPublic INTEGER NOT NULL,
              interestRate REAL NOT NULL,
              date TEXT NOT NULL,
              status TEXT NOT NULL,
              interestAccrued REAL NOT NULL,
              maturityDate TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )`,
            []
          );
          
          await this.executeQuery(
            db,
            `CREATE TABLE IF NOT EXISTS investment_income (
              id TEXT PRIMARY KEY,
              investment_id TEXT NOT NULL,
              income_date TEXT NOT NULL,
              income_amount REAL NOT NULL,
              income_type TEXT NOT NULL,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY (investment_id) REFERENCES investments (id)
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

  // Méthode pour initialiser les tables comptables
  async initAccountingTables(): Promise<void> {
    try {
      const db = await this.getDBConnection();
      
      // Table des comptes
      await db.transaction(tx => {
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS accounting_accounts (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            balance REAL DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
          );
        `);
      });
      
      // Table des exercices fiscaux
      await db.transaction(tx => {
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS fiscal_years (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            is_current INTEGER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
        `);
      });
      
      // Table des transactions
      await db.transaction(tx => {
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS accounting_transactions (
            id TEXT PRIMARY KEY,
            reference TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL,
            fiscal_year_id TEXT,
            total REAL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years (id)
          );
        `);
      });
      
      // Vérifier si la colonne "total" existe dans la table accounting_transactions
      // et l'ajouter si elle n'existe pas encore
      const [columnInfo, columnError] = await this.executeQuery(
        db,
        `PRAGMA table_info(accounting_transactions);`,
        []
      );
      
      if (columnInfo) {
        let totalColumnExists = false;
        for (let i = 0; i < columnInfo.rows.length; i++) {
          if (columnInfo.rows.item(i).name === 'total') {
            totalColumnExists = true;
            break;
          }
        }
        
        if (!totalColumnExists) {
          logger.info('Ajout de la colonne "total" à la table accounting_transactions');
          await this.executeQuery(
            db,
            `ALTER TABLE accounting_transactions ADD COLUMN total REAL DEFAULT 0;`,
            []
          );
        }
      }
      
      // Table des entrées comptables (lignes de transactions)
      await db.transaction(tx => {
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS accounting_entries (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL,
            account_code TEXT NOT NULL,
            description TEXT,
            debit REAL DEFAULT 0,
            credit REAL DEFAULT 0,
            created_at TEXT,
            FOREIGN KEY (transaction_id) REFERENCES accounting_transactions (id) ON DELETE CASCADE
          );
        `);
      });
      
      // Table des rapports
      await db.transaction(tx => {
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS accounting_reports (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            file_path TEXT NOT NULL,
            created_at TEXT NOT NULL
          );
        `);
      });
      
      // Table des pièces jointes
      await db.transaction(tx => {
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS accounting_attachments (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size INTEGER NOT NULL,
            uploaded_at TEXT NOT NULL,
            FOREIGN KEY (transaction_id) REFERENCES accounting_transactions (id) ON DELETE CASCADE
          );
        `);
      });
      
      // Indices pour améliorer les performances
      await db.transaction(tx => {
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounting_accounts (code);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_fiscal_years_current ON fiscal_years (is_current);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_transactions_date ON accounting_transactions (date);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_transactions_fiscal_year ON accounting_transactions (fiscal_year_id);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_transaction_id ON accounting_entries (transaction_id);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_account_code ON accounting_entries (account_code);');
      });
      
      console.log('Tables comptables initialisées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des tables comptables:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les transactions existantes pour calculer le total
   */
  async updateTransactionsWithTotal(): Promise<void> {
    try {
      const db = await this.getDBConnection();
      
      // Vérifier si la colonne "total" existe dans la table accounting_transactions
      // et l'ajouter si elle n'existe pas encore
      const [columnInfo, columnError] = await this.executeQuery(
        db,
        `PRAGMA table_info(accounting_transactions);`,
        []
      );
      
      if (columnInfo) {
        let totalColumnExists = false;
        for (let i = 0; i < columnInfo.rows.length; i++) {
          if (columnInfo.rows.item(i).name === 'total') {
            totalColumnExists = true;
            break;
          }
        }
        
        if (!totalColumnExists) {
          logger.info('Ajout de la colonne "total" à la table accounting_transactions');
          await this.executeQuery(
            db,
            `ALTER TABLE accounting_transactions ADD COLUMN total REAL DEFAULT 0;`,
            []
          );
        }
      }
      
      // 1. Récupérer toutes les transactions sans total ou avec total à 0
      const [transactions, transactionsError] = await this.executeQuery(
        db,
        `SELECT id FROM accounting_transactions WHERE total IS NULL OR total = 0`,
        []
      );
      
      if (transactionsError || !transactions) {
        throw transactionsError || new Error('Failed to fetch transactions');
      }
      
      // 2. Pour chaque transaction, calculer le total basé sur la somme des débits
      for (let i = 0; i < transactions.rows.length; i++) {
        const transactionId = transactions.rows.item(i).id;
        
        // Récupérer toutes les écritures liées à cette transaction
        const [entries, entriesError] = await this.executeQuery(
          db,
          `SELECT SUM(debit) as total_debit FROM accounting_entries 
           WHERE transaction_id = ?`,
          [transactionId]
        );
        
        if (!entriesError && entries && entries.rows.length > 0) {
          const totalAmount = entries.rows.item(0).total_debit || 0;
          
          // Mettre à jour la transaction avec ce total
          await this.executeQuery(
            db,
            `UPDATE accounting_transactions SET total = ? WHERE id = ?`,
            [totalAmount, transactionId]
          );
          
          logger.info(`Updated transaction ${transactionId} with total ${totalAmount}`);
        }
      }
      
      logger.info(`Successfully updated all transactions with total amounts`);
    } catch (error) {
      logger.error('Error updating transactions with totals:', error);
      throw error;
    }
  }

  /**
   * Get all bond issuances for a specific issuer
   */
  async getBondIssuancesByIssuer(issuerId: string): Promise<BondIssuance[]> {
    try {
      const db = await this.getDBConnection();
      const [result, error] = await this.executeQuery(
        db,
        `SELECT * FROM bond_issuances WHERE issuer_id = ? ORDER BY issuance_date DESC`,
        [issuerId]
      );
      
      if (error || !result) {
        throw error || new Error('Failed to fetch bond issuances');
      }
      
      const issuances: BondIssuance[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        issuances.push(result.rows.item(i));
      }
      
      return issuances;
    } catch (error) {
      logger.error('Error fetching bond issuances:', error);
      return [];
    }
  }
  
  /**
   * Get upcoming bond payments for a specific issuer
   */
  async getUpcomingBondPayments(issuerId: string): Promise<BondPayment[]> {
    try {
      const db = await this.getDBConnection();
      const [result, error] = await this.executeQuery(
        db,
        `SELECT p.* FROM bond_payments p
         JOIN bond_issuances i ON p.issuance_id = i.id
         WHERE i.issuer_id = ? AND p.status = 'scheduled'
         ORDER BY p.payment_date ASC`,
        [issuerId]
      );
      
      if (error || !result) {
        throw error || new Error('Failed to fetch upcoming bond payments');
      }
      
      const payments: BondPayment[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        payments.push(result.rows.item(i));
      }
      
      return payments;
    } catch (error) {
      logger.error('Error fetching upcoming bond payments:', error);
      return [];
    }
  }
  
  /**
   * Get a specific bond payment by ID
   */
  async getBondPayment(paymentId: string): Promise<BondPayment> {
    try {
      const db = await this.getDBConnection();
      const [result, error] = await this.executeQuery(
        db,
        `SELECT * FROM bond_payments WHERE id = ?`,
        [paymentId]
      );
      
      if (error || !result || result.rows.length === 0) {
        throw error || new Error('Bond payment not found');
      }
      
      return result.rows.item(0);
    } catch (error) {
      logger.error('Error fetching bond payment:', error);
      throw error;
    }
  }
  
  /**
   * Update a bond payment
   */
  async updateBondPayment(paymentId: string, updates: Partial<BondPayment>): Promise<void> {
    try {
      const db = await this.getDBConnection();
      
      // Build the update query
      const updateFields = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const updateValues = Object.values(updates);
      
      const [result, error] = await this.executeQuery(
        db,
        `UPDATE bond_payments SET ${updateFields} WHERE id = ?`,
        [...updateValues, paymentId]
      );
      
      if (error || !result) {
        throw error || new Error('Failed to update bond payment');
      }
      
      if (result.rowsAffected === 0) {
        throw new Error('Bond payment not found');
      }
    } catch (error) {
      logger.error('Error updating bond payment:', error);
      throw error;
    }
  }
  
  /**
   * Create a new bond issuance
   */
  async createBondIssuance(issuanceData: Partial<BondIssuance>): Promise<string> {
    try {
      const db = await this.getDBConnection();
      
      // Generate a unique ID for the issuance
      const issuanceId = `BI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Build the insert query
      const fields = Object.keys(issuanceData).join(', ');
      const placeholders = Object.keys(issuanceData)
        .map(() => '?')
        .join(', ');
      
      const values = Object.values(issuanceData);
      
      const [result, error] = await this.executeQuery(
        db,
        `INSERT INTO bond_issuances (id, ${fields}) VALUES (?, ${placeholders})`,
        [issuanceId, ...values]
      );
      
      if (error || !result) {
        throw error || new Error('Failed to create bond issuance');
      }
      
      return issuanceId;
    } catch (error) {
      logger.error('Error creating bond issuance:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific bond issuance by ID
   */
  async getBondIssuance(issuanceId: string): Promise<BondIssuance> {
    try {
      const db = await this.getDBConnection();
      const [result, error] = await this.executeQuery(
        db,
        `SELECT * FROM bond_issuances WHERE id = ?`,
        [issuanceId]
      );
      
      if (error || !result || result.rows.length === 0) {
        throw error || new Error('Bond issuance not found');
      }
      
      return result.rows.item(0);
    } catch (error) {
      logger.error('Error fetching bond issuance:', error);
      throw error;
    }
  }
  
  /**
   * Update a bond issuance
   */
  async updateBondIssuance(issuanceId: string, updates: Partial<BondIssuance>): Promise<void> {
    try {
      const db = await this.getDBConnection();
      
      // Build the update query
      const updateFields = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const updateValues = Object.values(updates);
      
      const [result, error] = await this.executeQuery(
        db,
        `UPDATE bond_issuances SET ${updateFields} WHERE id = ?`,
        [...updateValues, issuanceId]
      );
      
      if (error || !result) {
        throw error || new Error('Failed to update bond issuance');
      }
      
      if (result.rowsAffected === 0) {
        throw new Error('Bond issuance not found');
      }
    } catch (error) {
      logger.error('Error updating bond issuance:', error);
      throw error;
    }
  }
  
  /**
   * Create bond payment schedule entries
   */
  async createBondPaymentSchedule(payments: Array<{
    issuance_id: string;
    payment_date: string;
    payment_amount: number;
    payment_type: 'interest' | 'principal';
    status: 'scheduled' | 'paid' | 'missed';
  }>): Promise<void> {
    try {
      const db = await this.getDBConnection();
      
      // Begin transaction
      await db.transaction(async tx => {
        for (const payment of payments) {
          // Generate a unique ID for each payment
          const paymentId = `BP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          tx.executeSql(
            `INSERT INTO bond_payments (
              id, 
              issuance_id, 
              payment_date, 
              payment_amount, 
              payment_type, 
              status
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              paymentId,
              payment.issuance_id,
              payment.payment_date,
              payment.payment_amount,
              payment.payment_type,
              payment.status
            ]
          );
        }
      });
      
      logger.info(`Created ${payments.length} bond payment schedule entries`);
    } catch (error) {
      logger.error('Error creating bond payment schedule:', error);
      throw error;
    }
  }

  /**
   * Create a new investment record
   */
  async createInvestment(investmentData: {
    type: string;
    amount: number;
    term: number;
    financialInstitution: string;
    isPublic: boolean;
    interestRate: number;
    date: string;
    status: string;
    interestAccrued: number;
    maturityDate: string;
  }): Promise<string> {
    try {
      const db = await this.getDBConnection();
      
      // Generate a unique ID for the investment
      const investmentId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Build the insert query
      const fields = Object.keys(investmentData).join(', ');
      const placeholders = Object.keys(investmentData)
        .map(() => '?')
        .join(', ');
      
      const values = Object.values(investmentData);
      
      const [result, error] = await this.executeQuery(
        db,
        `INSERT INTO investments (id, ${fields}) VALUES (?, ${placeholders})`,
        [investmentId, ...values]
      );
      
      if (error || !result) {
        throw error || new Error('Failed to create investment');
      }
      
      return investmentId;
    } catch (error) {
      logger.error('Error creating investment:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific investment by ID
   */
  async getInvestment(investmentId: string): Promise<any> {
    try {
      const db = await this.getDBConnection();
      const [result, error] = await this.executeQuery(
        db,
        `SELECT * FROM investments WHERE id = ?`,
        [investmentId]
      );
      
      if (error || !result || result.rows.length === 0) {
        throw error || new Error('Investment not found');
      }
      
      return result.rows.item(0);
    } catch (error) {
      logger.error('Error fetching investment:', error);
      throw error;
    }
  }
  
  /**
   * Update an investment record
   */
  async updateInvestment(investmentId: string, updates: any): Promise<void> {
    try {
      const db = await this.getDBConnection();
      
      // Build the update query
      const updateFields = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const updateValues = Object.values(updates);
      
      const [result, error] = await this.executeQuery(
        db,
        `UPDATE investments SET ${updateFields} WHERE id = ?`,
        [...updateValues, investmentId]
      );
      
      if (error || !result) {
        throw error || new Error('Failed to update investment');
      }
      
      if (result.rowsAffected === 0) {
        throw new Error('Investment not found');
      }
    } catch (error) {
      logger.error('Error updating investment:', error);
      throw error;
    }
  }
  
  /**
   * Create investment income schedule entries
   */
  async createInvestmentIncomeSchedule(incomeSchedule: Array<{
    investment_id: string;
    income_date: string;
    income_amount: number;
    income_type: 'interest' | 'principal';
    status: 'scheduled' | 'received' | 'missed';
  }>): Promise<void> {
    try {
      const db = await this.getDBConnection();
      
      // Begin transaction
      await db.transaction(async tx => {
        for (const income of incomeSchedule) {
          // Generate a unique ID for each income entry
          const incomeId = `II-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          tx.executeSql(
            `INSERT INTO investment_income (
              id, 
              investment_id, 
              income_date, 
              income_amount, 
              income_type, 
              status
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              incomeId,
              income.investment_id,
              income.income_date,
              income.income_amount,
              income.income_type,
              income.status
            ]
          );
        }
      });
      
      logger.info(`Created ${incomeSchedule.length} investment income schedule entries`);
    } catch (error) {
      logger.error('Error creating investment income schedule:', error);
      throw error;
    }
  }

  /**
   * Creates and populates the accounting_accounts table with sample chart of accounts data
   * This is needed for SQL queries that retrieve financial metrics
   */
  async initAccountingAccountsTable(): Promise<void> {
    try {
      const db = await this.getDBConnection();
      
      // Check if table exists
      const [tableCheck] = await this.executeQuery(
        db,
        'SELECT name FROM sqlite_master WHERE type="table" AND name="accounting_accounts"',
        []
      );
      
      // Create table if it doesn't exist
      if (!tableCheck || tableCheck.rows.length === 0) {
        logger.info("Creating accounting_accounts table");
        await this.executeQuery(
          db,
          `CREATE TABLE IF NOT EXISTS accounting_accounts (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            balance REAL DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
          )`,
          []
        );
        
        // Insert sample accounts based on SYSCOHADA chart of accounts
        const now = new Date().toISOString();
        const accounts = [
          // Asset accounts
          { id: 'acc1', code: '52100000', name: 'Banque SGBCI', type: 'asset', balance: 3750000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc2', code: '52200000', name: 'Banque Ecobank', type: 'asset', balance: 2250000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc3', code: '41100000', name: 'Clients - catégorie A', type: 'asset', balance: 1850000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc4', code: '41200000', name: 'Clients - catégorie B', type: 'asset', balance: 1250000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc5', code: '24100000', name: 'Matériel informatique', type: 'asset', balance: 4500000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc6', code: '24500000', name: 'Matériel de transport', type: 'asset', balance: 7500000, is_active: 1, created_at: now, updated_at: now },
          
          // Liability accounts
          { id: 'acc7', code: '40100000', name: 'Fournisseurs - catégorie A', type: 'liability', balance: 1250000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc8', code: '40200000', name: 'Fournisseurs - catégorie B', type: 'liability', balance: 750000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc9', code: '42100000', name: 'Personnel - salaires à payer', type: 'liability', balance: 2200000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc10', code: '44100000', name: 'État - impôts à payer', type: 'liability', balance: 850000, is_active: 1, created_at: now, updated_at: now },
          
          // Revenue accounts
          { id: 'acc11', code: '70100000', name: 'Ventes de produits', type: 'revenue', balance: 12500000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc12', code: '70600000', name: 'Prestations de services', type: 'revenue', balance: 8750000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc13', code: '71100000', name: 'Variation des stocks', type: 'revenue', balance: 1500000, is_active: 1, created_at: now, updated_at: now },
          
          // Expense accounts
          { id: 'acc14', code: '60100000', name: 'Achats de marchandises', type: 'expense', balance: 6250000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc15', code: '61300000', name: 'Locations et charges locatives', type: 'expense', balance: 3600000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc16', code: '62600000', name: 'Frais postaux et télécommunications', type: 'expense', balance: 1250000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc17', code: '63100000', name: 'Rémunérations du personnel', type: 'expense', balance: 7500000, is_active: 1, created_at: now, updated_at: now },
          { id: 'acc18', code: '66000000', name: 'Charges financières', type: 'expense', balance: 850000, is_active: 1, created_at: now, updated_at: now }
        ];
        
        // Insert accounts using a transaction for better performance
        await db.transaction(tx => {
          for (const account of accounts) {
            tx.executeSql(
              `INSERT INTO accounting_accounts (id, code, name, type, balance, is_active, created_at, updated_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [account.id, account.code, account.name, account.type, account.balance, account.is_active, account.created_at, account.updated_at]
            );
          }
        });
        
        logger.info(`Successfully populated accounting_accounts table with ${accounts.length} accounts`);
      } else {
        logger.debug("accounting_accounts table already exists");
      }
    } catch (error) {
      logger.error('Error initializing accounting_accounts table:', error);
      throw error;
    }
  }

  /**
   * Initialise les tables d'inventaire et charge des données de démonstration
   */
  async initInventoryTables(): Promise<void> {
    try {
      const db = await this.getDBConnection();
      
      // Vérifier si les tables existent
      const [tableCheck] = await this.executeQuery(
        db,
        'SELECT name FROM sqlite_master WHERE type="table" AND name="inventory_suppliers"',
        []
      );
      
      // Si la table des fournisseurs n'existe pas, il y a une bonne chance que les autres tables d'inventaire n'aient pas été créées
      if (!tableCheck || tableCheck.rows.length === 0) {
        logger.info('Initialisation des tables d\'inventaire');
        
        // Créer la table des fournisseurs si elle n'existe pas déjà
        await this.executeQuery(
          db,
          `CREATE TABLE IF NOT EXISTS inventory_suppliers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            payment_terms TEXT,
            notes TEXT,
            created_at TEXT,
            updated_at TEXT
          )`,
          []
        );
        
        // Créer la table des transactions d'inventaire
        await this.executeQuery(
          db,
          `CREATE TABLE IF NOT EXISTS inventory_transactions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            reference TEXT NOT NULL,
            supplier_id TEXT,
            customer_name TEXT,
            status TEXT NOT NULL,
            notes TEXT,
            total_amount REAL DEFAULT 0,
            created_at TEXT,
            updated_at TEXT
          )`,
          []
        );
        
        // Créer la table des éléments de transactions d'inventaire
        await this.executeQuery(
          db,
          `CREATE TABLE IF NOT EXISTS inventory_transaction_items (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL,
            unit_cost REAL,
            total_price REAL,
            total_cost REAL,
            reason TEXT,
            FOREIGN KEY (transaction_id) REFERENCES inventory_transactions (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES inventory_items (id)
          )`,
          []
        );
        
        // Créer des index pour améliorer les performances
        await db.transaction(tx => {
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items (sku);');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items (category);');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier ON inventory_items (supplier);');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions (date);');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions (type);');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_inventory_transaction_items_product ON inventory_transaction_items (product_id);');
        });
        
        logger.info('Tables d\'inventaire créées avec succès');
        
        // Charger des fournisseurs de démonstration
        const now = new Date().toISOString();
        const suppliers = [
          {
            id: 'sup1',
            name: 'Dell Afrique',
            contact_person: 'Jean Dupont',
            email: 'jean.dupont@dell.co.ci',
            phone: '+225 0123456789',
            address: 'Abidjan, Côte d\'Ivoire',
            created_at: now,
            updated_at: now
          },
          {
            id: 'sup2',
            name: 'Samsung Electronics',
            contact_person: 'Marie Koné',
            email: 'marie.kone@samsung.co.ci',
            phone: '+225 0798765432',
            address: 'Abidjan, Côte d\'Ivoire',
            created_at: now,
            updated_at: now
          },
          {
            id: 'sup3',
            name: 'LG Electronics',
            contact_person: 'Pierre Kouamé',
            email: 'pierre.kouame@lg.co.ci',
            phone: '+225 0587654321',
            address: 'Abidjan, Côte d\'Ivoire',
            created_at: now,
            updated_at: now
          }
        ];
        
        await db.transaction(tx => {
          for (const supplier of suppliers) {
            tx.executeSql(
              `INSERT INTO inventory_suppliers (id, name, contact_person, email, phone, address, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                supplier.id,
                supplier.name,
                supplier.contact_person,
                supplier.email,
                supplier.phone,
                supplier.address,
                supplier.created_at,
                supplier.updated_at
              ]
            );
          }
        });
        
        logger.info('Données de démonstration pour l\'inventaire chargées avec succès');
      } else {
        logger.debug('Les tables d\'inventaire existent déjà');
      }
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation des tables d\'inventaire:', error);
      throw error;
    }
  }
}

export default new DatabaseService();
