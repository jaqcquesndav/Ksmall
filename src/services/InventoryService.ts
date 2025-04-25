import * as SQLite from 'expo-sqlite';
import { generateUniqueId } from '../utils/helpers';
import DatabaseService from './DatabaseService';
import logger from '../utils/logger';
import { inventoryMockData } from '../data/mockData';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  subcategory: string;
  quantity: number;
  price: number;
  cost: number;
  reorderPoint: number;
  supplier: string;
  location: string;
  imageUrl?: string | null;
}

export interface InventoryTransaction {
  id: string;
  type: 'purchase' | 'sale' | 'adjustment';
  date: string;
  reference: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice?: number;
    unitCost?: number;
    totalPrice?: number;
    totalCost?: number;
    reason?: string;
  }[];
  supplier?: string;
  customer?: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  totalAmount: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  paymentTerms?: string;
  notes?: string;
  productCategories?: string[];
}

class InventoryService {
  /**
   * Récupère tous les produits de l'inventaire
   */
  async getProducts(): Promise<InventoryItem[]> {
    try {
      const db = await DatabaseService.getDBConnection();
      const [result, error] = await DatabaseService.executeQuery(
        db,
        `SELECT * FROM inventory_items ORDER BY name`,
        []
      );
      
      if (error || !result) {
        logger.error('Erreur lors de la récupération des produits:', error);
        throw error || new Error('Erreur lors de la récupération des produits');
      }
      
      const products: InventoryItem[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        products.push({
          id: row.id.toString(),
          sku: row.sku || '',
          name: row.name,
          description: row.description,
          category: row.category || '',
          subcategory: row.subcategory || '',
          quantity: row.quantity,
          price: row.price,
          cost: row.cost,
          reorderPoint: row.reorder_point,
          supplier: row.supplier || '',
          location: row.location || '',
          imageUrl: row.image_url || null
        });
      }
      
      return products;
    } catch (error) {
      logger.error('Erreur lors de la récupération des produits:', error);
      // Si la requête échoue, retourner les données mock comme solution temporaire
      logger.warn('Utilisation des données mock comme fallback');
      return inventoryMockData.products;
    }
  }
  
  /**
   * Récupère un produit spécifique par son ID
   */
  async getProductById(id: string): Promise<InventoryItem | null> {
    try {
      const db = await DatabaseService.getDBConnection();
      const [result, error] = await DatabaseService.executeQuery(
        db,
        `SELECT * FROM inventory_items WHERE id = ?`,
        [id]
      );
      
      if (error || !result || result.rows.length === 0) {
        // Si le produit n'est pas trouvé dans la base de données, essayer les données mock
        const mockProduct = inventoryMockData.products.find(p => p.id === id);
        if (mockProduct) {
          return mockProduct;
        }
        return null;
      }
      
      const row = result.rows.item(0);
      return {
        id: row.id.toString(),
        sku: row.sku || '',
        name: row.name,
        description: row.description,
        category: row.category || '',
        subcategory: row.subcategory || '',
        quantity: row.quantity,
        price: row.price,
        cost: row.cost,
        reorderPoint: row.reorder_point,
        supplier: row.supplier || '',
        location: row.location || '',
        imageUrl: row.image_url || null
      };
    } catch (error) {
      logger.error(`Erreur lors de la récupération du produit ${id}:`, error);
      // Si la requête échoue, essayer de trouver le produit dans les données mock
      const mockProduct = inventoryMockData.products.find(p => p.id === id);
      if (mockProduct) {
        return mockProduct;
      }
      return null;
    }
  }
  
