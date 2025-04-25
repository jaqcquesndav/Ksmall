import { useState, useCallback, useEffect } from 'react';
import AccountingApiService from '../../services/api/accounting/AccountingApiService';
import { 
  Transaction, 
  JournalEntry, 
  Account, 
  FinancialReport, 
  LedgerEntry 
} from '../../types/accounting';
import logger from '../../utils/logger';

/**
 * Options pour les requêtes de comptabilité
 */
interface AccountingQueryOptions {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  status?: string;
  type?: string;
  search?: string;
  category?: string;
}

/**
 * Hook pour gérer les fonctionnalités de comptabilité
 */
export function useAccounting() {
  /**
   * Hook pour récupérer les transactions
   */
  const useTransactions = (options: AccountingQueryOptions = {}) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchTransactions = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await AccountingApiService.getTransactions(
          options.startDate,
          options.endDate,
          options.status
        );
        setTransactions(data);
        return data;
      } catch (err) {
        logger.error('Erreur lors du chargement des transactions', err);
        setError(err as Error);
        return [];
      } finally {
        setLoading(false);
      }
    }, [options.startDate, options.endDate, options.status]);
    
    // Charger les transactions au montage du composant
    useEffect(() => {
      fetchTransactions();
    }, [fetchTransactions]);
    
    return {
      transactions,
      loading,
      error,
      fetchTransactions
    };
  };

  /**
   * Hook pour récupérer une transaction spécifique
   */
  const useTransaction = (id: string | null) => {
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchTransaction = useCallback(async () => {
      if (!id) return null;
      
      setLoading(true);
      setError(null);
      try {
        const data = await AccountingApiService.getTransactionById(id);
        setTransaction(data);
        return data;
      } catch (err) {
        logger.error(`Erreur lors du chargement de la transaction ${id}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, [id]);
    
    useEffect(() => {
      if (id) {
        fetchTransaction();
      }
    }, [fetchTransaction, id]);
    
    return {
      transaction,
      loading,
      error,
      fetchTransaction
    };
  };

  /**
   * Hook pour créer une transaction
   */
  const useCreateTransaction = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const createTransaction = useCallback(async (transactionData: Omit<Transaction, 'id'>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await AccountingApiService.createTransaction(transactionData);
        return result;
      } catch (err) {
        logger.error('Erreur lors de la création de la transaction', err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      createTransaction,
      loading,
      error
    };
  };

  /**
   * Hook pour mettre à jour une transaction
   */
  const useUpdateTransaction = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const updateTransaction = useCallback(async (id: string, transactionData: Partial<Transaction>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await AccountingApiService.updateTransaction(id, transactionData);
        return result;
      } catch (err) {
        logger.error(`Erreur lors de la mise à jour de la transaction ${id}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      updateTransaction,
      loading,
      error
    };
  };

  /**
   * Hook pour supprimer une transaction
   */
  const useDeleteTransaction = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const deleteTransaction = useCallback(async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await AccountingApiService.deleteTransaction(id);
        return result;
      } catch (err) {
        logger.error(`Erreur lors de la suppression de la transaction ${id}`, err);
        setError(err as Error);
        return false;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      deleteTransaction,
      loading,
      error
    };
  };

  /**
   * Hook pour récupérer les comptes
   */
  const useAccounts = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchAccounts = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await AccountingApiService.getAccounts();
        setAccounts(data);
        return data;
      } catch (err) {
        logger.error('Erreur lors du chargement des comptes', err);
        setError(err as Error);
        return [];
      } finally {
        setLoading(false);
      }
    }, []);
    
    useEffect(() => {
      fetchAccounts();
    }, [fetchAccounts]);
    
    return {
      accounts,
      loading,
      error,
      fetchAccounts
    };
  };

  /**
   * Hook pour récupérer un compte spécifique
   */
  const useAccount = (id: string | null) => {
    const [account, setAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchAccount = useCallback(async () => {
      if (!id) return null;
      
      setLoading(true);
      setError(null);
      try {
        // Cette méthode devrait être ajoutée à AccountingApiService
        const data = await AccountingApiService.getAccountById(id);
        setAccount(data);
        return data;
      } catch (err) {
        logger.error(`Erreur lors du chargement du compte ${id}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, [id]);
    
    useEffect(() => {
      if (id) {
        fetchAccount();
      }
    }, [fetchAccount, id]);
    
    return {
      account,
      loading,
      error,
      fetchAccount
    };
  };

  /**
   * Hook pour créer un compte
   */
  const useCreateAccount = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const createAccount = useCallback(async (accountData: Omit<Account, 'id'>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await AccountingApiService.createAccount(accountData);
        return result;
      } catch (err) {
        logger.error('Erreur lors de la création du compte', err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      createAccount,
      loading,
      error
    };
  };

  /**
   * Hook pour mettre à jour un compte
   */
  const useUpdateAccount = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const updateAccount = useCallback(async (id: string, accountData: Partial<Account>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await AccountingApiService.updateAccount(id, accountData);
        return result;
      } catch (err) {
        logger.error(`Erreur lors de la mise à jour du compte ${id}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      updateAccount,
      loading,
      error
    };
  };

  /**
   * Hook pour récupérer les écritures de journal
   */
  const useJournalEntries = (options: AccountingQueryOptions = {}) => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchJournalEntries = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await AccountingApiService.getJournalEntries(
          options.startDate,
          options.endDate
        );
        setEntries(data);
        return data;
      } catch (err) {
        logger.error('Erreur lors du chargement des écritures de journal', err);
        setError(err as Error);
        return [];
      } finally {
        setLoading(false);
      }
    }, [options.startDate, options.endDate]);
    
    useEffect(() => {
      fetchJournalEntries();
    }, [fetchJournalEntries]);
    
    return {
      entries,
      loading,
      error,
      fetchJournalEntries
    };
  };

  /**
   * Hook pour récupérer une écriture de journal spécifique
   */
  const useJournalEntry = (id: string | null) => {
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchJournalEntry = useCallback(async () => {
      if (!id) return null;
      
      setLoading(true);
      setError(null);
      try {
        // Cette méthode devrait être ajoutée à AccountingApiService
        const data = await AccountingApiService.getJournalEntryById(id);
        setEntry(data);
        return data;
      } catch (err) {
        logger.error(`Erreur lors du chargement de l'écriture de journal ${id}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, [id]);
    
    useEffect(() => {
      if (id) {
        fetchJournalEntry();
      }
    }, [fetchJournalEntry, id]);
    
    return {
      entry,
      loading,
      error,
      fetchJournalEntry
    };
  };

  /**
   * Hook pour créer une écriture de journal
   */
  const useCreateJournalEntry = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const createJournalEntry = useCallback(async (entryData: JournalEntry) => {
      setLoading(true);
      setError(null);
      try {
        const result = await AccountingApiService.saveJournalEntry(entryData);
        return result;
      } catch (err) {
        logger.error('Erreur lors de la création de l\'écriture de journal', err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      createJournalEntry,
      loading,
      error
    };
  };

  /**
   * Hook pour mettre à jour une écriture de journal
   */
  const useUpdateJournalEntry = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const updateJournalEntry = useCallback(async (entryData: JournalEntry) => {
      setLoading(true);
      setError(null);
      try {
        const result = await AccountingApiService.saveJournalEntry(entryData);
        return result;
      } catch (err) {
        logger.error(`Erreur lors de la mise à jour de l'écriture de journal ${entryData.id}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return {
      updateJournalEntry,
      loading,
      error
    };
  };

  /**
   * Hook pour récupérer les écritures du grand livre
   */
  const useLedgerEntries = (options: AccountingQueryOptions = {}) => {
    const [ledgerData, setLedgerData] = useState<{
      ledgerEntries: LedgerEntry[];
      totalDebit: number;
      totalCredit: number;
    }>({ ledgerEntries: [], totalDebit: 0, totalCredit: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchLedgerEntries = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        if (!options.startDate || !options.endDate) {
          throw new Error('Les dates de début et de fin sont requises pour les entrées du grand livre');
        }
        
        const data = await AccountingApiService.getLedger(
          options.startDate,
          options.endDate,
          options.category // Utilisation de category comme accountId
        );
        
        setLedgerData({
          ledgerEntries: data.ledgerEntries,
          totalDebit: data.totalDebit,
          totalCredit: data.totalCredit
        });
        
        return data;
      } catch (err) {
        logger.error('Erreur lors du chargement des entrées du grand livre', err);
        setError(err as Error);
        return { ledgerEntries: [], totalDebit: 0, totalCredit: 0 };
      } finally {
        setLoading(false);
      }
    }, [options.startDate, options.endDate, options.category]);
    
    useEffect(() => {
      if (options.startDate && options.endDate) {
        fetchLedgerEntries();
      }
    }, [fetchLedgerEntries, options.startDate, options.endDate]);
    
    return {
      ...ledgerData,
      loading,
      error,
      fetchLedgerEntries
    };
  };

  /**
   * Hook pour générer un rapport financier
   */
  const useFinancialReport = (
    type: 'balance_sheet' | 'income_statement' | 'cash_flow',
    options: { startDate?: string; endDate?: string; format?: 'json' | 'pdf' } = {}
  ) => {
    const [report, setReport] = useState<FinancialReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const generateReport = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        let result: FinancialReport;
        
        if (!options.startDate || !options.endDate) {
          throw new Error('Les dates de début et de fin sont requises pour générer un rapport');
        }
        
        switch (type) {
          case 'balance_sheet':
            result = await AccountingApiService.generateBalanceSheet(
              options.startDate,
              options.endDate,
              options.format || 'json'
            );
            break;
            
          case 'income_statement':
            result = await AccountingApiService.generateIncomeStatement(
              options.startDate,
              options.endDate,
              options.format || 'json'
            );
            break;
            
          case 'cash_flow':
            result = await AccountingApiService.generateCashFlowStatement(
              options.startDate,
              options.endDate,
              options.format || 'json'
            );
            break;
            
          default:
            throw new Error(`Type de rapport non supporté: ${type}`);
        }
        
        setReport(result);
        return result;
      } catch (err) {
        logger.error(`Erreur lors de la génération du rapport ${type}`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    }, [type, options.startDate, options.endDate, options.format]);
    
    useEffect(() => {
      if (options.startDate && options.endDate) {
        generateReport();
      }
    }, [generateReport, options.startDate, options.endDate]);
    
    return {
      report,
      loading,
      error,
      generateReport
    };
  };

  /**
   * Hook pour synchroniser les données comptables
   */
  const useSyncAccounting = () => {
    const [syncStatus, setSyncStatus] = useState<{
      status: 'idle' | 'syncing' | 'success' | 'error';
      lastSync: string | null;
      error: Error | null;
    }>({
      status: 'idle',
      lastSync: null,
      error: null
    });
    
    const syncData = useCallback(async (forceFullSync: boolean = false) => {
      setSyncStatus(prev => ({ ...prev, status: 'syncing', error: null }));
      
      try {
        const result = await AccountingApiService.syncAccountingData({
          forceFullSync,
          syncAttachments: true
        });
        
        if (result.status === 'success' || result.status === 'partial') {
          setSyncStatus({
            status: 'success',
            lastSync: new Date().toISOString(),
            error: null
          });
          return true;
        } else {
          const error = new Error(`Erreur de synchronisation: ${result.errors.length} erreurs`);
          setSyncStatus({
            status: 'error',
            lastSync: new Date().toISOString(),
            error
          });
          return false;
        }
      } catch (err) {
        logger.error('Erreur lors de la synchronisation des données comptables', err);
        setSyncStatus({
          status: 'error',
          lastSync: new Date().toISOString(),
          error: err as Error
        });
        return false;
      }
    }, []);
    
    return {
      ...syncStatus,
      syncData
    };
  };

  /**
   * Fonction pour exporter des données comptables
   */
  const exportData = useCallback(
    async (
      type: 'transactions' | 'journal' | 'ledger' | 'accounts',
      format: 'csv' | 'xlsx' | 'pdf',
      options: AccountingQueryOptions = {}
    ) => {
      try {
        // Cette méthode devrait être ajoutée à AccountingApiService
        return await AccountingApiService.exportData(type, format, options);
      } catch (error) {
        logger.error('Erreur lors de l\'exportation des données:', error);
        throw error;
      }
    },
    []
  );

  return {
    useTransactions,
    useTransaction,
    useCreateTransaction,
    useUpdateTransaction,
    useDeleteTransaction,
    useAccounts,
    useAccount,
    useCreateAccount,
    useUpdateAccount,
    useJournalEntries,
    useJournalEntry,
    useCreateJournalEntry,
    useUpdateJournalEntry,
    useLedgerEntries,
    useFinancialReport,
    useSyncAccounting,
    exportData
  };
}