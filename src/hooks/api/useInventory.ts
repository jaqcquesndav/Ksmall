import { useState, useCallback, useEffect } from 'react';
import InventoryApiService from '../../services/api/inventory/InventoryApiService';
import { Product, Category, Stock, StockMovement, Supplier } from '../../types/inventory';
import logger from '../../utils/logger';

/**
 * Options pour les requêtes d'inventaire
 */
interface InventoryQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  category?: string;
  status?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  supplier?: string;
}

/**
 * Fonction utilitaire pour formater une catégorie et garantir toutes les propriétés requises
 */
const formatCategory = (categoryData: any): Category => {
  return {
    id: categoryData.id,
    name: categoryData.name,
    description: categoryData.description || '',
    parentId: categoryData.parentId || null,
    imageUrl: categoryData.imageUrl || '',
    order: categoryData.order || 0,
    isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
    createdAt: categoryData.createdAt || new Date().toISOString(),
    updatedAt: categoryData.updatedAt || new Date().toISOString()
    // productsCount removed as it doesn't exist in the Category type
  };
};

/**
 * Hook pour gérer les fonctionnalités d'inventaire
 */
export function useInventory() {
  /**
   * Hook pour récupérer les produits
   */
  const useProducts = (options: InventoryQueryOptions = {}) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchProducts = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await InventoryApiService.getProducts({
          limit: options.limit,
          offset: options.page ? options.page * (options.limit || 10) : 0,
          category: options.category,
          search: options.search,
          sortBy: options.sortBy,
          sortDirection: options.sortDirection,
          inStock: options.inStock,
          minPrice: options.minPrice,
          maxPrice: options.maxPrice
        });
        // Add all required properties to match the Product interface
        const formattedProducts = data.map(product => ({
          ...product,
          isActive: true, // Required by Product interface
          createdAt: product.createdAt || new Date().toISOString(), 
          updatedAt: product.updatedAt || new Date().toISOString(),
          costPrice: product.costPrice || 0 // Ensure costPrice exists
        }));
        setProducts(formattedProducts);
        return formattedProducts;
      } catch (err) {
        logger.error('Erreur lors du chargement des produits', err);
        setError(err as Error);
        return [];
      } finally {
        setLoading(false);
      }
    }, [options]);
    
    useEffect(() => {
      fetchProducts();
    }, [fetchProducts]);
    
    return {
      products,
      loading,
      error,
      fetchProducts
    };
  };

  /**
   * Hook pour récupérer un produit spécifique
   */
  const useProduct = (id: string | null) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchProduct = useCallback(async () => {
      if (!id) return null;
      
      setLoading(true);
      setError(null);
      try {
        const data = await InventoryApiService.getProductById(id);
        // Make sure we handle cases where neither costPrice nor cost exists
        const costPrice = data.costPrice || 0;
        
        setProduct({
          ...data,
          isActive: true, // Required property
          costPrice,      // Explicit assignment
          createdAt: data.createdAt || new Date().toISOString(), 
          updatedAt: data.updatedAt || new Date().toISOString()
        });
        return {
          ...data,
          isActive: true, // Required by Product interface
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          costPrice: data.costPrice || 0 // Ensure costPrice exists
        };
      } catch (err) {
        logger.error(`Erreur lors du chargement du produit ${id}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, [id]);
    
    useEffect(() => {
      if (id) {
        fetchProduct();
      }
    }, [fetchProduct, id]);
    
    return {
      product,
      loading,
      error,
      fetchProduct
    };
  };

  /**
   * Hook pour créer un produit
   */
  const useCreateProduct = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const createProduct = useCallback(async (productData: Partial<Product>) => {
      setLoading(true);
      setError(null);
      try {
        // Conversion des données pour correspondre à la signature de la méthode InventoryApiService.createProduct
        const { id, createdAt, updatedAt, ...productDataWithoutId } = productData as any;
        
        const result = await InventoryApiService.createProduct(productDataWithoutId);
        return result;
      } catch (err) {
        logger.error('Erreur lors de la création du produit', err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      createProduct,
      loading,
      error
    };
  };

  /**
   * Hook pour mettre à jour un produit
   */
  const useUpdateProduct = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const updateProduct = useCallback(async (id: string, productData: Partial<Product>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await InventoryApiService.updateProduct(id, productData);
        return result;
      } catch (err) {
        logger.error(`Erreur lors de la mise à jour du produit ${id}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      updateProduct,
      loading,
      error
    };
  };

  /**
   * Hook pour supprimer un produit
   */
  const useDeleteProduct = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const deleteProduct = useCallback(async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await InventoryApiService.deleteProduct(id);
        return result;
      } catch (err) {
        logger.error(`Erreur lors de la suppression du produit ${id}`, err);
        setError(err as Error);
        return false;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      deleteProduct,
      loading,
      error
    };
  };

  /**
   * Hook pour récupérer les catégories
   */
  const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchCategories = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await InventoryApiService.getCategories();
        // Conversion possible si la structure des données est différente
        const categoriesFormatted = data.map(cat => formatCategory(cat));
        
        setCategories(categoriesFormatted);
        return categoriesFormatted;
      } catch (err) {
        logger.error('Erreur lors du chargement des catégories', err);
        setError(err as Error);
        return [];
      } finally {
        setLoading(false);
      }
    }, []);
    
    useEffect(() => {
      fetchCategories();
    }, [fetchCategories]);
    
    return {
      categories,
      loading,
      error,
      fetchCategories
    };
  };

  /**
   * Hook pour récupérer une catégorie spécifique
   */
  const useCategory = (id: string | null) => {
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchCategory = useCallback(async () => {
      if (!id) return null;
      
      setLoading(true);
      setError(null);
      try {
        // Cette méthode doit être implémentée dans InventoryApiService
        const categories = await InventoryApiService.getCategories();
        const foundCategory = categories.find(cat => cat.id === id);
        
        if (!foundCategory) {
          throw new Error(`Catégorie avec l'ID ${id} non trouvée`);
        }
        
        // Utilisation de la fonction formatCategory
        const categoryFormatted = formatCategory(foundCategory);
        
        setCategory(categoryFormatted);
        return categoryFormatted;
      } catch (err) {
        logger.error(`Erreur lors du chargement de la catégorie ${id}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, [id]);
    
    useEffect(() => {
      if (id) {
        fetchCategory();
      }
    }, [fetchCategory, id]);
    
    return {
      category,
      loading,
      error,
      fetchCategory
    };
  };

  /**
   * Hook pour créer une catégorie
   */
  const useCreateCategory = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const createCategory = useCallback(async (categoryData: Partial<Category>) => {
      setLoading(true);
      setError(null);
      try {
        // Conversion des données pour correspondre à la signature de la méthode InventoryApiService.createCategory
        const { id, productsCount, ...categoryDataWithoutId } = categoryData as any;
        
        const result = await InventoryApiService.createCategory(categoryDataWithoutId);
        
        // Conversion si nécessaire
        const categoryFormatted = formatCategory(result);
        
        return categoryFormatted;
      } catch (err) {
        logger.error('Erreur lors de la création de la catégorie', err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      createCategory,
      loading,
      error
    };
  };

  /**
   * Hook pour mettre à jour une catégorie
   */
  const useUpdateCategory = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const updateCategory = useCallback(async (id: string, categoryData: Partial<Category>) => {
      setLoading(true);
      setError(null);
      try {
        // Suppression des propriétés non modifiables
        const { productsCount, ...updateData } = categoryData as any;
        
        const result = await InventoryApiService.updateCategory(id, updateData);
        
        // Conversion si nécessaire
        const categoryFormatted = formatCategory(result);
        
        return categoryFormatted;
      } catch (err) {
        logger.error(`Erreur lors de la mise à jour de la catégorie ${id}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      updateCategory,
      loading,
      error
    };
  };

  /**
   * Hook pour supprimer une catégorie
   */
  const useDeleteCategory = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const deleteCategory = useCallback(async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await InventoryApiService.deleteCategory(id);
        return result;
      } catch (err) {
        logger.error(`Erreur lors de la suppression de la catégorie ${id}`, err);
        setError(err as Error);
        return false;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      deleteCategory,
      loading,
      error
    };
  };

  /**
   * Hook pour récupérer les stocks
   */
  const useStocks = (options: InventoryQueryOptions = {}) => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchStocks = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        // Adaptation nécessaire car InventoryApiService ne semble pas avoir de méthode getStocks
        // Obtenir les produits et transformer en stocks
        const products = await InventoryApiService.getProducts({
          category: options.category,
          search: options.search
        });
        
        const stocksData = products.map(product => ({
          id: `stock-${product.id}`,
          productId: product.id,
          productName: product.name,
          quantity: product.quantity,
          unit: product.unit,
          minimumStock: 0,
          reorderPoint: 0,
          value: product.quantity * (product.costPrice || 0), // Using costPrice instead of cost
          location: 'default',
          lastUpdated: product.updatedAt
        } as Stock));
        
        setStocks(stocksData);
        return stocksData;
      } catch (err) {
        logger.error('Erreur lors du chargement des stocks', err);
        setError(err as Error);
        return [];
      } finally {
        setLoading(false);
      }
    }, [options.category, options.search]);
    
    useEffect(() => {
      fetchStocks();
    }, [fetchStocks]);
    
    return {
      stocks,
      loading,
      error,
      fetchStocks
    };
  };

  /**
   * Hook pour récupérer un stock spécifique
   */
  const useStock = (productId: string | null) => {
    const [stock, setStock] = useState<Stock | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchStock = useCallback(async () => {
      if (!productId) return null;
      
      setLoading(true);
      setError(null);
      try {
        // Adaptation nécessaire car InventoryApiService ne semble pas avoir de méthode getStock
        const product = await InventoryApiService.getProductById(productId);
        
        const stockData: Stock = {
          id: `stock-${product.id}`,
          productId: product.id,
          quantity: product.quantity,
          location: 'default', // Required property
          lastUpdated: product.updatedAt
        };
        
        setStock(stockData);
        return stockData;
      } catch (err) {
        logger.error(`Erreur lors du chargement du stock pour le produit ${productId}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, [productId]);
    
    useEffect(() => {
      if (productId) {
        fetchStock();
      }
    }, [fetchStock, productId]);
    
    return {
      stock,
      loading,
      error,
      fetchStock
    };
  };

  /**
   * Hook pour mettre à jour un stock
   */
  const useUpdateStock = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const updateStock = useCallback(async (productId: string, quantity: number, reason: string) => {
      setLoading(true);
      setError(null);
      try {
        // Création d'une opération d'ajustement d'inventaire
        const result = await InventoryApiService.createOperation({
          type: 'adjustment',
          reference: `ADJ-${Date.now()}`,
          date: new Date().toISOString(),
          description: reason,
          items: [{
            id: `ITEM-${Date.now()}`,
            productId,
            productName: '', // Sera rempli par le backend
            quantity,
            unitPrice: 0, // Sera rempli par le backend
            amount: 0, // Sera calculé par le backend
            reason
          }],
          status: 'confirmed',
          totalAmount: 0, // Sera calculé par le backend
          createdBy: 'system' // Add required property
        });
        
        // Récupérer le stock mis à jour
        const product = await InventoryApiService.getProductById(productId);
        
        const stockData: Stock = {
          id: `stock-${product.id}`,
          productId: product.id,
          quantity: product.quantity,
          location: 'default', // Required property
          lastUpdated: product.updatedAt
        };
        
        return stockData;
      } catch (err) {
        logger.error(`Erreur lors de la mise à jour du stock pour le produit ${productId}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      updateStock,
      loading,
      error
    };
  };

  /**
   * Hook pour récupérer les mouvements de stock
   */
  const useStockMovements = (options: InventoryQueryOptions & { productId?: string } = {}) => {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchStockMovements = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        if (!options.productId) {
          throw new Error('ID de produit requis pour les mouvements de stock');
        }
        
        const movementsData = await InventoryApiService.getProductMovements(
          options.productId,
          undefined, // startDate
          undefined  // endDate
        );
        
        // Conversion si nécessaire
        const formattedMovements = movementsData.map(move => ({
          id: move.id || `MOVE-${Date.now()}-${Math.random()}`,
          productId: options.productId as string,
          type: move.type,
          quantity: move.quantity,
          date: move.date,
          reference: move.reference,
          reason: move.reason,
          performedBy: move.performedBy || 'unknown',
          location: move.location || 'default',
          createdAt: move.createdAt || new Date().toISOString()
        } as StockMovement));
        
        setMovements(formattedMovements);
        return formattedMovements;
      } catch (err) {
        logger.error('Erreur lors du chargement des mouvements de stock', err);
        setError(err as Error);
        return [];
      } finally {
        setLoading(false);
      }
    }, [options.productId]);
    
    useEffect(() => {
      if (options.productId) {
        fetchStockMovements();
      }
    }, [fetchStockMovements, options.productId]);
    
    return {
      movements,
      loading,
      error,
      fetchStockMovements
    };
  };

  /**
   * Hook pour récupérer les fournisseurs
   */
  const useSuppliers = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchSuppliers = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        // Cette méthode devrait être ajoutée à InventoryApiService
        // Pour l'instant, simulons un retour vide
        logger.info('La méthode getSuppliers n\'est pas encore implémentée dans InventoryApiService');
        setSuppliers([]);
        return [];
      } catch (err) {
        logger.error('Erreur lors du chargement des fournisseurs', err);
        setError(err as Error);
        return [];
      } finally {
        setLoading(false);
      }
    }, []);
    
    useEffect(() => {
      fetchSuppliers();
    }, [fetchSuppliers]);
    
    return {
      suppliers,
      loading,
      error,
      fetchSuppliers
    };
  };

  /**
   * Hook pour récupérer un fournisseur spécifique
   */
  const useSupplier = (id: string | null) => {
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchSupplier = useCallback(async () => {
      if (!id) return null;
      
      setLoading(true);
      setError(null);
      try {
        // Cette méthode devrait être ajoutée à InventoryApiService
        // Pour l'instant, simulons une erreur
        logger.info(`La méthode getSupplier n'est pas encore implémentée dans InventoryApiService`);
        throw new Error(`Fournisseur avec l'ID ${id} non trouvé`);
      } catch (err) {
        logger.error(`Erreur lors du chargement du fournisseur ${id}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, [id]);
    
    useEffect(() => {
      if (id) {
        fetchSupplier();
      }
    }, [fetchSupplier, id]);
    
    return {
      supplier,
      loading,
      error,
      fetchSupplier
    };
  };

  /**
   * Hook pour créer un fournisseur
   */
  const useCreateSupplier = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const createSupplier = useCallback(async (supplierData: Partial<Supplier>) => {
      setLoading(true);
      setError(null);
      try {
        // Cette méthode devrait être ajoutée à InventoryApiService
        // Pour l'instant, simulons une erreur
        logger.info('La méthode createSupplier n\'est pas encore implémentée dans InventoryApiService');
        throw new Error('Création de fournisseur non implémentée');
      } catch (err) {
        logger.error('Erreur lors de la création du fournisseur', err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      createSupplier,
      loading,
      error
    };
  };

  /**
   * Hook pour mettre à jour un fournisseur
   */
  const useUpdateSupplier = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const updateSupplier = useCallback(async (id: string, supplierData: Partial<Supplier>) => {
      setLoading(true);
      setError(null);
      try {
        // Cette méthode devrait être ajoutée à InventoryApiService
        // Pour l'instant, simulons une erreur
        logger.info('La méthode updateSupplier n\'est pas encore implémentée dans InventoryApiService');
        throw new Error(`Mise à jour du fournisseur ${id} non implémentée`);
      } catch (err) {
        logger.error(`Erreur lors de la mise à jour du fournisseur ${id}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      updateSupplier,
      loading,
      error
    };
  };

  /**
   * Hook pour alertes de stock bas
   */
  const useLowStockAlerts = () => {
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchLowStockAlerts = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        // Cette fonctionnalité n'est pas directement disponible dans InventoryApiService
        // Récupérons tous les produits et filtrons côté client
        const allProducts = await InventoryApiService.getProducts({ inStock: true });
        
        // Simulation d'un seuil de stock bas
        const lowStockThreshold = 10; // À ajuster selon les besoins
        
        // Ensure the products have all required properties
        const formattedLowStock = allProducts
          .filter(product => product.quantity <= lowStockThreshold)
          .map(product => ({
            ...product,
            isActive: true,
            createdAt: product.createdAt || new Date().toISOString(),
            updatedAt: product.updatedAt || new Date().toISOString(),
            costPrice: product.costPrice || 0
          }));
        
        setLowStockProducts(formattedLowStock);
        return formattedLowStock;
      } catch (err) {
        logger.error('Erreur lors du chargement des alertes de stock bas', err);
        setError(err as Error);
        return [];
      } finally {
        setLoading(false);
      }
    }, []);
    
    useEffect(() => {
      fetchLowStockAlerts();
    }, [fetchLowStockAlerts]);
    
    return {
      lowStockProducts,
      loading,
      error,
      fetchLowStockAlerts
    };
  };

  /**
   * Hook pour analyser la rotation des stocks
   */
  const useStockTurnover = (
    options: { startDate?: string; endDate?: string; productId?: string } = {}
  ) => {
    const [turnoverData, setTurnoverData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchStockTurnover = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        // Cette fonctionnalité n'est pas directement disponible dans InventoryApiService
        // Pour l'instant, renvoyer des données simulées
        logger.info('La fonctionnalité d\'analyse de rotation des stocks n\'est pas encore implémentée');
        
        const simulatedData = {
          turnoverRate: 4.2,
          averageInventory: 15000,
          totalSales: 63000,
          period: {
            start: options.startDate || '2025-01-01',
            end: options.endDate || '2025-04-25'
          },
          productId: options.productId,
          breakdown: [
            { month: 'Janvier', turnover: 3.8 },
            { month: 'Février', turnover: 4.1 },
            { month: 'Mars', turnover: 4.5 },
            { month: 'Avril', turnover: 4.4 }
          ]
        };
        
        setTurnoverData(simulatedData);
        return simulatedData;
      } catch (err) {
        logger.error('Erreur lors de l\'analyse de la rotation des stocks', err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, [options.startDate, options.endDate, options.productId]);
    
    useEffect(() => {
      fetchStockTurnover();
    }, [fetchStockTurnover]);
    
    return {
      turnoverData,
      loading,
      error,
      fetchStockTurnover
    };
  };

  /**
   * Hook pour prévision de stock
   */
  const useStockForecasting = (
    productId: string | null,
    options: { periods?: number; method?: 'moving_average' | 'exponential' | 'regression' } = {}
  ) => {
    const [forecastData, setForecastData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchStockForecast = useCallback(async () => {
      if (!productId) return null;
      
      setLoading(true);
      setError(null);
      try {
        // Cette fonctionnalité n'est pas directement disponible dans InventoryApiService
        // Pour l'instant, renvoyer des données simulées
        logger.info('La fonctionnalité de prévision de stock n\'est pas encore implémentée');
        
        const simulatedData = {
          productId,
          method: options.method || 'moving_average',
          periods: options.periods || 3,
          currentStock: 50,
          forecast: [
            { period: 'Mai 2025', predicted: 42 },
            { period: 'Juin 2025', predicted: 38 },
            { period: 'Juillet 2025', predicted: 35 }
          ],
          confidence: 0.85,
          recommendedOrder: 15
        };
        
        setForecastData(simulatedData);
        return simulatedData;
      } catch (err) {
        logger.error(`Erreur lors de la prévision de stock pour le produit ${productId}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, [productId, options.periods, options.method]);
    
    useEffect(() => {
      if (productId) {
        fetchStockForecast();
      }
    }, [fetchStockForecast, productId]);
    
    return {
      forecastData,
      loading,
      error,
      fetchStockForecast
    };
  };

  return {
    useProducts,
    useProduct,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useCategories,
    useCategory,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    useStocks,
    useStock,
    useUpdateStock,
    useStockMovements,
    useSuppliers,
    useSupplier,
    useCreateSupplier,
    useUpdateSupplier,
    useLowStockAlerts,
    useStockTurnover,
    useStockForecasting
  };
}