  /**
   * Ajoute un nouveau produit à l'inventaire
   */
  async addProduct(product: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    try {
      const db = await DatabaseService.getDBConnection();
      const newId = generateUniqueId();
      
      const [result, error] = await DatabaseService.executeQuery(
        db,
        `INSERT INTO inventory_items (
          name, sku, description, category, subcategory, 
          quantity, price, cost, reorder_point, supplier, location, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.name, 
          product.sku, 
          product.description || '', 
          product.category, 
          product.subcategory,
          product.quantity, 
          product.price, 
          product.cost, 
          product.reorderPoint, 
          product.supplier, 
          product.location,
          product.imageUrl || null
        ]
      );
      
      if (error || !result) {
        logger.error('Erreur lors de la création du produit:', error);
        throw error || new Error('Erreur lors de la création du produit');
      }
      
      // Récupérer l'ID généré automatiquement
      const productId = result.insertId?.toString() || newId;
      
      // Retourner le produit avec l'ID généré
      return {
        ...product,
        id: productId
      };
    } catch (error) {
      logger.error('Erreur lors de la création du produit:', error);
      throw error;
    }
  }
  
  /**
   * Met à jour un produit existant
   */
  async updateProduct(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Construire la requête de mise à jour dynamiquement
      const updateFields: string[] = [];
      const values: any[] = [];
      
      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        values.push(updates.name);
      }
      
      if (updates.sku !== undefined) {
        updateFields.push('sku = ?');
        values.push(updates.sku);
      }
      
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        values.push(updates.description);
      }
      
      if (updates.category !== undefined) {
        updateFields.push('category = ?');
        values.push(updates.category);
      }
      
      if (updates.subcategory !== undefined) {
        updateFields.push('subcategory = ?');
        values.push(updates.subcategory);
      }
      
      if (updates.quantity !== undefined) {
        updateFields.push('quantity = ?');
        values.push(updates.quantity);
      }
      
      if (updates.price !== undefined) {
        updateFields.push('price = ?');
        values.push(updates.price);
      }
      
      if (updates.cost !== undefined) {
        updateFields.push('cost = ?');
        values.push(updates.cost);
      }
      
      if (updates.reorderPoint !== undefined) {
        updateFields.push('reorder_point = ?');
        values.push(updates.reorderPoint);
      }
      
      if (updates.supplier !== undefined) {
        updateFields.push('supplier = ?');
        values.push(updates.supplier);
      }
      
      if (updates.location !== undefined) {
        updateFields.push('location = ?');
        values.push(updates.location);
      }
      
      if (updates.imageUrl !== undefined) {
        updateFields.push('image_url = ?');
        values.push(updates.imageUrl);
      }
      
      if (updateFields.length === 0) {
        // Rien à mettre à jour
        const currentProduct = await this.getProductById(id);
        if (!currentProduct) {
          throw new Error(`Produit avec l'ID ${id} non trouvé`);
        }
        return currentProduct;
      }
      
      // Ajouter l'ID à la fin des valeurs pour la clause WHERE
      values.push(id);
      
      const [result, error] = await DatabaseService.executeQuery(
        db,
        `UPDATE inventory_items SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
      
      if (error || !result) {
        logger.error(`Erreur lors de la mise à jour du produit ${id}:`, error);
        throw error || new Error(`Erreur lors de la mise à jour du produit ${id}`);
      }
      
      if (result.rowsAffected === 0) {
        throw new Error(`Produit avec l'ID ${id} non trouvé`);
      }
      
      // Récupérer et retourner le produit mis à jour
      const updatedProduct = await this.getProductById(id);
      if (!updatedProduct) {
        throw new Error(`Produit avec l'ID ${id} non trouvé après la mise à jour`);
      }
      
      return updatedProduct;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du produit ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Supprime un produit
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const db = await DatabaseService.getDBConnection();
      const [result, error] = await DatabaseService.executeQuery(
        db,
        `DELETE FROM inventory_items WHERE id = ?`,
        [id]
      );
      
      if (error || !result) {
        logger.error(`Erreur lors de la suppression du produit ${id}:`, error);
        throw error || new Error(`Erreur lors de la suppression du produit ${id}`);
      }
      
      return result.rowsAffected > 0;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du produit ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Ajuste la quantité d'un produit
   */
  async adjustStock(
    productId: string, 
    adjustmentType: 'add' | 'remove' | 'set', 
    quantity: number, 
    reason: string,
    reference?: string,
    notes?: string
  ): Promise<InventoryItem> {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Récupérer le produit actuel
      const currentProduct = await this.getProductById(productId);
      if (!currentProduct) {
        throw new Error(`Produit avec l'ID ${productId} non trouvé`);
      }
      
      // Calculer la nouvelle quantité
      let newQuantity = currentProduct.quantity;
      switch (adjustmentType) {
        case 'add':
          newQuantity += quantity;
          break;
        case 'remove':
          newQuantity = Math.max(0, newQuantity - quantity);
          break;
        case 'set':
          newQuantity = Math.max(0, quantity);
          break;
      }
      
      // Mettre à jour le stock
      const [updateResult, updateError] = await DatabaseService.executeQuery(
        db,
        `UPDATE inventory_items SET quantity = ? WHERE id = ?`,
        [newQuantity, productId]
      );
      
      if (updateError || !updateResult) {
        logger.error(`Erreur lors de l'ajustement du stock pour le produit ${productId}:`, updateError);
        throw updateError || new Error(`Erreur lors de l'ajustement du stock pour le produit ${productId}`);
      }
      
      // Créer une transaction d'inventaire pour suivre le mouvement
      const transactionId = generateUniqueId();
      const now = new Date().toISOString();
      const transactionRef = reference || `ADJ-${Date.now().toString().slice(-6)}`;
      
      // Enregistrer la transaction d'ajustement de stock
      await this.recordInventoryTransaction({
        id: transactionId,
        type: 'adjustment',
        date: now,
        reference: transactionRef,
        items: [{
          productId,
          quantity: adjustmentType === 'add' ? quantity : (adjustmentType === 'remove' ? -quantity : newQuantity - currentProduct.quantity),
          reason
        }],
        status: 'completed',
        notes: notes || `Ajustement de stock: ${reason}`,
        totalAmount: 0 // Les ajustements n'ont pas de montant monétaire
      });
      
      // Récupérer et retourner le produit mis à jour
      return {
        ...currentProduct,
        quantity: newQuantity
      };
    } catch (error) {
      logger.error(`Erreur lors de l'ajustement du stock pour le produit ${productId}:`, error);
      throw error;
    }
  }
  
