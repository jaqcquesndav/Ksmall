import ApiService from '../ApiService';
import logger from '../../../utils/logger';

/**
 * Interface pour un produit de l'inventaire
 */
export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number;
  costPrice: number;
  quantity: number;
  unit: string;
  imageUrl?: string;
  tags?: string[];
  attributes?: Record<string, string>;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface pour une catégorie de produits
 */
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  productsCount: number;
}

/**
 * Interface pour une opération d'inventaire
 */
export interface InventoryOperation {
  id: string;
  type: 'receipt' | 'issue' | 'adjustment' | 'transfer';
  reference: string;
  date: string;
  description: string;
  items: InventoryOperationItem[];
  status: 'draft' | 'confirmed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  locationId?: string;
  targetLocationId?: string; // Pour les transferts
}

/**
 * Interface pour un élément d'opération d'inventaire
 */
export interface InventoryOperationItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  reason?: string;
  batchNumber?: string;
  expiryDate?: string;
}

/**
 * Interface pour un emplacement de stockage
 */
export interface StorageLocation {
  id: string;
  name: string;
  description?: string;
  address?: string;
  isDefault: boolean;
}

/**
 * Options pour la récupération des produits
 */
export interface GetProductsOptions {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Options pour la récupération des opérations d'inventaire
 */
export interface GetOperationsOptions {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  type?: 'receipt' | 'issue' | 'adjustment' | 'transfer';
  status?: 'draft' | 'confirmed' | 'cancelled';
  reference?: string;
  productId?: string;
}

/**
 * Service API pour la gestion de l'inventaire
 */
class InventoryApiService {
  private static readonly BASE_PATH = '/inventory';

