import ApiService from '../ApiService';
import { Transaction, Account, FinancialReport, JournalEntry } from '../../../services/AccountingService';
import logger from '../../../utils/logger';

/**
 * Réponse contenant le grand livre
 */
export interface LedgerResponse {
  ledgerEntries: any[];
  startDate: string;
  endDate: string;
  totalDebit: number;
  totalCredit: number;
  accounts: Account[];
}

/**
 * Options de filtrage pour les rapports financiers
 */
export interface FinancialReportOptions {
  startDate: string;
  endDate: string;
  reportType: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance';
  format?: 'html' | 'pdf' | 'json';
  language?: string;
  companyId?: string;
}

/**
 * Options de synchronisation des données comptables
 */
export interface AccountingSyncOptions {
  forceFullSync?: boolean;
  syncAttachments?: boolean;
  lastSyncDate?: string;
}

/**
 * Service API pour la comptabilité
 */
class AccountingApiService {
  private static readonly BASE_PATH = '/accounting';

  /**
   * Récupère toutes les transactions du serveur
   */
  async getTransactions(startDate?: string, endDate?: string, status?: string): Promise<Transaction[]> {
    try {
      // Construire les paramètres de requête
      const params: Record<string, any> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (status) params.status = status;

      return await ApiService.get<Transaction[]>(`${AccountingApiService.BASE_PATH}/transactions`, params);
    } catch (error) {
      logger.error('Erreur lors de la récupération des transactions', error);
      throw error;
    }
  }

