import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/API';
import { Supplier } from '../types/Supplier';
import { useNotification } from '../hooks/useNotification';
import { useDatabase } from './DatabaseContext';

interface SupplierContextType {
  suppliers: Supplier[];
  isLoading: boolean;
  error: Error | null;
  refreshSuppliers: () => Promise<void>;
  getSupplierById: (id: string) => Supplier | undefined;
  createSupplier: (supplierData: Partial<Supplier>) => Promise<Supplier>;
  updateSupplier: (id: string, supplierData: Partial<Supplier>) => Promise<Supplier>;
  deleteSupplier: (id: string) => Promise<boolean>;
  importSuppliers: (fileUri: string, options?: { headerRow?: boolean; mapping?: Record<string, string> }) => Promise<{ success: boolean; imported: number; errors: number; log: string[] }>;
  exportSuppliers: (format: 'csv' | 'xlsx' | 'pdf', options?: { ids?: string[]; includeInactive?: boolean }) => Promise<string>;
  analyzeSupplierPerformance: (supplierId: string, options?: { startDate?: string; endDate?: string }) => Promise<any>;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const SupplierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { showNotification } = useNotification();
  const { isOfflineMode } = useDatabase();

  // Charger la liste des fournisseurs au démarrage
  useEffect(() => {
    refreshSuppliers();
  }, []);

  // Rafraîchir la liste des fournisseurs
  const refreshSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await api.suppliers.getSuppliers();
      setSuppliers(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des fournisseurs:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      if (!isOfflineMode) {
        showNotification({
          type: 'error',
          message: 'Impossible de charger les fournisseurs',
          description: err instanceof Error ? err.message : 'Une erreur est survenue'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer un fournisseur par son ID
  const getSupplierById = (id: string): Supplier | undefined => {
    return suppliers.find(supplier => supplier.id === id);
  };

  // Créer un nouveau fournisseur
  const createSupplier = async (supplierData: Partial<Supplier>): Promise<Supplier> => {
    try {
      const newSupplier = await api.suppliers.createSupplier(supplierData);
      setSuppliers(prev => [...prev, newSupplier]);
      showNotification({
        type: 'success',
        message: 'Fournisseur créé',
        description: `Le fournisseur ${newSupplier.name} a été créé avec succès`
      });
      return newSupplier;
    } catch (err) {
      console.error('Erreur lors de la création du fournisseur:', err);
      showNotification({
        type: 'error',
        message: 'Erreur lors de la création du fournisseur',
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
      throw err;
    }
  };

  // Mettre à jour un fournisseur
  const updateSupplier = async (id: string, supplierData: Partial<Supplier>): Promise<Supplier> => {
    try {
      const updatedSupplier = await api.suppliers.updateSupplier(id, supplierData);
      setSuppliers(prev => 
        prev.map(supplier => supplier.id === id ? updatedSupplier : supplier)
      );
      showNotification({
        type: 'success',
        message: 'Fournisseur mis à jour',
        description: `Le fournisseur ${updatedSupplier.name} a été mis à jour avec succès`
      });
      return updatedSupplier;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du fournisseur:', err);
      showNotification({
        type: 'error',
        message: 'Erreur lors de la mise à jour du fournisseur',
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
      throw err;
    }
  };

  // Supprimer un fournisseur
  const deleteSupplier = async (id: string): Promise<boolean> => {
    try {
      const success = await api.suppliers.deleteSupplier(id);
      if (success) {
        setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
        showNotification({
          type: 'success',
          message: 'Fournisseur supprimé',
          description: 'Le fournisseur a été supprimé avec succès'
        });
      }
      return success;
    } catch (err) {
      console.error('Erreur lors de la suppression du fournisseur:', err);
      showNotification({
        type: 'error',
        message: 'Erreur lors de la suppression du fournisseur',
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
      throw err;
    }
  };

  // Importer des fournisseurs depuis un fichier
  const importSuppliers = async (
    fileUri: string, 
    options: { headerRow?: boolean; mapping?: Record<string, string> } = {}
  ): Promise<{ success: boolean; imported: number; errors: number; log: string[] }> => {
    try {
      const result = await api.suppliers.importSuppliers(fileUri, options);
      if (result.success) {
        await refreshSuppliers();
        showNotification({
          type: 'success',
          message: 'Importation réussie',
          description: `${result.imported} fournisseurs importés avec ${result.errors} erreurs`
        });
      }
      return result;
    } catch (err) {
      console.error('Erreur lors de l\'importation des fournisseurs:', err);
      showNotification({
        type: 'error',
        message: 'Erreur lors de l\'importation des fournisseurs',
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
      throw err;
    }
  };

  // Exporter des fournisseurs vers un fichier
  const exportSuppliers = async (
    format: 'csv' | 'xlsx' | 'pdf', 
    options: { ids?: string[]; includeInactive?: boolean } = {}
  ): Promise<string> => {
    try {
      const result = await api.suppliers.exportSuppliers(format, options);
      showNotification({
        type: 'success',
        message: 'Exportation réussie',
        description: `Les fournisseurs ont été exportés au format ${format.toUpperCase()}`
      });
      return result.fileUrl;
    } catch (err) {
      console.error('Erreur lors de l\'exportation des fournisseurs:', err);
      showNotification({
        type: 'error',
        message: 'Erreur lors de l\'exportation des fournisseurs',
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
      throw err;
    }
  };

  // Analyser la performance d'un fournisseur
  const analyzeSupplierPerformance = async (
    supplierId: string, 
    options: { startDate?: string; endDate?: string } = {}
  ): Promise<any> => {
    try {
      return await api.suppliers.analyzeSupplierPerformance(supplierId, options);
    } catch (err) {
      console.error('Erreur lors de l\'analyse de la performance du fournisseur:', err);
      showNotification({
        type: 'error',
        message: 'Erreur lors de l\'analyse du fournisseur',
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
      throw err;
    }
  };

  // Valeur du contexte
  const value: SupplierContextType = {
    suppliers,
    isLoading,
    error,
    refreshSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    importSuppliers,
    exportSuppliers,
    analyzeSupplierPerformance
  };

  return (
    <SupplierContext.Provider value={value}>
      {children}
    </SupplierContext.Provider>
  );
};

// Hook pour utiliser le contexte fournisseur
export const useSupplier = (): SupplierContextType => {
  const context = useContext(SupplierContext);
  if (context === undefined) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};