  /**
   * Récupère les produits à faible stock (sous le point de réapprovisionnement)
   */
  async getLowStockProducts(): Promise<InventoryItem[]> {
    try {
      const db = await DatabaseService.getDBConnection();
      const [result, error] = await DatabaseService.executeQuery(
        db,
        `SELECT * FROM inventory_items WHERE quantity <= reorder_point ORDER BY name`,
        []
      );
      
      if (error || !result) {
        logger.error('Erreur lors de la récupération des produits à faible stock:', error);
        throw error || new Error('Erreur lors de la récupération des produits à faible stock');
      }
      
      const products: InventoryItem[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        products.push({
          id: row.id.toString(),
          sku: row.sku || '',
          name: row.name,
          description: row.description,
          category: row.category || '',
          subcategory: row.subcategory || '',
          quantity: row.quantity,
          price: row.price,
          cost: row.cost,
          reorderPoint: row.reorder_point,
          supplier: row.supplier || '',
          location: row.location || '',
          imageUrl: row.image_url || null
        });
      }
      
      return products;
    } catch (error) {
      logger.error('Erreur lors de la récupération des produits à faible stock:', error);
      // Utiliser les données mock comme fallback
      return inventoryMockData.products.filter(p => p.quantity <= p.reorderPoint);
    }
  }
  
