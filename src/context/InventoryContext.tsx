import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import InventoryService from '../services/InventoryService';
import DatabaseService from '../services/DatabaseService';
import { Product, Supplier, Stock } from '../types/inventory';
import logger from '../utils/logger';

// Define InventoryTransaction type since it wasn't found in inventory.ts
interface InventoryTransaction {
  id: string;
  type: 'purchase' | 'sale' | 'adjustment'; // Removed 'transfer' to match with service definition
  date: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

// Define adapter functions to convert between different types
const adapters = {
  // Convert InventoryItem to Product
  inventoryItemToProduct(item: import('../services/InventoryService').InventoryItem): Product {
    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      description: item.description || '',
      price: item.price,
      costPrice: item.cost,
      quantity: item.quantity,
      category: item.category,
      imageUrl: item.imageUrl,
      barcode: item.sku,
      location: item.location,
      supplier: item.supplier,
      minStockLevel: item.reorderPoint,
      isActive: true,
      attributes: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },
  
  // Convert Product to InventoryItem with default values for required properties
  productToInventoryItem(product: Product): Omit<import('../services/InventoryService').InventoryItem, 'id'> {
    return {
      name: product.name,
      sku: product.sku || '',
      description: product.description || '',
      price: product.price,
      cost: product.costPrice,
      quantity: product.quantity || 0,
      category: product.category || 'default',
      subcategory: '', // Use empty string since Product doesn't have subcategory
      reorderPoint: product.minStockLevel || 0,
      supplier: product.supplier || '',
      location: product.location || 'default',
      imageUrl: product.imageUrl
    };
  },
  
  // Convert service Supplier to domain Supplier
  serviceSupplierToDomainSupplier(supplier: import('../services/InventoryService').Supplier): Supplier {
    return {
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address || '',
      city: '',
      country: '',
      notes: supplier.notes,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
  
  // Convert domain Supplier to service Supplier
  domainSupplierToServiceSupplier(supplier: Supplier): import('../services/InventoryService').Supplier {
    return {
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      paymentTerms: '',
      notes: supplier.notes,
      productCategories: []
    };
  },
  
  // Create mock implementations for missing methods
  mockStockLevel(productId: string): Stock {
    return {
      id: `stock-${productId}`,
      productId,
      quantity: 0,
      location: 'default',
      lastUpdated: new Date().toISOString()
    };
  },
  
  createMockInventoryTransaction(data: Omit<InventoryTransaction, 'id'>): InventoryTransaction {
    return {
      id: `tx-${Date.now()}`,
      ...data
    };
  }
};

// Définition du type pour le contexte d'inventaire
interface InventoryContextType {
  // États
  products: Product[];
  suppliers: Supplier[];
  transactions: InventoryTransaction[];
  stockLevels: Stock[];
  isLoading: boolean;
  error: string | null;
  
  // Méthodes pour les produits
  getProducts: () => Promise<Product[]>;
  getProductById: (id: string) => Promise<Product | null>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<boolean>;
  
  // Méthodes pour les fournisseurs
  getSuppliers: () => Promise<Supplier[]>;
  getSupplierById: (id: string) => Promise<Supplier | null>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<Supplier>;
  deleteSupplier: (id: string) => Promise<boolean>;
  
  // Méthodes pour les transactions d'inventaire
  recordInventoryTransaction: (transaction: Omit<InventoryTransaction, 'id'>) => Promise<InventoryTransaction>;
  getInventoryTransactions: () => Promise<InventoryTransaction[]>;
  
  // Méthodes pour les niveaux de stock
  getStockLevels: () => Promise<Stock[]>;
  getStockByProductId: (productId: string) => Promise<Stock | null>;
  
  // Méthodes de gestion de l'inventaire
  checkLowStockItems: (threshold?: number) => Promise<Product[]>;
  calculateInventoryValue: () => Promise<number>;
  
  // Méthodes utilitaires
  refreshInventoryData: () => Promise<void>;
}

// Création du contexte avec des valeurs par défaut
const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Provider du contexte d'inventaire
export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [stockLevels, setStockLevels] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the InventoryService singleton directly instead of trying to instantiate it
  const inventoryService = InventoryService;
  
  // Charger les données d'inventaire au démarrage
  useEffect(() => {
    refreshInventoryData();
  }, []);
  
  // Récupérer toutes les données d'inventaire
  const refreshInventoryData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Charger les données en parallèle pour optimiser les performances
      const [productsList, suppliersList, transactionsList, stocksList] = await Promise.all([
        inventoryService.getProducts(),
        inventoryService.getSuppliers(),
        inventoryService.getInventoryTransactions(),
        inventoryService.getStockLevels()
      ]);
      
      // Convert each data type using appropriate adapters
      const convertedProducts = productsList.map(item => adapters.inventoryItemToProduct(item));
      const convertedSuppliers = suppliersList.map(supplier => 
        adapters.serviceSupplierToDomainSupplier(supplier)
      );
      
      // For transactions, we need to create a proper domain transaction from service transaction
      const convertedTransactions = transactionsList.map(transaction => {
        return {
          id: transaction.id,
          type: transaction.type,
          date: transaction.date,
          productId: transaction.items[0]?.productId || '',
          quantity: transaction.items[0]?.quantity || 0,
          unitPrice: transaction.items[0]?.unitPrice || 0,
          totalPrice: transaction.items[0]?.totalPrice || 0,
          reference: transaction.reference,
          notes: transaction.notes,
          createdBy: 'system',
          createdAt: transaction.date
        } as InventoryTransaction;
      });
      
      setProducts(convertedProducts);
      setSuppliers(convertedSuppliers);
      setTransactions(convertedTransactions);
      setStockLevels(stocksList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement des données d\'inventaire';
      setError(errorMessage);
      logger.error('InventoryContext - refreshInventoryData:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Méthodes pour les produits
  const getProducts = async () => {
    try {
      const productsList = await inventoryService.getProducts();
      // Convert InventoryItems to Products using the adapter
      const convertedProducts = productsList.map(item => adapters.inventoryItemToProduct(item));
      setProducts(convertedProducts);
      return convertedProducts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des produits';
      setError(errorMessage);
      logger.error('InventoryContext - getProducts:', errorMessage);
      throw err;
    }
  };
  
  const getProductById = async (id: string) => {
    try {
      const product = await inventoryService.getProductById(id);
      if (product) {
        return adapters.inventoryItemToProduct(product);
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erreur lors de la récupération du produit ${id}`;
      setError(errorMessage);
      logger.error('InventoryContext - getProductById:', errorMessage);
      throw err;
    }
  };
  
  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      // Convert the product to InventoryItem format
      const productAsInventoryItem = adapters.productToInventoryItem(product as Product);
      
      // Call the service method (no need to remove id since it's already omitted)
      const newInventoryItem = await inventoryService.addProduct(productAsInventoryItem);
      
      // Convert back to Product format
      const newProduct = adapters.inventoryItemToProduct(newInventoryItem);
      // Update state
      setProducts([...products, newProduct]);
      return newProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ajout du produit';
      setError(errorMessage);
      logger.error('InventoryContext - addProduct:', errorMessage);
      throw err;
    }
  };
  
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      // Convert product updates to InventoryItem format
      const inventoryItemUpdates = adapters.productToInventoryItem({...updates, id} as Product);
      // Call the service method
      const updatedInventoryItem = await inventoryService.updateProduct(id, inventoryItemUpdates);
      // Convert back to Product format
      const updatedProduct = adapters.inventoryItemToProduct(updatedInventoryItem);
      // Update state
      setProducts(products.map(p => p.id === id ? updatedProduct : p));
      return updatedProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erreur lors de la mise à jour du produit ${id}`;
      setError(errorMessage);
      logger.error('InventoryContext - updateProduct:', errorMessage);
      throw err;
    }
  };
  
  const deleteProduct = async (id: string) => {
    try {
      const success = await inventoryService.deleteProduct(id);
      if (success) {
        setProducts(products.filter(p => p.id !== id));
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erreur lors de la suppression du produit ${id}`;
      setError(errorMessage);
      logger.error('InventoryContext - deleteProduct:', errorMessage);
      throw err;
    }
  };
  
  // Méthodes pour les fournisseurs
  const getSuppliers = async () => {
    try {
      const serviceSuppliers = await inventoryService.getSuppliers();
      // Convert service suppliers to domain suppliers
      const domainSuppliers = serviceSuppliers.map(supplier => 
        adapters.serviceSupplierToDomainSupplier(supplier)
      );
      setSuppliers(domainSuppliers);
      return domainSuppliers;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des fournisseurs';
      setError(errorMessage);
      logger.error('InventoryContext - getSuppliers:', errorMessage);
      throw err;
    }
  };
  
  const getSupplierById = async (id: string) => {
    try {
      const serviceSupplier = await inventoryService.getSupplierById(id);
      if (!serviceSupplier) return null;
      
      // Convert service supplier to domain supplier
      return adapters.serviceSupplierToDomainSupplier(serviceSupplier);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erreur lors de la récupération du fournisseur ${id}`;
      setError(errorMessage);
      logger.error('InventoryContext - getSupplierById:', errorMessage);
      throw err;
    }
  };
  
  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    try {
      // Create a complete supplier with an ID for the adapter
      const fullSupplier = {
        ...supplier,
        id: `temp-${Date.now()}` // Temporary ID that will be replaced
      };
      
      // Convert from domain to service supplier format
      const serviceSupplier = adapters.domainSupplierToServiceSupplier(fullSupplier);
      
      // Call the service method
      const newServiceSupplier = await inventoryService.addSupplier(serviceSupplier);
      
      // Convert back to domain supplier format
      const newDomainSupplier = adapters.serviceSupplierToDomainSupplier(newServiceSupplier);
      
      // Update state
      setSuppliers([...suppliers, newDomainSupplier]);
      return newDomainSupplier;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ajout du fournisseur';
      setError(errorMessage);
      logger.error('InventoryContext - addSupplier:', errorMessage);
      throw err;
    }
  };
  
  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      // Convert the supplier updates to service format
      const existingSupplier = suppliers.find(s => s.id === id);
      
      if (!existingSupplier) {
        throw new Error(`Fournisseur avec l'ID ${id} introuvable`);
      }
      
      // Prepare service-compatible updates
      const serviceUpdates = adapters.domainSupplierToServiceSupplier({
        ...existingSupplier,
        ...updates
      });
      
      // Call the service method
      const updatedServiceSupplier = await inventoryService.updateSupplier(id, serviceUpdates);
      
      // Convert back to domain format
      const updatedDomainSupplier = adapters.serviceSupplierToDomainSupplier(updatedServiceSupplier);
      
      // Update state
      setSuppliers(suppliers.map(s => s.id === id ? updatedDomainSupplier : s));
      return updatedDomainSupplier;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erreur lors de la mise à jour du fournisseur ${id}`;
      setError(errorMessage);
      logger.error('InventoryContext - updateSupplier:', errorMessage);
      throw err;
    }
  };
  
  const deleteSupplier = async (id: string) => {
    try {
      const success = await inventoryService.deleteSupplier(id);
      if (success) {
        setSuppliers(suppliers.filter(s => s.id !== id));
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erreur lors de la suppression du fournisseur ${id}`;
      setError(errorMessage);
      logger.error('InventoryContext - deleteSupplier:', errorMessage);
      throw err;
    }
  };
  
  // Méthodes pour les transactions d'inventaire
  const recordInventoryTransaction = async (transaction: Omit<InventoryTransaction, 'id'>) => {
    try {
      // Convert from domain transaction to service transaction format
      const serviceTransaction = {
        id: `temp-${Date.now()}`, // Will be replaced by the service
        type: transaction.type,
        date: transaction.date,
        reference: transaction.reference || `TX-${Date.now()}`,
        items: [{
          productId: transaction.productId,
          quantity: transaction.quantity,
          unitPrice: transaction.unitPrice,
          totalPrice: transaction.totalPrice
        }],
        status: 'completed' as 'completed' | 'pending' | 'cancelled', // Forcer le typage explicite
        notes: transaction.notes,
        totalAmount: transaction.totalPrice
      };
      
      // Call the service method
      const newServiceTransaction = await inventoryService.recordInventoryTransaction(serviceTransaction);
      
      // Convert back to domain format
      const newDomainTransaction: InventoryTransaction = {
        id: newServiceTransaction.id,
        type: newServiceTransaction.type,
        date: newServiceTransaction.date,
        productId: newServiceTransaction.items[0]?.productId || '',
        quantity: newServiceTransaction.items[0]?.quantity || 0,
        unitPrice: newServiceTransaction.items[0]?.unitPrice || 0,
        totalPrice: newServiceTransaction.items[0]?.totalPrice || 0,
        reference: newServiceTransaction.reference,
        notes: newServiceTransaction.notes,
        createdBy: 'system',
        createdAt: newServiceTransaction.date
      };
      
      // Update state
      setTransactions([...transactions, newDomainTransaction]);
      
      // Mettre à jour les niveaux de stock après une transaction
      await refreshInventoryData();
      return newDomainTransaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement de la transaction';
      setError(errorMessage);
      logger.error('InventoryContext - recordInventoryTransaction:', errorMessage);
      throw err;
    }
  };
  
  const getInventoryTransactions = async () => {
    try {
      const serviceTransactions = await inventoryService.getInventoryTransactions();
      
      // Convert service transactions to domain transactions
      const domainTransactions = serviceTransactions.map(transaction => {
        return {
          id: transaction.id,
          type: transaction.type,
          date: transaction.date,
          productId: transaction.items[0]?.productId || '',
          quantity: transaction.items[0]?.quantity || 0,
          unitPrice: transaction.items[0]?.unitPrice || 0,
          totalPrice: transaction.items[0]?.totalPrice || 0,
          reference: transaction.reference,
          notes: transaction.notes,
          createdBy: 'system',
          createdAt: transaction.date
        } as InventoryTransaction;
      });
      
      setTransactions(domainTransactions);
      return domainTransactions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des transactions';
      setError(errorMessage);
      logger.error('InventoryContext - getInventoryTransactions:', errorMessage);
      throw err;
    }
  };
  
  // Méthodes pour les niveaux de stock
  const getStockLevels = async () => {
    try {
      const stocksList = await inventoryService.getStockLevels();
      setStockLevels(stocksList);
      return stocksList;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des niveaux de stock';
      setError(errorMessage);
      logger.error('InventoryContext - getStockLevels:', errorMessage);
      throw err;
    }
  };
  
  const getStockByProductId = async (productId: string) => {
    try {
      return await inventoryService.getStockByProductId(productId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erreur lors de la récupération du stock pour le produit ${productId}`;
      setError(errorMessage);
      logger.error('InventoryContext - getStockByProductId:', errorMessage);
      throw err;
    }
  };
  
  // Méthodes de gestion de l'inventaire
  const checkLowStockItems = async (threshold?: number) => {
    try {
      return await inventoryService.checkLowStockItems(threshold);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification des produits en rupture de stock';
      setError(errorMessage);
      logger.error('InventoryContext - checkLowStockItems:', errorMessage);
      throw err;
    }
  };
  
  const calculateInventoryValue = async () => {
    try {
      return await inventoryService.calculateInventoryValue();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du calcul de la valeur de l\'inventaire';
      setError(errorMessage);
      logger.error('InventoryContext - calculateInventoryValue:', errorMessage);
      throw err;
    }
  };
  
  // Valeur du contexte à exposer
  const value: InventoryContextType = {
    // États
    products,
    suppliers,
    transactions,
    stockLevels,
    isLoading,
    error,
    
    // Méthodes
    getProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    getSuppliers,
    getSupplierById,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    recordInventoryTransaction,
    getInventoryTransactions,
    getStockLevels,
    getStockByProductId,
    checkLowStockItems,
    calculateInventoryValue,
    refreshInventoryData
  };
  
  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'inventaire
export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory doit être utilisé dans un InventoryProvider');
  }
  return context;
};

export default InventoryContext;