import { useState, useCallback, useEffect } from 'react';
import FinanceApiService from '../../services/api/finance/FinanceApiService';
import { 
  FinancingApplication, 
  FinancingQueryOptions, 
  FinancingDocument, 
  FinancingEligibility, 
  FinancingProvider,
  ActiveFinancing, 
  RepaymentSchedule,
  FINANCING_TYPES 
} from '../../types/finance';
import logger from '../../utils/logger';

/**
 * Hook pour gérer les demandes de financement
 */
export const useFinancingApplications = (options?: FinancingQueryOptions) => {
  const [applications, setApplications] = useState<FinancingApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplications = useCallback(async (queryOptions?: FinancingQueryOptions) => {
    const opts = queryOptions || options;
    setLoading(true);
    setError(null);
    try {
      const data = await FinanceApiService.getFinancingApplications(opts);
      setApplications(data);
      return data;
    } catch (err) {
      logger.error('Erreur lors du chargement des demandes de financement', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [options]);

  const getApplication = useCallback(async (applicationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await FinanceApiService.getFinancingApplication(applicationId);
      return data;
    } catch (err) {
      logger.error(`Erreur lors du chargement de la demande de financement ${applicationId}`, err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createApplication = useCallback(async (application: Partial<FinancingApplication>) => {
    setLoading(true);
    setError(null);
    try {
      const newApplication = await FinanceApiService.createFinancingApplication(application);
      setApplications(prev => [...prev, newApplication]);
      return newApplication;
    } catch (err) {
      logger.error('Erreur lors de la création de la demande de financement', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateApplication = useCallback(async (
    applicationId: string,
    updates: Partial<FinancingApplication>
  ) => {
    setLoading(true);
    setError(null);
    try {
      const updatedApplication = await FinanceApiService.updateFinancingApplication(applicationId, updates);
      setApplications(prev => 
        prev.map(app => app.id === applicationId ? updatedApplication : app)
      );
      return updatedApplication;
    } catch (err) {
      logger.error(`Erreur lors de la mise à jour de la demande de financement ${applicationId}`, err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitApplication = useCallback(async (applicationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const submittedApplication = await FinanceApiService.submitFinancingApplication(applicationId);
      setApplications(prev => 
        prev.map(app => app.id === applicationId ? submittedApplication : app)
      );
      return submittedApplication;
    } catch (err) {
      logger.error(`Erreur lors de la soumission de la demande de financement ${applicationId}`, err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelApplication = useCallback(async (applicationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const cancelledApplication = await FinanceApiService.cancelFinancingApplication(applicationId);
      setApplications(prev => 
        prev.map(app => app.id === applicationId ? cancelledApplication : app)
      );
      return cancelledApplication;
    } catch (err) {
      logger.error(`Erreur lors de l'annulation de la demande de financement ${applicationId}`, err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (
    applicationId: string,
    documentType: string,
    formData: FormData
  ) => {
    setLoading(true);
    setError(null);
    try {
      const document = await FinanceApiService.uploadFinancingDocument(applicationId, documentType, formData);
      return document;
    } catch (err) {
      logger.error(`Erreur lors du téléchargement du document pour la demande ${applicationId}`, err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (applicationId: string, documentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await FinanceApiService.deleteFinancingDocument(applicationId, documentId);
      return result;
    } catch (err) {
      logger.error(`Erreur lors de la suppression du document ${documentId}`, err);
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptOffer = useCallback(async (applicationId: string, offerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const updatedApplication = await FinanceApiService.acceptFinancingOffer(applicationId, offerId);
      setApplications(prev => 
        prev.map(app => app.id === applicationId ? updatedApplication : app)
      );
      return updatedApplication;
    } catch (err) {
      logger.error(`Erreur lors de l'acceptation de l'offre ${offerId}`, err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectOffer = useCallback(async (applicationId: string, offerId: string, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const updatedApplication = await FinanceApiService.rejectFinancingOffer(applicationId, offerId, reason);
      setApplications(prev => 
        prev.map(app => app.id === applicationId ? updatedApplication : app)
      );
      return updatedApplication;
    } catch (err) {
      logger.error(`Erreur lors du rejet de l'offre ${offerId}`, err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les applications au montage du composant
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    fetchApplications,
    getApplication,
    createApplication,
    updateApplication,
    submitApplication,
    cancelApplication,
    uploadDocument,
    deleteDocument,
    acceptOffer,
    rejectOffer
  };
};

/**
 * Hook pour gérer les fournisseurs de financement
 */
export const useFinancingProviders = (type?: FINANCING_TYPES) => {
  const [providers, setProviders] = useState<FinancingProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProviders = useCallback(async (providerType?: FINANCING_TYPES) => {
    const actualType = providerType || type;
    setLoading(true);
    setError(null);
    try {
      const data = await FinanceApiService.getFinancingProviders(actualType);
      setProviders(data);
      return data;
    } catch (err) {
      logger.error('Erreur lors du chargement des fournisseurs de financement', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [type]);

  // Charger les fournisseurs au montage du composant
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    providers,
    loading,
    error,
    fetchProviders
  };
};

/**
 * Hook pour vérifier l'éligibilité au financement
 */
export const useFinancingEligibility = () => {
  const [eligibility, setEligibility] = useState<FinancingEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkEligibility = useCallback(async (
    amount: number,
    currency: string,
    type: FINANCING_TYPES,
    term?: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await FinanceApiService.checkFinancingEligibility(amount, currency, type, term);
      setEligibility(data);
      return data;
    } catch (err) {
      logger.error('Erreur lors de la vérification de l\'éligibilité au financement', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    eligibility,
    loading,
    error,
    checkEligibility
  };
};

/**
 * Hook pour gérer les financements actifs
 */
export const useActiveFinancing = () => {
  const [activeFinancing, setActiveFinancing] = useState<ActiveFinancing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchActiveFinancing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await FinanceApiService.getActiveFinancing();
      setActiveFinancing(data);
      return data;
    } catch (err) {
      logger.error('Erreur lors du chargement des financements actifs', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getRepaymentSchedule = useCallback(async (financingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const schedule = await FinanceApiService.getRepaymentSchedule(financingId);
      return schedule;
    } catch (err) {
      logger.error(`Erreur lors du chargement du calendrier de remboursement pour ${financingId}`, err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const makeRepayment = useCallback(async (
    financingId: string,
    amount: number,
    method: 'bank_transfer' | 'card' | 'mobile_money',
    reference?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await FinanceApiService.makeRepayment(financingId, amount, method, reference);
      if (result.success) {
        await fetchActiveFinancing(); // Rafraîchir la liste
      }
      return result;
    } catch (err) {
      logger.error(`Erreur lors du paiement pour le financement ${financingId}`, err);
      setError(err as Error);
      return { success: false, transactionId: '' };
    } finally {
      setLoading(false);
    }
  }, [fetchActiveFinancing]);

  // Charger les financements actifs au montage du composant
  useEffect(() => {
    fetchActiveFinancing();
  }, [fetchActiveFinancing]);

  return {
    activeFinancing,
    loading,
    error,
    fetchActiveFinancing,
    getRepaymentSchedule,
    makeRepayment
  };
};

/**
 * Hook pour les statistiques de financement
 */
export const useFinancingStats = () => {
  const [stats, setStats] = useState<{
    totalRequested: number;
    totalApproved: number;
    totalActive: number;
    totalRepaid: number;
    approvalRate: number;
    avgInterestRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await FinanceApiService.getFinancingStats();
      setStats(data);
      return data;
    } catch (err) {
      logger.error('Erreur lors du chargement des statistiques de financement', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les stats au montage du composant
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
};

export default {
  useFinancingApplications,
  useFinancingProviders,
  useFinancingEligibility,
  useActiveFinancing,
  useFinancingStats
};