  /**
   * Récupère les produits par catégorie
   */
  async getProductsByCategory(category: string): Promise<InventoryItem[]> {
    try {
      const db = await DatabaseService.getDBConnection();
      const [result, error] = await DatabaseService.executeQuery(
        db,
        `SELECT * FROM inventory_items WHERE category = ? ORDER BY name`,
        [category]
      );
      
      if (error || !result) {
        logger.error(`Erreur lors de la récupération des produits de la catégorie ${category}:`, error);
        throw error || new Error(`Erreur lors de la récupération des produits de la catégorie ${category}`);
      }
      
      const products: InventoryItem[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        products.push({
          id: row.id.toString(),
          sku: row.sku || '',
          name: row.name,
          description: row.description,
          category: row.category || '',
          subcategory: row.subcategory || '',
          quantity: row.quantity,
          price: row.price,
          cost: row.cost,
          reorderPoint: row.reorder_point,
          supplier: row.supplier || '',
          location: row.location || '',
          imageUrl: row.image_url || null
        });
      }
      
      return products;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des produits de la catégorie ${category}:`, error);
      // Utiliser les données mock comme fallback
      return inventoryMockData.products.filter(p => p.category === category);
    }
  }
  
  /**
   * Récupère les fournisseurs
   */
  async getSuppliers(): Promise<Supplier[]> {
    // À implémenter quand la table des fournisseurs sera créée
    // Pour le moment, retourner les données mock
    return inventoryMockData.suppliers || [];
  }
  
  /**
   * Ajoute un nouveau fournisseur
   */
  async addSupplier(supplier: Supplier): Promise<Supplier> {
    try {
      // À implémenter quand la table des fournisseurs sera créée
      // Pour le moment, simuler une création réussie
      logger.info('Ajout d\'un fournisseur (simulation):', supplier);
      
      // Dans une implémentation réelle, on ajouterait le fournisseur à la base de données
      // Pour cette simulation, on retourne simplement le fournisseur tel quel
      return supplier;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du fournisseur:', error);
      throw error;
    }
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(id: string): Promise<Supplier | null> {
    // For now, get all suppliers and find the one with matching ID
    const suppliers = await this.getSuppliers();
    return suppliers.find(supplier => supplier.id === id) || null;
  }

  /**
   * Update a supplier
   */
  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    // Mock implementation until database support is added
    logger.info(`Updating supplier ${id}`, updates);
    
    const suppliers = await this.getSuppliers();
    const supplierIndex = suppliers.findIndex(supplier => supplier.id === id);
    
    if (supplierIndex === -1) {
      throw new Error(`Supplier with ID ${id} not found`);
    }
    
    // Create updated supplier
    const updatedSupplier = {
      ...suppliers[supplierIndex],
      ...updates
    };
    
    // In a real implementation, this would update the database
    return updatedSupplier;
  }

  /**
   * Delete a supplier
   */
  async deleteSupplier(id: string): Promise<boolean> {
    // Mock implementation until database support is added
    logger.info(`Deleting supplier ${id}`);
    
    // In a real implementation, this would delete from the database
    return true;
  }

  /**
   * Record a new inventory transaction
   */
  async recordInventoryTransaction(transaction: InventoryTransaction): Promise<InventoryTransaction> {
    // Mock implementation until database support is added
    logger.info('Recording inventory transaction', transaction);
    
    // In a real implementation, this would create a transaction in the database
    return transaction;
  }

  /**
   * Get all inventory transactions
   */
  async getInventoryTransactions(): Promise<InventoryTransaction[]> {
    try {
      // Mock implementation until database support is added
      logger.info('Getting inventory transactions');
      
      // In a real implementation, this would fetch from the database
      // For now, return mock data
      return [
        {
          id: 'tx-' + Date.now(),
          type: 'purchase',
          date: new Date().toISOString(),
          reference: 'PO-' + Math.floor(Math.random() * 1000),
          items: [
            {
              productId: 'prod-1',
              quantity: 10,
              unitPrice: 20,
              unitCost: 15,
              totalPrice: 200,
              totalCost: 150
            }
          ],
          supplier: 'supplier-1',
          status: 'completed',
          notes: 'Restock purchase',
          totalAmount: 200
        }
      ];
    } catch (error) {
      logger.error('Error getting inventory transactions:', error);
      return [];
    }
  }

  /**
   * Get stock levels for all products
   */
  async getStockLevels(): Promise<any[]> {
    // Mock implementation that creates stock levels from products
    const products = await this.getProducts();
    
    return products.map(product => ({
      id: `stock-${product.id}`,
      productId: product.id,
      quantity: product.quantity,
      location: product.location || 'default',
      lastUpdated: new Date().toISOString()
    }));
  }

  /**
   * Get stock for a specific product
   */
  async getStockByProductId(productId: string): Promise<any | null> {
    const product = await this.getProductById(productId);
    
    if (!product) {
      return null;
    }
    
    return {
      id: `stock-${productId}`,
      productId: productId,
      quantity: product.quantity,
      location: product.location || 'default',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Check for items with stock levels below threshold
   */
  async checkLowStockItems(threshold?: number): Promise<any[]> {
    const products = await this.getProducts();
    const defaultThreshold = 10; // Default threshold if not specified
    
    return products.filter(product => 
      product.quantity <= (threshold !== undefined ? threshold : 
        (product.reorderPoint || defaultThreshold))
    );
  }

  /**
   * Calculate total inventory value
   */
  async calculateInventoryValue(): Promise<number> {
    const products = await this.getProducts();
    
    return products.reduce((total, product) => 
      total + (product.quantity * product.cost), 0);
  }
}

export default new InventoryService();