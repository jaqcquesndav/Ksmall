import { useApi } from './useApi';
import API from '../../services/API';
import { Product, Category, Stock, StockMovement, Supplier } from '../../types/inventory';

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
 * Hook pour gérer les fonctionnalités d'inventaire
 */
export function useInventory() {
  /**
   * Hook pour récupérer les produits
   */
  const useProducts = (options: InventoryQueryOptions = {}) => {
    return useApi<Product[]>(
      () => API.inventory.getProducts(options),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: `products-${JSON.stringify(options)}`,
          ttl: 5 * 60 * 1000, // 5 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer un produit spécifique
   */
  const useProduct = (id: string | null) => {
    return useApi<Product>(
      () => id ? API.inventory.getProduct(id) : Promise.reject('ID requis'),
      {
        autoFetch: !!id,
        cache: {
          key: `product-${id}`,
          ttl: 5 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour créer un produit
   */
  const useCreateProduct = () => {
    return useApi<Product>(
      (productData: Partial<Product>) => API.inventory.createProduct(productData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour mettre à jour un produit
   */
  const useUpdateProduct = () => {
    return useApi<Product>(
      (id: string, productData: Partial<Product>) => 
        API.inventory.updateProduct(id, productData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour supprimer un produit
   */
  const useDeleteProduct = () => {
    return useApi<boolean>(
      (id: string) => API.inventory.deleteProduct(id),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les catégories
   */
  const useCategories = () => {
    return useApi<Category[]>(
      () => API.inventory.getCategories(),
      {
        autoFetch: true,
        cache: {
          key: 'categories',
          ttl: 30 * 60 * 1000, // 30 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer une catégorie spécifique
   */
  const useCategory = (id: string | null) => {
    return useApi<Category>(
      () => id ? API.inventory.getCategory(id) : Promise.reject('ID requis'),
      {
        autoFetch: !!id,
        cache: {
          key: `category-${id}`,
          ttl: 30 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour créer une catégorie
   */
  const useCreateCategory = () => {
    return useApi<Category>(
      (categoryData: Partial<Category>) => API.inventory.createCategory(categoryData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour mettre à jour une catégorie
   */
  const useUpdateCategory = () => {
    return useApi<Category>(
      (id: string, categoryData: Partial<Category>) => 
        API.inventory.updateCategory(id, categoryData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour supprimer une catégorie
   */
  const useDeleteCategory = () => {
    return useApi<boolean>(
      (id: string) => API.inventory.deleteCategory(id),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les stocks
   */
  const useStocks = (options: InventoryQueryOptions = {}) => {
    return useApi<Stock[]>(
      () => API.inventory.getStocks(options),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: `stocks-${JSON.stringify(options)}`,
          ttl: 5 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer un stock spécifique
   */
  const useStock = (productId: string | null) => {
    return useApi<Stock>(
      () => productId ? API.inventory.getStock(productId) : Promise.reject('ID produit requis'),
      {
        autoFetch: !!productId,
        fetchOnFocus: true,
        cache: {
          key: `stock-${productId}`,
          ttl: 5 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour mettre à jour un stock
   */
  const useUpdateStock = () => {
    return useApi<Stock>(
      (productId: string, quantity: number, reason: string) => 
        API.inventory.updateStock(productId, quantity, reason),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les mouvements de stock
   */
  const useStockMovements = (options: InventoryQueryOptions & { productId?: string } = {}) => {
    return useApi<StockMovement[]>(
      () => API.inventory.getStockMovements(options),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: `stock-movements-${JSON.stringify(options)}`,
          ttl: 5 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les fournisseurs
   */
  const useSuppliers = () => {
    return useApi<Supplier[]>(
      () => API.inventory.getSuppliers(),
      {
        autoFetch: true,
        cache: {
          key: 'suppliers',
          ttl: 30 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer un fournisseur spécifique
   */
  const useSupplier = (id: string | null) => {
    return useApi<Supplier>(
      () => id ? API.inventory.getSupplier(id) : Promise.reject('ID requis'),
      {
        autoFetch: !!id,
        cache: {
          key: `supplier-${id}`,
          ttl: 30 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour créer un fournisseur
   */
  const useCreateSupplier = () => {
    return useApi<Supplier>(
      (supplierData: Partial<Supplier>) => API.inventory.createSupplier(supplierData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour mettre à jour un fournisseur
   */
  const useUpdateSupplier = () => {
    return useApi<Supplier>(
      (id: string, supplierData: Partial<Supplier>) => 
        API.inventory.updateSupplier(id, supplierData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour alertes de stock bas
   */
  const useLowStockAlerts = () => {
    return useApi<Product[]>(
      () => API.inventory.getLowStockAlerts(),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: 'low-stock-alerts',
          ttl: 5 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour analyser la rotation des stocks
   */
  const useStockTurnover = (
    options: { startDate?: string; endDate?: string; productId?: string } = {}
  ) => {
    return useApi<any>(
      () => API.inventory.getStockTurnover(options),
      {
        autoFetch: true,
        cache: {
          key: `stock-turnover-${JSON.stringify(options)}`,
          ttl: 60 * 60 * 1000, // 1 heure
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour prévision de stock
   */
  const useStockForecasting = (
    productId: string | null,
    options: { periods?: number; method?: 'moving_average' | 'exponential' | 'regression' } = {}
  ) => {
    return useApi<any>(
      () => productId 
        ? API.inventory.getStockForecast(productId, options)
        : Promise.reject('ID produit requis'),
      {
        autoFetch: !!productId,
        cache: {
          key: `stock-forecast-${productId}-${JSON.stringify(options)}`,
          ttl: 60 * 60 * 1000, // 1 heure
          loadFromCacheFirst: true
        }
      }
    );
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