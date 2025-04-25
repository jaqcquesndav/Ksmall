import { useCallback } from 'react';
import { useApi } from './useApi';
import API from '../../services/API';

/**
 * Type représentant un client
 */
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  type: 'individual' | 'company';
  status: 'active' | 'inactive' | 'blocked';
  taxId?: string;
  registrationNumber?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  contactPerson?: {
    name: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  paymentTerms?: {
    days: number;
    discountDays?: number;
    discountPercent?: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Type représentant un fournisseur
 */
export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'blocked';
  taxId?: string;
  registrationNumber?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  contactPerson?: {
    name: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  paymentTerms?: {
    days: number;
    discountDays?: number;
    discountPercent?: number;
  };
  products?: Array<{
    id: string;
    name: string;
    price: number;
    leadTime?: number;
    minOrderQuantity?: number;
  }>;
  performanceRating?: number;
  metadata?: Record<string, any>;
}

/**
 * Type représentant une facture client
 */
export interface CustomerInvoice {
  id: string;
  number: string;
  customerId: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  amountPaid: number;
  tax?: number;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    tax?: number;
    total: number;
  }>;
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

/**
 * Options pour les requêtes de clients
 */
interface CustomersQueryOptions {
  search?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  tags?: string[];
}

/**
 * Hook pour gérer les fonctionnalités de gestion des clients et fournisseurs
 */
export function useCustomers() {
  /**
   * Hook pour récupérer les clients
   */
  const useAllCustomers = (options: CustomersQueryOptions = {}) => {
    return useApi<Customer[]>(
      () => API.customers.getCustomers(options),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: `customers-${JSON.stringify(options)}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer un client spécifique
   */
  const useCustomer = (customerId: string | null) => {
    return useApi<Customer>(
      () => customerId ? API.customers.getCustomer(customerId) : Promise.reject('ID client requis'),
      {
        autoFetch: !!customerId,
        cache: {
          key: `customer-${customerId}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour créer un client
   */
  const useCreateCustomer = () => {
    return useApi<Customer>(
      (customerData: Partial<Customer>) => API.customers.createCustomer(customerData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour mettre à jour un client
   */
  const useUpdateCustomer = () => {
    return useApi<Customer>(
      (customerId: string, customerData: Partial<Customer>) => 
        API.customers.updateCustomer(customerId, customerData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour supprimer un client
   */
  const useDeleteCustomer = () => {
    return useApi<boolean>(
      (customerId: string) => API.customers.deleteCustomer(customerId),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les factures d'un client
   */
  const useCustomerInvoices = (customerId: string | null) => {
    return useApi<CustomerInvoice[]>(
      () => customerId ? API.customers.getCustomerInvoices(customerId) : Promise.reject('ID client requis'),
      {
        autoFetch: !!customerId,
        cache: {
          key: `customer-invoices-${customerId}`,
          ttl: 5 * 60 * 1000, // 5 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour créer une facture client
   */
  const useCreateCustomerInvoice = () => {
    return useApi<CustomerInvoice>(
      (invoiceData: Partial<CustomerInvoice>) => API.customers.createInvoice(invoiceData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les fournisseurs
   */
  const useAllSuppliers = (options: CustomersQueryOptions = {}) => {
    return useApi<Supplier[]>(
      () => API.suppliers.getSuppliers(options),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: `suppliers-${JSON.stringify(options)}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer un fournisseur spécifique
   */
  const useSupplier = (supplierId: string | null) => {
    return useApi<Supplier>(
      () => supplierId ? API.suppliers.getSupplier(supplierId) : Promise.reject('ID fournisseur requis'),
      {
        autoFetch: !!supplierId,
        cache: {
          key: `supplier-${supplierId}`,
          ttl: 10 * 60 * 1000, // 10 minutes
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
      (supplierData: Partial<Supplier>) => API.suppliers.createSupplier(supplierData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour mettre à jour un fournisseur
   */
  const useUpdateSupplier = () => {
    return useApi<Supplier>(
      (supplierId: string, supplierData: Partial<Supplier>) => 
        API.suppliers.updateSupplier(supplierId, supplierData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour supprimer un fournisseur
   */
  const useDeleteSupplier = () => {
    return useApi<boolean>(
      (supplierId: string) => API.suppliers.deleteSupplier(supplierId),
      { autoFetch: false }
    );
  };

  /**
   * Fonction pour importer des clients depuis un fichier CSV/Excel
   */
  const importCustomers = useCallback(
    async (fileUri: string, options: { headerRow?: boolean; mapping?: Record<string, string> } = {}): Promise<{ success: boolean; imported: number; errors: number; log: string[] }> => {
      try {
        return await API.customers.importCustomers(fileUri, options);
      } catch (error) {
        console.error('Erreur lors de l\'importation des clients:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Fonction pour exporter des clients vers un fichier
   */
  const exportCustomers = useCallback(
    async (format: 'csv' | 'xlsx' | 'pdf', options: { ids?: string[]; includeInactive?: boolean } = {}): Promise<string> => {
      try {
        const result = await API.customers.exportCustomers(format, options);
        return result.fileUrl;
      } catch (error) {
        console.error('Erreur lors de l\'exportation des clients:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Fonction pour analyser le comportement d'achat des clients
   */
  const analyzeCustomerPurchaseBehavior = useCallback(
    async (customerId: string, options: { startDate?: string; endDate?: string } = {}): Promise<any> => {
      try {
        return await API.customers.analyzeCustomerBehavior(customerId, options);
      } catch (error) {
        console.error('Erreur lors de l\'analyse du comportement client:', error);
        throw error;
      }
    },
    []
  );

  return {
    // Customer hooks
    useAllCustomers,
    useCustomer,
    useCreateCustomer,
    useUpdateCustomer,
    useDeleteCustomer,
    useCustomerInvoices,
    useCreateCustomerInvoice,
    
    // Supplier hooks
    useAllSuppliers,
    useSupplier,
    useCreateSupplier,
    useUpdateSupplier,
    useDeleteSupplier,
    
    // Helper functions
    importCustomers,
    exportCustomers,
    analyzeCustomerPurchaseBehavior
  };
}