  /**
   * Récupère une transaction spécifique par ID
   */
  async getTransactionById(id: string): Promise<Transaction> {
    try {
      return await ApiService.get<Transaction>(`${AccountingApiService.BASE_PATH}/transactions/${id}`);
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la transaction ${id}`, error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle transaction
   */
  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      return await ApiService.post<Transaction>(`${AccountingApiService.BASE_PATH}/transactions`, transaction);
    } catch (error) {
      logger.error('Erreur lors de la création de la transaction', error);
      throw error;
    }
  }

  /**
   * Met à jour une transaction existante
   */
  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    try {
      return await ApiService.put<Transaction>(`${AccountingApiService.BASE_PATH}/transactions/${id}`, transaction);
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la transaction ${id}`, error);
      throw error;
    }
  }

  /**
   * Supprime une transaction
   */
  async deleteTransaction(id: string): Promise<boolean> {
    try {
      await ApiService.delete(`${AccountingApiService.BASE_PATH}/transactions/${id}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la transaction ${id}`, error);
      throw error;
    }
  }

  /**
   * Valide une transaction
   */
  async validateTransaction(id: string): Promise<Transaction> {
    try {
      return await ApiService.put<Transaction>(`${AccountingApiService.BASE_PATH}/transactions/${id}/validate`, {});
    } catch (error) {
      logger.error(`Erreur lors de la validation de la transaction ${id}`, error);
      throw error;
    }
  }

  /**
   * Récupère tous les comptes du plan comptable
   */
  async getAccounts(): Promise<Account[]> {
    try {
      return await ApiService.get<Account[]>(`${AccountingApiService.BASE_PATH}/accounts`);
    } catch (error) {
      logger.error('Erreur lors de la récupération des comptes', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau compte
   */
  async createAccount(account: Omit<Account, 'id'>): Promise<Account> {
    try {
      return await ApiService.post<Account>(`${AccountingApiService.BASE_PATH}/accounts`, account);
    } catch (error) {
      logger.error('Erreur lors de la création du compte', error);
      throw error;
    }
  }

  /**
   * Met à jour un compte existant
   */
  async updateAccount(id: string, account: Partial<Account>): Promise<Account> {
    try {
      return await ApiService.put<Account>(`${AccountingApiService.BASE_PATH}/accounts/${id}`, account);
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du compte ${id}`, error);
      throw error;
    }
  }

  /**
   * Supprime un compte
   */
  async deleteAccount(id: string): Promise<boolean> {
    try {
      await ApiService.delete(`${AccountingApiService.BASE_PATH}/accounts/${id}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du compte ${id}`, error);
      throw error;
    }
  }

  /**
   * Génère un rapport financier
   */
  async generateFinancialReport(options: FinancialReportOptions): Promise<FinancialReport> {
    try {
      return await ApiService.post<FinancialReport>(`${AccountingApiService.BASE_PATH}/reports`, options);
    } catch (error) {
      logger.error('Erreur lors de la génération du rapport financier', error);
      throw error;
    }
  }

  /**
   * Récupère le grand livre
   */
  async getLedger(startDate: string, endDate: string, accountId?: string): Promise<LedgerResponse> {
    try {
      const params: Record<string, any> = {
        startDate,
        endDate
      };
      
      if (accountId) {
        params.accountId = accountId;
      }
      
      return await ApiService.get<LedgerResponse>(`${AccountingApiService.BASE_PATH}/ledger`, params);
    } catch (error) {
      logger.error('Erreur lors de la récupération du grand livre', error);
      throw error;
    }
  }

  /**
   * Génère le bilan comptable
   */
  async generateBalanceSheet(startDate: string, endDate: string, format: 'html' | 'pdf' | 'json' = 'json'): Promise<FinancialReport> {
    try {
      return await ApiService.post<FinancialReport>(`${AccountingApiService.BASE_PATH}/reports/balance-sheet`, {
        startDate,
        endDate,
        format
      });
    } catch (error) {
      logger.error('Erreur lors de la génération du bilan', error);
      throw error;
    }
  }

  /**
   * Génère le compte de résultat
   */
  async generateIncomeStatement(startDate: string, endDate: string, format: 'html' | 'pdf' | 'json' = 'json'): Promise<FinancialReport> {
    try {
      return await ApiService.post<FinancialReport>(`${AccountingApiService.BASE_PATH}/reports/income-statement`, {
        startDate,
        endDate,
        format
      });
    } catch (error) {
      logger.error('Erreur lors de la génération du compte de résultat', error);
      throw error;
    }
  }

  /**
   * Génère le tableau de flux de trésorerie
   */
  async generateCashFlowStatement(startDate: string, endDate: string, format: 'html' | 'pdf' | 'json' = 'json'): Promise<FinancialReport> {
    try {
      return await ApiService.post<FinancialReport>(`${AccountingApiService.BASE_PATH}/reports/cash-flow`, {
        startDate,
        endDate,
        format
      });
    } catch (error) {
      logger.error('Erreur lors de la génération du tableau de flux de trésorerie', error);
      throw error;
    }
  }

  /**
   * Génère la balance des comptes
   */
  async generateTrialBalance(startDate: string, endDate: string, format: 'html' | 'pdf' | 'json' = 'json'): Promise<FinancialReport> {
    try {
      return await ApiService.post<FinancialReport>(`${AccountingApiService.BASE_PATH}/reports/trial-balance`, {
        startDate,
        endDate,
        format
      });
    } catch (error) {
      logger.error('Erreur lors de la génération de la balance des comptes', error);
      throw error;
    }
  }

  /**
   * Crée un rapport personnalisé
   */
  async createCustomReport(name: string, config: any): Promise<any> {
    try {
      return await ApiService.post<any>(`${AccountingApiService.BASE_PATH}/reports/custom`, {
        name,
        config
      });
    } catch (error) {
      logger.error('Erreur lors de la création du rapport personnalisé', error);
      throw error;
    }
  }

  /**
   * Télécharge un rapport au format PDF
   */
  async downloadReport(reportId: string): Promise<{ url: string }> {
    try {
      return await ApiService.get<{ url: string }>(`${AccountingApiService.BASE_PATH}/reports/${reportId}/download`);
    } catch (error) {
      logger.error(`Erreur lors du téléchargement du rapport ${reportId}`, error);
      throw error;
    }
  }

  /**
   * Importe des transactions à partir d'un fichier
   */
  async importTransactions(formData: FormData): Promise<{ imported: number; errors: any[] }> {
    try {
      return await ApiService.uploadFile<{ imported: number; errors: any[] }>(
        `${AccountingApiService.BASE_PATH}/import`,
        formData
      );
    } catch (error) {
      logger.error('Erreur lors de l\'importation des transactions', error);
      throw error;
    }
  }

  /**
   * Synchronise les données comptables entre le local et le backend
   */
  async syncAccountingData(options: AccountingSyncOptions = {}): Promise<{
    status: 'success' | 'partial' | 'failed';
    updated: number;
    errors: any[];
  }> {
    try {
      return await ApiService.post<{
        status: 'success' | 'partial' | 'failed';
        updated: number;
        errors: any[];
      }>(`${AccountingApiService.BASE_PATH}/sync`, options);
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des données comptables', error);
      throw error;
    }
  }

  /**
   * Crée ou met à jour une écriture comptable dans le journal
   */
  async saveJournalEntry(entry: JournalEntry): Promise<{ journalEntryId: string }> {
    try {
      return await ApiService.post<{ journalEntryId: string }>(
        `${AccountingApiService.BASE_PATH}/journal-entries`,
        entry
      );
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de l\'écriture comptable', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les écritures comptables du journal
   */
  async getJournalEntries(startDate?: string, endDate?: string): Promise<JournalEntry[]> {
    try {
      const params: Record<string, any> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      return await ApiService.get<JournalEntry[]>(`${AccountingApiService.BASE_PATH}/journal-entries`, params);
    } catch (error) {
      logger.error('Erreur lors de la récupération des écritures du journal', error);
      throw error;
    }
  }
}

export default new AccountingApiService();