  /**
   * Récupère la liste des produits
   */
  async getProducts(options: GetProductsOptions = {}): Promise<Product[]> {
    try {
      return await ApiService.get<Product[]>(
        `${InventoryApiService.BASE_PATH}/products`,
        options
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des produits', error);
      throw error;
    }
  }

  /**
   * Récupère un produit par ID
   */
  async getProductById(id: string): Promise<Product> {
    try {
      return await ApiService.get<Product>(
        `${InventoryApiService.BASE_PATH}/products/${id}`
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération du produit ${id}`, error);
      throw error;
    }
  }

  /**
   * Recherche des produits par code-barres
   */
  async findProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const result = await ApiService.get<Product[]>(
        `${InventoryApiService.BASE_PATH}/products/barcode/${barcode}`
      );
      
      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error(`Erreur lors de la recherche du produit par code-barres ${barcode}`, error);
      throw error;
    }
  }

  /**
   * Crée un nouveau produit
   */
  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      return await ApiService.post<Product>(
        `${InventoryApiService.BASE_PATH}/products`,
        product
      );
    } catch (error) {
      logger.error('Erreur lors de la création du produit', error);
      throw error;
    }
  }

  /**
   * Met à jour un produit existant
   */
  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    try {
      return await ApiService.put<Product>(
        `${InventoryApiService.BASE_PATH}/products/${id}`,
        product
      );
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du produit ${id}`, error);
      throw error;
    }
  }

  /**
   * Supprime un produit
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      await ApiService.delete(
        `${InventoryApiService.BASE_PATH}/products/${id}`
      );
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du produit ${id}`, error);
      throw error;
    }
  }

  /**
   * Télécharge l'image d'un produit
   */
  async uploadProductImage(productId: string, imageData: FormData): Promise<{ imageUrl: string }> {
    try {
      return await ApiService.uploadFile<{ imageUrl: string }>(
        `${InventoryApiService.BASE_PATH}/products/${productId}/image`,
        imageData
      );
    } catch (error) {
      logger.error(`Erreur lors du téléchargement de l'image pour le produit ${productId}`, error);
      throw error;
    }
  }

  /**
   * Récupère les catégories de produits
   */
  async getCategories(): Promise<ProductCategory[]> {
    try {
      return await ApiService.get<ProductCategory[]>(
        `${InventoryApiService.BASE_PATH}/categories`
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des catégories', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle catégorie
   */
  async createCategory(category: Omit<ProductCategory, 'id' | 'productsCount'>): Promise<ProductCategory> {
    try {
      return await ApiService.post<ProductCategory>(
        `${InventoryApiService.BASE_PATH}/categories`,
        category
      );
    } catch (error) {
      logger.error('Erreur lors de la création de la catégorie', error);
      throw error;
    }
  }

  /**
   * Met à jour une catégorie
   */
  async updateCategory(id: string, category: Partial<ProductCategory>): Promise<ProductCategory> {
    try {
      return await ApiService.put<ProductCategory>(
        `${InventoryApiService.BASE_PATH}/categories/${id}`,
        category
      );
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la catégorie ${id}`, error);
      throw error;
    }
  }

  /**
   * Supprime une catégorie
   */
  async deleteCategory(id: string): Promise<boolean> {
    try {
      await ApiService.delete(
        `${InventoryApiService.BASE_PATH}/categories/${id}`
      );
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la catégorie ${id}`, error);
      throw error;
    }
  }

  /**
   * Récupère les opérations d'inventaire
   */
  async getOperations(options: GetOperationsOptions = {}): Promise<InventoryOperation[]> {
    try {
      return await ApiService.get<InventoryOperation[]>(
        `${InventoryApiService.BASE_PATH}/operations`,
        options
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des opérations d\'inventaire', error);
      throw error;
    }
  }

  /**
   * Récupère une opération d'inventaire par ID
   */
  async getOperationById(id: string): Promise<InventoryOperation> {
    try {
      return await ApiService.get<InventoryOperation>(
        `${InventoryApiService.BASE_PATH}/operations/${id}`
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération de l'opération d'inventaire ${id}`, error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle opération d'inventaire
   */
  async createOperation(operation: Omit<InventoryOperation, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryOperation> {
    try {
      return await ApiService.post<InventoryOperation>(
        `${InventoryApiService.BASE_PATH}/operations`,
        operation
      );
    } catch (error) {
      logger.error('Erreur lors de la création de l\'opération d\'inventaire', error);
      throw error;
    }
  }

  /**
   * Met à jour une opération d'inventaire
   */
  async updateOperation(id: string, operation: Partial<InventoryOperation>): Promise<InventoryOperation> {
    try {
      return await ApiService.put<InventoryOperation>(
        `${InventoryApiService.BASE_PATH}/operations/${id}`,
        operation
      );
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de l'opération d'inventaire ${id}`, error);
      throw error;
    }
  }

  /**
   * Confirme une opération d'inventaire
   */
  async confirmOperation(id: string): Promise<InventoryOperation> {
    try {
      return await ApiService.put<InventoryOperation>(
        `${InventoryApiService.BASE_PATH}/operations/${id}/confirm`,
        {}
      );
    } catch (error) {
      logger.error(`Erreur lors de la confirmation de l'opération d'inventaire ${id}`, error);
      throw error;
    }
  }

  /**
   * Annule une opération d'inventaire
   */
  async cancelOperation(id: string, reason: string): Promise<InventoryOperation> {
    try {
      return await ApiService.put<InventoryOperation>(
        `${InventoryApiService.BASE_PATH}/operations/${id}/cancel`,
        { reason }
      );
    } catch (error) {
      logger.error(`Erreur lors de l'annulation de l'opération d'inventaire ${id}`, error);
      throw error;
    }
  }

  /**
   * Supprime une opération d'inventaire (seulement celles en brouillon)
   */
  async deleteOperation(id: string): Promise<boolean> {
    try {
      await ApiService.delete(
        `${InventoryApiService.BASE_PATH}/operations/${id}`
      );
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de l'opération d'inventaire ${id}`, error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des mouvements d'un produit
   */
  async getProductMovements(productId: string, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      const params: Record<string, any> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      return await ApiService.get<any[]>(
        `${InventoryApiService.BASE_PATH}/products/${productId}/movements`,
        params
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération des mouvements du produit ${productId}`, error);
      throw error;
    }
  }

  /**
   * Récupère les emplacements de stockage
   */
  async getLocations(): Promise<StorageLocation[]> {
    try {
      return await ApiService.get<StorageLocation[]>(
        `${InventoryApiService.BASE_PATH}/locations`
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des emplacements de stockage', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel emplacement de stockage
   */
  async createLocation(location: Omit<StorageLocation, 'id'>): Promise<StorageLocation> {
    try {
      return await ApiService.post<StorageLocation>(
        `${InventoryApiService.BASE_PATH}/locations`,
        location
      );
    } catch (error) {
      logger.error('Erreur lors de la création de l\'emplacement de stockage', error);
      throw error;
    }
  }

  /**
   * Met à jour un emplacement de stockage
   */
  async updateLocation(id: string, location: Partial<StorageLocation>): Promise<StorageLocation> {
    try {
      return await ApiService.put<StorageLocation>(
        `${InventoryApiService.BASE_PATH}/locations/${id}`,
        location
      );
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de l'emplacement de stockage ${id}`, error);
      throw error;
    }
  }

  /**
   * Supprime un emplacement de stockage
   */
  async deleteLocation(id: string): Promise<boolean> {
    try {
      await ApiService.delete(
        `${InventoryApiService.BASE_PATH}/locations/${id}`
      );
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de l'emplacement de stockage ${id}`, error);
      throw error;
    }
  }

  /**
   * Effectue un inventaire physique
   */
  async performPhysicalCount(data: {
    date: string;
    locationId?: string;
    items: Array<{
      productId: string;
      countedQuantity: number;
      note?: string;
    }>;
    notes?: string;
  }): Promise<InventoryOperation> {
    try {
      return await ApiService.post<InventoryOperation>(
        `${InventoryApiService.BASE_PATH}/physical-count`,
        data
      );
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de l\'inventaire physique', error);
      throw error;
    }
  }

  /**
   * Synchronise les données d'inventaire avec le backend
   */
  async syncInventoryData(lastSyncDate?: string): Promise<{
    status: 'success' | 'partial' | 'failed';
    updated: number;
    errors: any[];
  }> {
    try {
      return await ApiService.post<{
        status: 'success' | 'partial' | 'failed';
        updated: number;
        errors: any[];
      }>(
        `${InventoryApiService.BASE_PATH}/sync`,
        { lastSyncDate: lastSyncDate || null }
      );
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des données d\'inventaire', error);
      throw error;
    }
  }

  /**
   * Exporte les données d'inventaire (produits ou opérations)
   */
  async exportData(type: 'products' | 'operations', options: any = {}): Promise<{ url: string }> {
    try {
      return await ApiService.post<{ url: string }>(
        `${InventoryApiService.BASE_PATH}/export/${type}`,
        options
      );
    } catch (error) {
      logger.error(`Erreur lors de l'exportation des données d'inventaire de type ${type}`, error);
      throw error;
    }
  }

  /**
   * Importe des produits à partir d'un fichier
   */
  async importProducts(formData: FormData): Promise<{
    imported: number;
    updated: number;
    errors: any[];
  }> {
    try {
      return await ApiService.uploadFile<{
        imported: number;
        updated: number;
        errors: any[];
      }>(
        `${InventoryApiService.BASE_PATH}/import/products`,
        formData
      );
    } catch (error) {
      logger.error('Erreur lors de l\'importation des produits', error);
      throw error;
    }
  }
}

export default new InventoryApiService();