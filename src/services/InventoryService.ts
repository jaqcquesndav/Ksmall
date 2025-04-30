import * as SQLite from 'expo-sqlite';
import DatabaseService from './DatabaseService';
import SyncService, { SyncOperationType } from './SyncService';
import logger from '../utils/logger';
import { 
  ServiceProduct, 
  ServiceSupplier, 
  ServiceInventoryTransaction,
  Stock 
} from '../types/inventory';

class InventoryService {
  private static instance: InventoryService;
  private db: SQLite.WebSQLDatabase | null = null;
  private initialized: boolean = false;

  private constructor() {}

  /**
   * Obtenir l'instance singleton du service d'inventaire
   */
  public static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  /**
   * Initialiser le service d'inventaire
   */
  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await DatabaseService.getDatabase();
      await this.setupTables();
      this.initialized = true;
      logger.debug('Service d\'inventaire initialisé avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du service d\'inventaire:', error);
      throw error;
    }
  }

  /**
   * Configuration des tables nécessaires
   */
  private async setupTables(): Promise<void> {
    if (!this.db) return;

    // Création de la table des produits
    await DatabaseService.createTableIfNotExists(
      this.db,
      'products',
      `id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER NOT NULL,
      price REAL NOT NULL,
      cost_price REAL,
      quantity REAL NOT NULL DEFAULT 0,
      min_quantity REAL,
      unit_id INTEGER,
      tax_id INTEGER,
      images TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    );

    // Création des tables associées
    await DatabaseService.createTableIfNotExists(
      this.db,
      'product_categories',
      `id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    );

    await DatabaseService.createTableIfNotExists(
      this.db,
      'units',
      `id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    );
    
    // Création de la table des fournisseurs si elle n'existe pas déjà
    await DatabaseService.createTableIfNotExists(
      this.db,
      'suppliers',
      `id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      payment_terms TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    );
    
    // Création de la table des transactions d'inventaire
    await DatabaseService.createTableIfNotExists(
      this.db,
      'inventory_transactions',
      `id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      reference TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      total_amount REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    );
    
    // Création de la table des éléments de transaction
    await DatabaseService.createTableIfNotExists(
      this.db,
      'inventory_transaction_items',
      `id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES inventory_transactions(id) ON DELETE CASCADE`
    );
    
    // Table des niveaux de stock
    await DatabaseService.createTableIfNotExists(
      this.db,
      'stock_levels',
      `id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      location TEXT,
      last_updated TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id)`
    );

    logger.debug('Tables d\'inventaire créées avec succès');
  }

  /**
   * Obtenir tous les produits avec leur statut de synchronisation
   */
  public async getAllProducts(): Promise<(ServiceProduct & {_syncStatus?: string, _lastSynced?: string | null})[]> {
    if (!this.initialized) await this.init();

    try {
      // Utiliser la méthode statique correctement
      return await SyncService.getLocalDataWithSyncStatus(
        'products',
        `SELECT p.*, c.name as category_name, u.name as unit_name, u.symbol as unit_symbol
        FROM products p 
        LEFT JOIN product_categories c ON p.category_id = c.id
        LEFT JOIN units u ON p.unit_id = u.id
        ORDER BY p.name ASC`
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
  }
  
  /**
   * Alias pour getAllProducts pour respecter l'interface attendue par le contexte
   */
  public async getProducts(): Promise<ServiceProduct[]> {
    return this.getAllProducts();
  }

  /**
   * Obtenir un produit par son ID
   */
  public async getProductById(id: number | string): Promise<ServiceProduct | null> {
    if (!this.initialized) await this.init();
    if (!this.db) return null;

    try {
      // Convertir l'ID en nombre si c'est une chaîne
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      const [result] = await DatabaseService.executeQuery(
        this.db,
        `SELECT p.*, c.name as category_name, u.name as unit_name, u.symbol as unit_symbol
        FROM products p 
        LEFT JOIN product_categories c ON p.category_id = c.id
        LEFT JOIN units u ON p.unit_id = u.id
        WHERE p.id = ?`,
        [numericId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows.item(0) as ServiceProduct;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du produit #${id}:`, error);
      throw error;
    }
  }

  /**
   * Ajouter un nouveau produit
   */
  public async addProduct(product: Omit<ServiceProduct, 'id'>): Promise<ServiceProduct> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const result = await SyncService.performLocalOperation(
        SyncOperationType.CREATE,
        'products',
        '/api/inventory/products',
        product,
        `INSERT INTO products (
          product_code, name, description, category_id, price, cost_price, 
          quantity, min_quantity, unit_id, tax_id, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.product_code,
          product.name,
          product.description || null,
          product.category_id,
          product.price,
          product.cost_price || null,
          product.quantity,
          product.min_quantity || null,
          product.unit_id || null,
          product.tax_id || null,
          product.images || null
        ]
      );

      logger.info(`Nouveau produit "${product.name}" ajouté localement`);
      // Récupérer le produit complet avec son ID
      const insertId = result.insertId as number;
      const newProduct = await this.getProductById(insertId);
      if (!newProduct) {
        throw new Error(`Impossible de récupérer le produit après l'insertion`);
      }
      return newProduct;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du produit:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un produit existant
   */
  public async updateProduct(id: number | string, updates: Partial<ServiceProduct>): Promise<ServiceProduct> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    // Convertir l'ID en nombre si c'est une chaîne
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    // Récupérer les données actuelles pour les synchroniser correctement
    const currentProduct = await this.getProductById(numericId);
    if (!currentProduct) {
      throw new Error(`Le produit avec l'identifiant ${id} n'existe pas`);
    }

    // Construire les parties de la requête SQL de mise à jour
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    // Ajouter la date de mise à jour
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    // Ajouter l'ID pour la clause WHERE
    updateValues.push(numericId);

    try {
      // Fusionner les données pour la synchronisation
      const mergedProductData = {
        ...currentProduct,
        ...updates,
        id: numericId
      };

      await SyncService.performLocalOperation(
        SyncOperationType.UPDATE,
        'products',
        `/api/inventory/products/${numericId}`,
        mergedProductData,
        `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      logger.info(`Produit #${id} mis à jour localement`);
      
      // Récupérer le produit mis à jour
      const updatedProduct = await this.getProductById(numericId);
      if (!updatedProduct) {
        throw new Error(`Impossible de récupérer le produit après la mise à jour`);
      }
      return updatedProduct;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du produit #${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer un produit
   */
  public async deleteProduct(id: number | string): Promise<boolean> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    // Convertir l'ID en nombre si c'est une chaîne
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    // Récupérer les données actuelles pour les synchroniser correctement
    const currentProduct = await this.getProductById(numericId);
    if (!currentProduct) {
      throw new Error(`Le produit avec l'identifiant ${id} n'existe pas`);
    }

    try {
      await SyncService.performLocalOperation(
        SyncOperationType.DELETE,
        'products',
        `/api/inventory/products/${numericId}`,
        { id: numericId },
        'DELETE FROM products WHERE id = ?',
        [numericId]
      );

      logger.info(`Produit #${id} supprimé localement`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du produit #${id}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour le stock d'un produit
   */
  public async updateStock(id: number | string, newQuantity: number): Promise<boolean> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    // Convertir l'ID en nombre si c'est une chaîne
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    try {
      // Récupérer les données actuelles pour les synchroniser correctement
      const currentProduct = await this.getProductById(numericId);
      if (!currentProduct) {
        throw new Error(`Le produit avec l'identifiant ${id} n'existe pas`);
      }
      
      // Mise à jour partielle spécifique au stock
      await SyncService.performLocalOperation(
        SyncOperationType.UPDATE,
        'products',
        `/api/inventory/products/${numericId}/stock`,
        { id: numericId, quantity: newQuantity },
        'UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, numericId]
      );

      logger.info(`Stock du produit #${id} mis à jour à ${newQuantity}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du stock pour le produit #${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtenir tous les fournisseurs
   */
  public async getSuppliers(): Promise<ServiceSupplier[]> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    try {
      const [result] = await DatabaseService.executeQuery(
        this.db,
        `SELECT * FROM suppliers ORDER BY name ASC`
      );
      
      const suppliers: ServiceSupplier[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const item = result.rows.item(i);
        suppliers.push({
          id: item.id,
          name: item.name,
          contactPerson: item.contact_person,
          email: item.email,
          phone: item.phone,
          address: item.address,
          paymentTerms: item.payment_terms,
          notes: item.notes,
          productCategories: []  // À remplir si nécessaire
        });
      }
      
      return suppliers;
    } catch (error) {
      logger.error('Erreur lors de la récupération des fournisseurs:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir un fournisseur par son ID
   */
  public async getSupplierById(id: string): Promise<ServiceSupplier | null> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    try {
      const [result] = await DatabaseService.executeQuery(
        this.db,
        'SELECT * FROM suppliers WHERE id = ?',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const item = result.rows.item(0);
      return {
        id: item.id,
        name: item.name,
        contactPerson: item.contact_person,
        email: item.email,
        phone: item.phone,
        address: item.address,
        paymentTerms: item.payment_terms,
        notes: item.notes,
        productCategories: []  // À remplir si nécessaire
      };
    } catch (error) {
      logger.error(`Erreur lors de la récupération du fournisseur #${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Ajouter un nouveau fournisseur
   */
  public async addSupplier(supplier: Omit<ServiceSupplier, 'id'>): Promise<ServiceSupplier> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    try {
      // Générer un ID unique pour le fournisseur
      const id = `sup-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      await DatabaseService.executeQuery(
        this.db,
        `INSERT INTO suppliers (
          id, name, contact_person, email, phone, address, payment_terms, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          supplier.name,
          supplier.contactPerson || null,
          supplier.email || null,
          supplier.phone || null,
          supplier.address || null,
          supplier.paymentTerms || null,
          supplier.notes || null
        ]
      );
      
      logger.info(`Nouveau fournisseur "${supplier.name}" ajouté`);
      
      // Retourner le fournisseur avec son ID
      return {
        ...supplier,
        id
      };
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du fournisseur:', error);
      throw error;
    }
  }
  
  /**
   * Mettre à jour un fournisseur existant
   */
  public async updateSupplier(id: string, updates: Partial<ServiceSupplier>): Promise<ServiceSupplier> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    // Vérifier si le fournisseur existe
    const existingSupplier = await this.getSupplierById(id);
    if (!existingSupplier) {
      throw new Error(`Le fournisseur avec l'identifiant ${id} n'existe pas`);
    }
    
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    // Mapper les champs du fournisseur aux colonnes de la base de données
    const fieldMap: Record<string, string> = {
      name: 'name',
      contactPerson: 'contact_person',
      email: 'email',
      phone: 'phone',
      address: 'address',
      paymentTerms: 'payment_terms',
      notes: 'notes'
    };
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'productCategories' && fieldMap[key]) {
        updateFields.push(`${fieldMap[key]} = ?`);
        updateValues.push(value);
      }
    });
    
    if (updateFields.length === 0) {
      return existingSupplier; // Rien à mettre à jour
    }
    
    // Ajouter l'ID pour la clause WHERE
    updateValues.push(id);
    
    try {
      await DatabaseService.executeQuery(
        this.db,
        `UPDATE suppliers SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );
      
      logger.info(`Fournisseur #${id} mis à jour`);
      
      // Retourner le fournisseur mis à jour
      return {
        ...existingSupplier,
        ...updates
      };
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du fournisseur #${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Supprimer un fournisseur
   */
  public async deleteSupplier(id: string): Promise<boolean> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    try {
      await DatabaseService.executeQuery(
        this.db,
        'DELETE FROM suppliers WHERE id = ?',
        [id]
      );
      
      logger.info(`Fournisseur #${id} supprimé`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du fournisseur #${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Enregistrer une nouvelle transaction d'inventaire
   */
  public async recordInventoryTransaction(transaction: Omit<ServiceInventoryTransaction, 'id'>): Promise<ServiceInventoryTransaction> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    try {
      // Générer un ID unique pour la transaction
      const id = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Insérer la transaction principale
      await DatabaseService.executeQuery(
        this.db,
        `INSERT INTO inventory_transactions (
          id, type, date, reference, status, notes, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          transaction.type,
          transaction.date,
          transaction.reference || null,
          transaction.status,
          transaction.notes || null,
          transaction.totalAmount
        ]
      );
      
      // Insérer les éléments de la transaction
      for (const item of transaction.items) {
        await DatabaseService.executeQuery(
          this.db,
          `INSERT INTO inventory_transaction_items (
            transaction_id, product_id, quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            id,
            item.productId,
            item.quantity,
            item.unitPrice,
            item.totalPrice
          ]
        );
        
        // Mettre à jour le stock du produit selon le type de transaction
        let newQuantity = 0;
        
        // Récupérer le produit
        const productId = typeof item.productId === 'string' ? parseInt(item.productId, 10) : item.productId;
        const product = await this.getProductById(productId);
        
        if (product) {
          switch (transaction.type) {
            case 'purchase':
              newQuantity = (product.quantity || 0) + item.quantity;
              break;
            case 'sale':
              newQuantity = Math.max(0, (product.quantity || 0) - item.quantity);
              break;
            case 'adjustment':
              // Pour les ajustements, la quantité est la nouvelle valeur absolue
              newQuantity = item.quantity;
              break;
          }
          
          // Mettre à jour le stock
          await this.updateStock(productId, newQuantity);
          
          // Mettre à jour ou créer un enregistrement de niveau de stock
          const stockId = `stock-${productId}`;
          const now = new Date().toISOString();
          
          // Vérifier si l'enregistrement existe déjà
          const [stockResult] = await DatabaseService.executeQuery(
            this.db,
            'SELECT * FROM stock_levels WHERE product_id = ?',
            [productId]
          );
          
          if (stockResult.rows.length > 0) {
            // Mettre à jour l'enregistrement existant
            await DatabaseService.executeQuery(
              this.db,
              'UPDATE stock_levels SET quantity = ?, last_updated = ? WHERE product_id = ?',
              [newQuantity, now, productId]
            );
          } else {
            // Créer un nouvel enregistrement
            await DatabaseService.executeQuery(
              this.db,
              'INSERT INTO stock_levels (id, product_id, quantity, location, last_updated) VALUES (?, ?, ?, ?, ?)',
              [stockId, productId, newQuantity, 'default', now]
            );
          }
        }
      }
      
      logger.info(`Transaction d'inventaire ${id} enregistrée`);
      
      // Retourner la transaction complète
      return {
        ...transaction,
        id
      } as ServiceInventoryTransaction;
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de la transaction d\'inventaire:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir toutes les transactions d'inventaire
   */
  public async getInventoryTransactions(): Promise<ServiceInventoryTransaction[]> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    try {
      // Récupérer toutes les transactions
      const [transactionsResult] = await DatabaseService.executeQuery(
        this.db,
        'SELECT * FROM inventory_transactions ORDER BY date DESC'
      );
      
      const transactions: ServiceInventoryTransaction[] = [];
      
      for (let i = 0; i < transactionsResult.rows.length; i++) {
        const transaction = transactionsResult.rows.item(i);
        
        // Récupérer les éléments de la transaction
        const [itemsResult] = await DatabaseService.executeQuery(
          this.db,
          'SELECT * FROM inventory_transaction_items WHERE transaction_id = ?',
          [transaction.id]
        );
        
        const items = [];
        for (let j = 0; j < itemsResult.rows.length; j++) {
          const item = itemsResult.rows.item(j);
          items.push({
            productId: item.product_id,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price
          });
        }
        
        transactions.push({
          id: transaction.id,
          type: transaction.type as 'purchase' | 'sale' | 'adjustment',
          date: transaction.date,
          reference: transaction.reference,
          items,
          status: transaction.status as 'completed' | 'pending' | 'cancelled',
          notes: transaction.notes,
          totalAmount: transaction.total_amount
        });
      }
      
      return transactions;
    } catch (error) {
      logger.error('Erreur lors de la récupération des transactions d\'inventaire:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir les niveaux de stock actuels
   */
  public async getStockLevels(): Promise<Stock[]> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    try {
      const [result] = await DatabaseService.executeQuery(
        this.db,
        'SELECT * FROM stock_levels'
      );
      
      const stockLevels: Stock[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const item = result.rows.item(i);
        stockLevels.push({
          id: item.id,
          productId: item.product_id,
          quantity: item.quantity,
          location: item.location,
          lastUpdated: item.last_updated
        });
      }
      
      return stockLevels;
    } catch (error) {
      logger.error('Erreur lors de la récupération des niveaux de stock:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir le niveau de stock pour un produit spécifique
   */
  public async getStockByProductId(productId: string): Promise<Stock | null> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    try {
      const [result] = await DatabaseService.executeQuery(
        this.db,
        'SELECT * FROM stock_levels WHERE product_id = ?',
        [productId]
      );
      
      if (result.rows.length === 0) {
        // Si aucun enregistrement de stock n'existe, créer une valeur par défaut
        return {
          id: `stock-${productId}`,
          productId,
          quantity: 0,
          location: 'default',
          lastUpdated: new Date().toISOString()
        };
      }
      
      const item = result.rows.item(0);
      return {
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        location: item.location,
        lastUpdated: item.last_updated
      };
    } catch (error) {
      logger.error(`Erreur lors de la récupération du stock pour le produit #${productId}:`, error);
      throw error;
    }
  }
  
  /**
   * Vérifier les produits avec un niveau de stock bas
   */
  public async checkLowStockItems(threshold?: number): Promise<ServiceProduct[]> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    try {
      // Si un seuil spécifique est fourni, l'utiliser, sinon utiliser le champ min_quantity
      if (threshold !== undefined) {
        const [result] = await DatabaseService.executeQuery(
          this.db,
          'SELECT * FROM products WHERE quantity <= ?',
          [threshold]
        );
        
        const products: ServiceProduct[] = [];
        for (let i = 0; i < result.rows.length; i++) {
          products.push(result.rows.item(i) as ServiceProduct);
        }
        
        return products;
      } else {
        // Utiliser min_quantity comme seuil
        const [result] = await DatabaseService.executeQuery(
          this.db,
          'SELECT * FROM products WHERE quantity <= min_quantity AND min_quantity IS NOT NULL'
        );
        
        const products: ServiceProduct[] = [];
        for (let i = 0; i < result.rows.length; i++) {
          products.push(result.rows.item(i) as ServiceProduct);
        }
        
        return products;
      }
    } catch (error) {
      logger.error('Erreur lors de la vérification des produits avec un niveau de stock bas:', error);
      throw error;
    }
  }
  
  /**
   * Calculer la valeur totale de l'inventaire
   */
  public async calculateInventoryValue(): Promise<number> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');
    
    try {
      const [result] = await DatabaseService.executeQuery(
        this.db,
        'SELECT SUM(quantity * cost_price) as total_value FROM products WHERE cost_price IS NOT NULL'
      );
      
      if (result.rows.length === 0) {
        return 0;
      }
      
      return result.rows.item(0).total_value || 0;
    } catch (error) {
      logger.error('Erreur lors du calcul de la valeur de l\'inventaire:', error);
      throw error;
    }
  }

  /**
   * Vérifier si les données d'inventaire sont synchronisées
   */
  public async isInventorySynced(): Promise<boolean> {
    return SyncService.isDataSynced('products');
  }

  /**
   * Forcer la synchronisation de l'inventaire
   */
  public async forceSyncInventory(): Promise<void> {
    await SyncService.syncWithBackend();
  }
}

// Exporter l'instance singleton
const inventoryService = InventoryService.getInstance();
export default inventoryService;