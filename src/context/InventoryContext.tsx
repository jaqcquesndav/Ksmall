import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import InventoryService from '../services/InventoryService';
import DatabaseService from '../services/DatabaseService';
import { 
  Product, 
  Supplier, 
  Stock, 
  InventoryTransaction, 
  ServiceInventoryTransaction,
  ServiceProduct,
  ServiceSupplier
} from '../types/inventory';
import logger from '../utils/logger';
import {
  serviceProductToDomainProduct,
  domainProductToServiceProduct,
  serviceSupplierToDomainSupplier,
  domainSupplierToServiceSupplier,
  serviceTransactionToDomainTransaction,
  domainTransactionToServiceTransaction,
  createMockStockLevel
} from '../utils/adapters/inventoryAdapters';

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
  
  // Use the InventoryService singleton directly
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
      const convertedProducts = productsList.map(item => 
        serviceProductToDomainProduct(item as ServiceProduct));
      
      const convertedSuppliers = suppliersList.map(supplier => 
        serviceSupplierToDomainSupplier(supplier as ServiceSupplier)
      );
      
      // Convert transactions using the adapter
      const convertedTransactions = transactionsList.map(transaction => 
        serviceTransactionToDomainTransaction(transaction as ServiceInventoryTransaction)
      );
      
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
      // Convert using adapter
      const convertedProducts = productsList.map(item => 
        serviceProductToDomainProduct(item as ServiceProduct)
      );
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
        return serviceProductToDomainProduct(product as ServiceProduct);
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
      // Convert the product to service format using adapter
      const productAsServiceProduct = domainProductToServiceProduct(product as Product);
      
      // Call the service method
      const newServiceProduct = await inventoryService.addProduct(productAsServiceProduct);
      
      // Convert back to domain format
      const newProduct = serviceProductToDomainProduct(newServiceProduct);
      
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
      // Convert product updates to service format using adapter
      const serviceUpdates = domainProductToServiceProduct({...updates, id} as Product);
      
      // Call the service method
      const updatedServiceProduct = await inventoryService.updateProduct(id, serviceUpdates);
      
      // Convert back to domain format
      const updatedProduct = serviceProductToDomainProduct(updatedServiceProduct);
      
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
      // Convert service suppliers to domain suppliers using adapter
      const domainSuppliers = serviceSuppliers.map(supplier => 
        serviceSupplierToDomainSupplier(supplier as ServiceSupplier)
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
      
      // Convert service supplier to domain supplier using adapter
      return serviceSupplierToDomainSupplier(serviceSupplier as ServiceSupplier);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erreur lors de la récupération du fournisseur ${id}`;
      setError(errorMessage);
      logger.error('InventoryContext - getSupplierById:', errorMessage);
      throw err;
    }
  };
  
  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    try {
      // Create a complete supplier with a temporary ID for the adapter
      const fullSupplier = {
        ...supplier,
        id: `temp-${Date.now()}` // Temporary ID that will be replaced
      };
      
      // Convert from domain to service supplier format using adapter
      const serviceSupplier = domainSupplierToServiceSupplier(fullSupplier);
      
      // Call the service method
      const newServiceSupplier = await inventoryService.addSupplier(serviceSupplier);
      
      // Convert back to domain supplier format using adapter
      const newDomainSupplier = serviceSupplierToDomainSupplier(newServiceSupplier as ServiceSupplier);
      
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
      // Find existing supplier
      const existingSupplier = suppliers.find(s => s.id === id);
      
      if (!existingSupplier) {
        throw new Error(`Fournisseur avec l'ID ${id} introuvable`);
      }
      
      // Prepare service-compatible updates using adapter
      const serviceUpdates = domainSupplierToServiceSupplier({
        ...existingSupplier,
        ...updates
      });
      
      // Call the service method
      const updatedServiceSupplier = await inventoryService.updateSupplier(id, serviceUpdates);
      
      // Convert back to domain format using adapter
      const updatedDomainSupplier = serviceSupplierToDomainSupplier(updatedServiceSupplier as ServiceSupplier);
      
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
      // Convert from domain transaction to service transaction format using adapter
      const serviceTransaction = domainTransactionToServiceTransaction(transaction);
      
      // Call the service method
      const newServiceTransaction = await inventoryService.recordInventoryTransaction(
        serviceTransaction as ServiceInventoryTransaction
      );
      
      // Convert back to domain format using adapter
      const newDomainTransaction = serviceTransactionToDomainTransaction(
        newServiceTransaction as ServiceInventoryTransaction
      );
      
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
      
      // Convert service transactions to domain transactions using adapter
      const domainTransactions = serviceTransactions.map(transaction => 
        serviceTransactionToDomainTransaction(transaction as ServiceInventoryTransaction)
      );
      
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
      const serviceProducts = await inventoryService.checkLowStockItems(threshold);
      // Convert products to domain format
      return serviceProducts.map(product => serviceProductToDomainProduct(product as ServiceProduct));
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