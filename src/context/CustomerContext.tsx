import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/API';
import { Customer } from '../types/Customer';
import { useNotification } from '../hooks/useNotification';
import { useDatabase } from './DatabaseContext';

interface CustomerContextType {
  customers: Customer[];
  isLoading: boolean;
  error: Error | null;
  refreshCustomers: () => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  createCustomer: (customerData: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: string, customerData: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<boolean>;
  importCustomers: (fileUri: string, options?: { headerRow?: boolean; mapping?: Record<string, string> }) => Promise<{ success: boolean; imported: number; errors: number; log: string[] }>;
  exportCustomers: (format: 'csv' | 'xlsx' | 'pdf', options?: { ids?: string[]; includeInactive?: boolean }) => Promise<string>;
  analyzeCustomerPurchaseBehavior: (customerId: string, options?: { startDate?: string; endDate?: string }) => Promise<any>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { showNotification } = useNotification();
  const { isOfflineMode } = useDatabase();

  // Charger la liste des clients au démarrage
  useEffect(() => {
    refreshCustomers();
  }, []);

  // Rafraîchir la liste des clients
  const refreshCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await api.customers.getCustomers();
      setCustomers(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      if (!isOfflineMode) {
        showNotification({
          type: 'error',
          message: 'Impossible de charger les clients',
          description: err instanceof Error ? err.message : 'Une erreur est survenue'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer un client par son ID
  const getCustomerById = (id: string): Customer | undefined => {
    return customers.find(customer => customer.id === id);
  };

  // Créer un nouveau client
  const createCustomer = async (customerData: Partial<Customer>): Promise<Customer> => {
    try {
      const newCustomer = await api.customers.createCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer]);
      showNotification({
        type: 'success',
        message: 'Client créé',
        description: `Le client ${newCustomer.name} a été créé avec succès`
      });
      return newCustomer;
    } catch (err) {
      console.error('Erreur lors de la création du client:', err);
      showNotification({
        type: 'error',
        message: 'Erreur lors de la création du client',
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
      throw err;
    }
  };

  // Mettre à jour un client
  const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
    try {
      const updatedCustomer = await api.customers.updateCustomer(id, customerData);
      setCustomers(prev => 
        prev.map(customer => customer.id === id ? updatedCustomer : customer)
      );
      showNotification({
        type: 'success',
        message: 'Client mis à jour',
        description: `Le client ${updatedCustomer.name} a été mis à jour avec succès`
      });
      return updatedCustomer;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du client:', err);
      showNotification({
        type: 'error',
        message: 'Erreur lors de la mise à jour du client',
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
      throw err;
    }
  };

  // Supprimer un client
  const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
      const success = await api.customers.deleteCustomer(id);
      if (success) {
        setCustomers(prev => prev.filter(customer => customer.id !== id));
        showNotification({
          type: 'success',
          message: 'Client supprimé',
          description: 'Le client a été supprimé avec succès'
        });
      }
      return success;
    } catch (err) {
      console.error('Erreur lors de la suppression du client:', err);
      showNotification({
        type: 'error',
        message: 'Erreur lors de la suppression du client',
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
      throw err;
    }
  };

  // Importer des clients depuis un fichier
  const importCustomers = async (
    fileUri: string, 
    options: { headerRow?: boolean; mapping?: Record<string, string> } = {}
  ): Promise<{ success: boolean; imported: number; errors: number; log: string[] }> => {
    try {
      const result = await api.customers.importCustomers(fileUri, options);
      if (result.success) {
        await refreshCustomers();
        showNotification({
          type: 'success',
          message: 'Importation réussie',
          description: `${result.imported} clients importés avec ${result.errors} erreurs`
        });
      }
      return result;
    } catch (err) {
      console.error('Erreur lors de l\'importation des clients:', err);
      showNotification({
        type: 'error',
        message: 'Erreur lors de l\'importation des clients',
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
      throw err;
    }
  };

  // Exporter des clients vers un fichier
  const exportCustomers = async (
    format: 'csv' | 'xlsx' | 'pdf', 
    options: { ids?: string[]; includeInactive?: boolean } = {}
  ): Promise<string> => {
    try {
      const result = await api.customers.exportCustomers(format, options);
      showNotification({
        type: 'success',
        message: 'Exportation réussie',
        description: `Les clients ont été exportés au format ${format.toUpperCase()}`
      });
      return result.fileUrl;
    } catch (err) {
      console.error('Erreur lors de l\'exportation des clients:', err);
      showNotification({
        type: 'error',
        message: 'Erreur lors de l\'exportation des clients',
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
      throw err;
    }
  };

  // Analyser le comportement d'achat d'un client
  const analyzeCustomerPurchaseBehavior = async (
    customerId: string, 
    options: { startDate?: string; endDate?: string } = {}
  ): Promise<any> => {
    try {
      return await api.customers.analyzeCustomerBehavior(customerId, options);
    } catch (err) {
      console.error('Erreur lors de l\'analyse du comportement client:', err);
      showNotification({
        type: 'error',
        message: 'Erreur lors de l\'analyse du client',
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
      throw err;
    }
  };

  // Valeur du contexte
  const value: CustomerContextType = {
    customers,
    isLoading,
    error,
    refreshCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    importCustomers,
    exportCustomers,
    analyzeCustomerPurchaseBehavior
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

// Hook pour utiliser le contexte client
export const useCustomer = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};