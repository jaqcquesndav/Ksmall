/**
 * Service de synchronisation des produits
 * Gère la synchronisation du catalogue produits entre le mode hors ligne et en ligne
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';
import DatabaseService from '../DatabaseService';
import { BaseSyncService } from './BaseSyncService';
import { BusinessDomain, SyncPriority, SyncCheckpoint, AdvancedSyncOptions } from './SyncTypes';
import { api } from '../../services';
import { generateUniqueId } from '../../utils/helpers';
import { SyncOptions } from './SyncService';

// Tables à synchroniser
const PRODUCT_TABLES = {
  PRODUCTS: 'products',
  CATEGORIES: 'product_categories',
  VARIANTS: 'product_variants',
  PRICES: 'product_prices',
  ATTRIBUTES: 'product_attributes',
  IMAGES: 'product_images',
  SUPPLIERS: 'product_suppliers'
};

class ProductSyncService implements BaseSyncService {
  private static instance: ProductSyncService;
  private db: SQLite.WebSQLDatabase | null = null;
  
  // Propriétés relatives au domaine métier
  private readonly businessDomain: BusinessDomain = BusinessDomain.CATALOG;
  private readonly businessEntities: string[] = ['products', 'categories', 'variants', 'prices'];
  private readonly userFriendlyName: string = 'Catalogue produits';
  private readonly userFriendlyDescription: string = 'Synchronisation des produits, catégories, variantes et prix';
  private readonly syncPriority: SyncPriority = SyncPriority.HIGH;

  private constructor() {
    // Initialiser la base de données
    this.initDatabase();
  }

  /**
   * Obtenir l'instance singleton du service
   */
  public static getInstance(): ProductSyncService {
    if (!ProductSyncService.instance) {
      ProductSyncService.instance = new ProductSyncService();
    }
    return ProductSyncService.instance;
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
   * Obtenir la priorité de synchronisation
   */
  public getPriority(): SyncPriority {
    return this.syncPriority;
  }

  /**
   * Initialiser la base de données
   */
  private async initDatabase(): Promise<void> {
    try {
      this.db = await DatabaseService.getDatabase();
      
      // S'assurer que toutes les tables existent
      await this.ensureLocalStructure();
      
      logger.debug(`Tables du ${this.getUserFriendlyName()} créées ou vérifiées`);
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation des tables du ${this.getUserFriendlyName()}:`, error);
    }
  }

  /**
   * Créer la structure locale si nécessaire
   */
  public async ensureLocalStructure(): Promise<void> {
    if (!this.db) return;

    // Table des produits
    await DatabaseService.createTableIfNotExists(
      this.db,
      PRODUCT_TABLES.PRODUCTS,
      `id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       description TEXT,
       sku TEXT,
       barcode TEXT,
       category_id TEXT,
       brand TEXT,
       is_active INTEGER DEFAULT 1,
       is_service INTEGER DEFAULT 0,
       is_tracked INTEGER DEFAULT 1,
       unit TEXT,
       weight REAL,
       dimensions TEXT,
       created_at TEXT,
       updated_at TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT,
       deleted_at TEXT`
    );
    
    // Table des catégories de produits
    await DatabaseService.createTableIfNotExists(
      this.db,
      PRODUCT_TABLES.CATEGORIES,
      `id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       description TEXT,
       parent_id TEXT,
       is_active INTEGER DEFAULT 1,
       created_at TEXT,
       updated_at TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT`
    );
    
    // Table des variantes de produits
    await DatabaseService.createTableIfNotExists(
      this.db,
      PRODUCT_TABLES.VARIANTS,
      `id TEXT PRIMARY KEY,
       product_id TEXT NOT NULL,
       name TEXT NOT NULL,
       sku TEXT,
       barcode TEXT,
       attributes TEXT,
       created_at TEXT,
       updated_at TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT,
       FOREIGN KEY(product_id) REFERENCES ${PRODUCT_TABLES.PRODUCTS}(id) ON DELETE CASCADE`
    );
    
    // Table des prix de produits
    await DatabaseService.createTableIfNotExists(
      this.db,
      PRODUCT_TABLES.PRICES,
      `id TEXT PRIMARY KEY,
       product_id TEXT NOT NULL,
       variant_id TEXT,
       price_type TEXT NOT NULL,
       amount REAL NOT NULL,
       currency TEXT NOT NULL,
       tax_included INTEGER DEFAULT 0,
       tax_rate REAL,
       start_date TEXT,
       end_date TEXT,
       min_quantity INTEGER DEFAULT 1,
       created_at TEXT,
       updated_at TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT,
       FOREIGN KEY(product_id) REFERENCES ${PRODUCT_TABLES.PRODUCTS}(id) ON DELETE CASCADE,
       FOREIGN KEY(variant_id) REFERENCES ${PRODUCT_TABLES.VARIANTS}(id) ON DELETE CASCADE`
    );
    
    // Table des attributs de produits
    await DatabaseService.createTableIfNotExists(
      this.db,
      PRODUCT_TABLES.ATTRIBUTES,
      `id TEXT PRIMARY KEY,
       product_id TEXT NOT NULL,
       name TEXT NOT NULL,
       value TEXT NOT NULL,
       created_at TEXT,
       updated_at TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT,
       FOREIGN KEY(product_id) REFERENCES ${PRODUCT_TABLES.PRODUCTS}(id) ON DELETE CASCADE`
    );
    
    // Table des images de produits
    await DatabaseService.createTableIfNotExists(
      this.db,
      PRODUCT_TABLES.IMAGES,
      `id TEXT PRIMARY KEY,
       product_id TEXT NOT NULL,
       variant_id TEXT,
       url TEXT,
       local_path TEXT,
       is_primary INTEGER DEFAULT 0,
       order_index INTEGER DEFAULT 0,
       created_at TEXT,
       updated_at TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT,
       FOREIGN KEY(product_id) REFERENCES ${PRODUCT_TABLES.PRODUCTS}(id) ON DELETE CASCADE,
       FOREIGN KEY(variant_id) REFERENCES ${PRODUCT_TABLES.VARIANTS}(id) ON DELETE CASCADE`
    );
    
    // Table des fournisseurs de produits
    await DatabaseService.createTableIfNotExists(
      this.db,
      PRODUCT_TABLES.SUPPLIERS,
      `id TEXT PRIMARY KEY,
       product_id TEXT NOT NULL,
       supplier_id TEXT NOT NULL,
       supplier_sku TEXT,
       cost_price REAL,
       currency TEXT,
       lead_time INTEGER,
       min_order_quantity INTEGER DEFAULT 1,
       is_preferred INTEGER DEFAULT 0,
       created_at TEXT,
       updated_at TEXT,
       synced INTEGER DEFAULT 0,
       remote_id TEXT,
       FOREIGN KEY(product_id) REFERENCES ${PRODUCT_TABLES.PRODUCTS}(id) ON DELETE CASCADE`
    );
  }

  /**
   * Synchroniser les produits
   */
  public async synchronize(forceFullSync: boolean = false, options?: SyncOptions & AdvancedSyncOptions): Promise<boolean> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      logger.info(`Démarrage de la synchronisation du ${this.getUserFriendlyName()}`);
      
      // Synchronisation des catégories (données de base, prioritaires)
      await this.syncCategories(forceFullSync);
      
      // Synchronisation des produits
      await this.syncProducts(forceFullSync);
      
      // Synchronisation des variantes
      await this.syncVariants(forceFullSync);
      
      // Synchronisation des prix
      await this.syncPrices(forceFullSync);
      
      // Synchronisation des attributs
      await this.syncAttributes(forceFullSync);
      
      // Synchronisation des images (potentiellement volumineuses)
      await this.syncImages(forceFullSync);
      
      // Synchronisation des informations fournisseurs
      await this.syncSuppliers(forceFullSync);
      
      logger.info(`Synchronisation du ${this.getUserFriendlyName()} terminée avec succès`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la synchronisation du ${this.getUserFriendlyName()}:`, error);
      return false;
    }
  }

  /**
   * Synchroniser par lots
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
      
      // Déterminer quelle entité synchroniser en fonction du batchIndex
      const totalEntities = 7; // Nombre total d'entités à synchroniser
      const entityIndex = Math.floor(batchIndex / 3); // Chaque entité a potentiellement plusieurs lots
      
      switch (entityIndex) {
        case 0: // Catégories
          await this.syncCategoriesBatch(batchIndex % 3, batchSize);
          break;
        case 1: // Produits
          await this.syncProductsBatch(batchIndex % 3, batchSize);
          break;
        case 2: // Variantes
          await this.syncVariantsBatch(batchIndex % 3, batchSize);
          break;
        case 3: // Prix
          await this.syncPricesBatch(batchIndex % 3, batchSize);
          break;
        case 4: // Attributs
          await this.syncAttributesBatch(batchIndex % 3, batchSize);
          break;
        case 5: // Images
          await this.syncImagesBatch(batchIndex % 3, batchSize);
          break;
        case 6: // Fournisseurs
          await this.syncSuppliersBatch(batchIndex % 3, batchSize);
          break;
      }
      
      // Incrémentation du compteur
      currentCheckpoint.processedCount += batchSize;
      
      // Si nous avons traité toutes les entités et tous les lots associés
      if (batchIndex >= totalEntities * 3 - 1) {
        currentCheckpoint.completed = true;
        currentCheckpoint.lastSyncTime = new Date();
      } else {
        currentCheckpoint.batchIndex = batchIndex + 1;
      }
      
      return currentCheckpoint;
    } catch (error) {
      logger.error(`Erreur lors de la synchronisation par lots du ${this.getUserFriendlyName()}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer les données du serveur
   */
  public async pullFromServer(forceFullSync: boolean = false, lastSyncTime?: Date, options?: AdvancedSyncOptions): Promise<number> {
    try {
      // La logique de pull est distribuée dans les méthodes spécifiques
      let totalPulled = 0;
      
      if (!global.__DEMO_MODE__ && !global.__OFFLINE_MODE__) {
        // Récupérer les données pour chaque entité
        const entities = [
          { endpoint: 'categories', table: PRODUCT_TABLES.CATEGORIES },
          { endpoint: 'products', table: PRODUCT_TABLES.PRODUCTS },
          { endpoint: 'variants', table: PRODUCT_TABLES.VARIANTS },
          { endpoint: 'prices', table: PRODUCT_TABLES.PRICES },
          { endpoint: 'attributes', table: PRODUCT_TABLES.ATTRIBUTES }
          // Les images sont gérées séparément
        ];
        
        for (const entity of entities) {
          try {
            const params = lastSyncTime && !forceFullSync 
              ? { updated_since: lastSyncTime.toISOString() }
              : {};
              
            const response = await api.get(`/products/${entity.endpoint}`, { params });
            
            if (response.data && Array.isArray(response.data)) {
              totalPulled += response.data.length;
              // Le traitement des données est fait dans les méthodes spécifiques
            }
          } catch (error) {
            logger.error(`Erreur lors du pull des ${entity.endpoint}:`, error);
          }
        }
      }
      
      return totalPulled;
    } catch (error) {
      logger.error(`Erreur générale lors du pull des données du ${this.getUserFriendlyName()}:`, error);
      return 0;
    }
  }

  /**
   * Envoyer les données vers le serveur
   */
  public async pushToServer(onlyModified: boolean = true, options?: AdvancedSyncOptions): Promise<number> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      let totalPushed = 0;
      
      // Les tables à pousser vers le serveur dans l'ordre de dépendance
      const tablesToPush = [
        PRODUCT_TABLES.CATEGORIES,
        PRODUCT_TABLES.PRODUCTS,
        PRODUCT_TABLES.VARIANTS,
        PRODUCT_TABLES.PRICES,
        PRODUCT_TABLES.ATTRIBUTES,
        PRODUCT_TABLES.SUPPLIERS,
        // Les images sont gérées séparément
      ];
      
      for (const table of tablesToPush) {
        const condition = onlyModified ? 'WHERE synced = 0 AND deleted_at IS NULL' : 'WHERE deleted_at IS NULL';
        
        const [result] = await DatabaseService.executeQuery(
          this.db,
          `SELECT * FROM ${table} ${condition}`
        );
        
        for (let i = 0; i < result.rows.length; i++) {
          const item = result.rows.item(i);
          
          try {
            if (!global.__DEMO_MODE__ && !global.__OFFLINE_MODE__) {
              // Déterminer le endpoint en fonction de la table
              const endpoint = this.getEndpointForTable(table);
              
              // Envoyer les données au serveur
              const response = await api.post(`/products/${endpoint}`, item);
              
              if (response.data && response.data.id) {
                // Mettre à jour l'état de synchronisation et l'ID distant
                await DatabaseService.executeQuery(
                  this.db,
                  `UPDATE ${table} SET synced = 1, remote_id = ? WHERE id = ?`,
                  [response.data.id, item.id]
                );
                
                totalPushed++;
              }
            } else {
              // En mode démo, simuler la synchronisation
              await DatabaseService.executeQuery(
                this.db,
                `UPDATE ${table} SET synced = 1 WHERE id = ?`,
                [item.id]
              );
              
              totalPushed++;
            }
          } catch (error) {
            logger.error(`Erreur lors du push de l'item ${item.id} de la table ${table}:`, error);
            // Continuer avec le prochain item
          }
        }
      }
      
      return totalPushed;
    } catch (error) {
      logger.error(`Erreur générale lors du push des données du ${this.getUserFriendlyName()}:`, error);
      return 0;
    }
  }

  /**
   * Obtenir le endpoint API pour une table
   */
  private getEndpointForTable(table: string): string {
    switch (table) {
      case PRODUCT_TABLES.CATEGORIES:
        return 'categories';
      case PRODUCT_TABLES.PRODUCTS:
        return 'products';
      case PRODUCT_TABLES.VARIANTS:
        return 'variants';
      case PRODUCT_TABLES.PRICES:
        return 'prices';
      case PRODUCT_TABLES.ATTRIBUTES:
        return 'attributes';
      case PRODUCT_TABLES.SUPPLIERS:
        return 'suppliers';
      case PRODUCT_TABLES.IMAGES:
        return 'images';
      default:
        return 'products';
    }
  }

  /**
   * Résoudre un conflit entre les données locales et distantes
   */
  public async resolveConflict(localData: any, serverData: any, strategy: 'LOCAL' | 'REMOTE' | 'MERGE' | 'ASK'): Promise<any> {
    switch (strategy) {
      case 'LOCAL':
        return localData;
      case 'REMOTE':
        return serverData;
      case 'MERGE':
        // Fusionner les deux versions
        // Pour les produits, on garde généralement toutes les informations
        return {
          ...serverData,
          ...localData,
          updated_at: new Date().toISOString()
        };
      case 'ASK':
        // Laisser l'utilisateur décider
        return {
          conflict: true,
          local: localData,
          remote: serverData,
          entityType: 'product',
          entityId: localData.id || serverData.id
        };
      default:
        return serverData;
    }
  }

  /**
   * Sauvegarder un checkpoint
   */
  public async saveCheckpoint(checkpoint: SyncCheckpoint): Promise<void> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      const checkpointKey = 'product_sync_checkpoint';
      const checkpointData = JSON.stringify(checkpoint);
      
      // Vérifier si le checkpoint existe déjà
      const [existingResult] = await DatabaseService.executeQuery(
        this.db,
        `SELECT * FROM sync_config WHERE entity_name = ?`,
        [checkpointKey]
      );
      
      if (existingResult.rows.length > 0) {
        // Mettre à jour
        await DatabaseService.executeQuery(
          this.db,
          `UPDATE sync_config SET last_sync_timestamp = ?, checkpoint_data = ? WHERE entity_name = ?`,
          [new Date().toISOString(), checkpointData, checkpointKey]
        );
      } else {
        // Créer nouveau
        await DatabaseService.executeQuery(
          this.db,
          `INSERT INTO sync_config (entity_name, last_sync_timestamp, checkpoint_data) VALUES (?, ?, ?)`,
          [checkpointKey, new Date().toISOString(), checkpointData]
        );
      }
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde du checkpoint pour ${this.getUserFriendlyName()}:`, error);
    }
  }

  /**
   * Charger un checkpoint
   */
  public async loadCheckpoint(): Promise<SyncCheckpoint | null> {
    try {
      if (!this.db) {
        this.db = await DatabaseService.getDatabase();
      }
      
      const checkpointKey = 'product_sync_checkpoint';
      
      const [result] = await DatabaseService.executeQuery(
        this.db,
        `SELECT checkpoint_data FROM sync_config WHERE entity_name = ?`,
        [checkpointKey]
      );
      
      if (result.rows.length > 0 && result.rows.item(0).checkpoint_data) {
        return JSON.parse(result.rows.item(0).checkpoint_data);
      }
      
      return null;
    } catch (error) {
      logger.error(`Erreur lors du chargement du checkpoint pour ${this.getUserFriendlyName()}:`, error);
      return null;
    }
  }

  /**
   * Synchroniser les catégories de produits
   */
  private async syncCategories(forceFullSync: boolean): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les catégories par lots
   */
  private async syncCategoriesBatch(batchIndex: number, batchSize: number): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les produits
   */
  private async syncProducts(forceFullSync: boolean): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les produits par lots
   */
  private async syncProductsBatch(batchIndex: number, batchSize: number): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les variantes de produits
   */
  private async syncVariants(forceFullSync: boolean): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les variantes par lots
   */
  private async syncVariantsBatch(batchIndex: number, batchSize: number): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les prix
   */
  private async syncPrices(forceFullSync: boolean): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les prix par lots
   */
  private async syncPricesBatch(batchIndex: number, batchSize: number): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les attributs
   */
  private async syncAttributes(forceFullSync: boolean): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les attributs par lots
   */
  private async syncAttributesBatch(batchIndex: number, batchSize: number): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les images de produits
   */
  private async syncImages(forceFullSync: boolean): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les images par lots
   */
  private async syncImagesBatch(batchIndex: number, batchSize: number): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les fournisseurs
   */
  private async syncSuppliers(forceFullSync: boolean): Promise<void> {
    // ...existing code...
  }

  /**
   * Synchroniser les fournisseurs par lots
   */
  private async syncSuppliersBatch(batchIndex: number, batchSize: number): Promise<void> {
    // ...existing code...
  }

  /**
   * Obtenir la date de dernière synchronisation
   */
  private async getLastSyncDate(tableName: string): Promise<Date | null> {
    // ...existing code...
  }

  /**
   * Définir la date de dernière synchronisation
   */
  private async setLastSyncDate(tableName: string, date: Date): Promise<void> {
    // ...existing code...
  }

  /**
   * Ajouter un produit localement
   */
  public async addProduct(product: any): Promise<string | null> {
    // ...existing code...
  }

  /**
   * Mettre à jour un produit localement
   */
  public async updateProduct(product: any): Promise<boolean> {
    // ...existing code...
  }

  /**
   * Supprimer un produit
   */
  public async deleteProduct(productId: string): Promise<boolean> {
    // ...existing code...
  }

  /**
   * Obtenir un produit par son ID
   */
  public async getProductById(productId: string): Promise<any | null> {
    // ...existing code...
  }

  /**
   * Rechercher des produits
   */
  public async searchProducts(query: string, options?: any): Promise<any[]> {
    // ...existing code...
  }
}

// Exporter une instance singleton du service
const productSyncService = ProductSyncService.getInstance();
export default productSyncService;