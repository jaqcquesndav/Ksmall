import { useCallback } from 'react';
import { useApi } from './useApi';
import API from '../../services/API';
import { Transaction, JournalEntry, Account, FinancialReport, LedgerEntry } from '../../types/accounting';

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
    return useApi<Transaction[]>(
      () => API.accounting.getTransactions(options),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: `transactions-${JSON.stringify(options)}`,
          ttl: 5 * 60 * 1000, // 5 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer une transaction spécifique
   */
  const useTransaction = (id: string | null) => {
    return useApi<Transaction>(
      () => id ? API.accounting.getTransaction(id) : Promise.reject('ID requis'),
      {
        autoFetch: !!id,
        fetchOnFocus: true,
        cache: {
          key: `transaction-${id}`,
          ttl: 5 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour créer une transaction
   */
  const useCreateTransaction = () => {
    return useApi<Transaction>(
      (transactionData: Partial<Transaction>) => API.accounting.createTransaction(transactionData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour mettre à jour une transaction
   */
  const useUpdateTransaction = () => {
    return useApi<Transaction>(
      (id: string, transactionData: Partial<Transaction>) => 
        API.accounting.updateTransaction(id, transactionData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour supprimer une transaction
   */
  const useDeleteTransaction = () => {
    return useApi<boolean>(
      (id: string) => API.accounting.deleteTransaction(id),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les comptes
   */
  const useAccounts = () => {
    return useApi<Account[]>(
      () => API.accounting.getAccounts(),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: 'accounts',
          ttl: 30 * 60 * 1000, // 30 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer un compte spécifique
   */
  const useAccount = (id: string | null) => {
    return useApi<Account>(
      () => id ? API.accounting.getAccount(id) : Promise.reject('ID requis'),
      {
        autoFetch: !!id,
        cache: {
          key: `account-${id}`,
          ttl: 30 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour créer un compte
   */
  const useCreateAccount = () => {
    return useApi<Account>(
      (accountData: Partial<Account>) => API.accounting.createAccount(accountData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour mettre à jour un compte
   */
  const useUpdateAccount = () => {
    return useApi<Account>(
      (id: string, accountData: Partial<Account>) => API.accounting.updateAccount(id, accountData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les écritures de journal
   */
  const useJournalEntries = (options: AccountingQueryOptions = {}) => {
    return useApi<JournalEntry[]>(
      () => API.accounting.getJournalEntries(options),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: `journal-entries-${JSON.stringify(options)}`,
          ttl: 5 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer une écriture de journal spécifique
   */
  const useJournalEntry = (id: string | null) => {
    return useApi<JournalEntry>(
      () => id ? API.accounting.getJournalEntry(id) : Promise.reject('ID requis'),
      {
        autoFetch: !!id,
        cache: {
          key: `journal-entry-${id}`,
          ttl: 5 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour créer une écriture de journal
   */
  const useCreateJournalEntry = () => {
    return useApi<JournalEntry>(
      (entryData: Partial<JournalEntry>) => API.accounting.createJournalEntry(entryData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour mettre à jour une écriture de journal
   */
  const useUpdateJournalEntry = () => {
    return useApi<JournalEntry>(
      (id: string, entryData: Partial<JournalEntry>) => 
        API.accounting.updateJournalEntry(id, entryData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les écritures du grand livre
   */
  const useLedgerEntries = (options: AccountingQueryOptions = {}) => {
    return useApi<LedgerEntry[]>(
      () => API.accounting.getLedgerEntries(options),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: `ledger-entries-${JSON.stringify(options)}`,
          ttl: 5 * 60 * 1000,
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour générer un rapport financier
   */
  const useFinancialReport = (
    type: 'balance_sheet' | 'income_statement' | 'cash_flow',
    options: { startDate?: string; endDate?: string; format?: 'json' | 'pdf' } = {}
  ) => {
    return useApi<FinancialReport>(
      () => API.accounting.generateFinancialReport(type, options),
      {
        autoFetch: true,
        cache: {
          key: `financial-report-${type}-${JSON.stringify(options)}`,
          ttl: 60 * 60 * 1000, // 1 heure
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour synchroniser les données comptables
   */
  const useSyncAccounting = () => {
    return useApi<boolean>(
      () => API.accounting.syncData(),
      { autoFetch: false }
    );
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
        return await API.accounting.exportData(type, format, options);
      } catch (error) {
        console.error('Erreur lors de l\'exportation des données:', error);
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