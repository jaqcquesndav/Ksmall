import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUniqueId } from '../utils/helpers';
import logger from '../utils/logger';
import DatabaseService from './DatabaseService';
import { accountingMockData } from '../data/accountingMockData';
// Importer les données mock directement en ES Modules plutôt qu'avec require()
import { transactionsMockData } from '../data/transactionsMockData';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// Import des templates et fonctions d'aide extraits
import { 
  getBilanTemplate, 
  getCompteResultatTemplate, 
  getBalanceTemplate,
  getTresorerieTemplate 
} from '../data/financialReportTemplates';
import {
  prepareBilanData,
  prepareCompteResultatData,
  prepareBalanceData,
  prepareTresorerieData,
  calculateNetCashFlowForAccounts
} from '../utils/financialReportHelpers';
// Import des types et adaptateurs centralisés
import { 
  ServiceTransaction, 
  ServiceTransactionEntry, 
  ServiceAccount,
  ServiceAttachment,
  ServiceFinancialReport,
  ServiceJournalEntry
} from '../types/accounting';
import {
  serviceAccountToDomainAccount,
  domainAccountToServiceAccount,
  serviceTransactionToDomainTransaction,
  serviceJournalEntryToDomainJournalEntry,
  domainJournalEntryToServiceJournalEntry
} from '../utils/adapters/accountingAdapters';

class AccountingService {
  // Transactions
  async getTransactions(
    startDate?: Date, 
    endDate?: Date, 
    status?: 'pending' | 'validated' | 'canceled'
  ): Promise<ServiceTransaction[]> {
    try {
      // 1. Récupérer les transactions depuis AsyncStorage
      const data = await AsyncStorage.getItem('transactions');
      let transactions: ServiceTransaction[] = data ? JSON.parse(data) : [];
      
      // 2. Récupérer les transactions depuis la base de données SQLite
      try {
        const db = await DatabaseService.getDatabase();
        
        // Construire la requête SQL avec les conditions si nécessaire
        let sqlQuery = `SELECT * FROM accounting_transactions`;
        const queryParams = [];
        
        // Ajouter des conditions de filtrage si nécessaires
        const conditions = [];
        
        if (startDate) {
          conditions.push("date >= ?");
          queryParams.push(startDate.toISOString().split('T')[0]);
        }
        
        if (endDate) {
          conditions.push("date <= ?");
          queryParams.push(endDate.toISOString().split('T')[0]);
        }
        
        if (status) {
          conditions.push("status = ?");
          queryParams.push(status);
        }
        
        if (conditions.length > 0) {
          sqlQuery += ' WHERE ' + conditions.join(' AND ');
        }
        
        // Exécuter la requête pour récupérer les transactions
        const [sqlTransactions] = await DatabaseService.executeQuery(
          db,
          sqlQuery,
          queryParams
        );

        if (sqlTransactions && sqlTransactions.rows && sqlTransactions.rows.length > 0) {
          logger.info(`Récupération de ${sqlTransactions.rows.length} transactions depuis la base de données`);
          
          for (let i = 0; i < sqlTransactions.rows.length; i++) {
            const transaction = sqlTransactions.rows.item(i);
            
            // Récupérer les entries pour cette transaction
            const [sqlEntries] = await DatabaseService.executeQuery(
              db,
              `SELECT e.*, a.name as account_name 
               FROM accounting_entries e 
               LEFT JOIN accounting_accounts a ON e.account_code = a.code
               WHERE e.transaction_id = ?`,
              [transaction.id]
            );
            
            const entries: ServiceTransactionEntry[] = [];
            if (sqlEntries && sqlEntries.rows && sqlEntries.rows.length > 0) {
              for (let j = 0; j < sqlEntries.rows.length; j++) {
                const entry = sqlEntries.rows.item(j);
                entries.push({
                  accountId: entry.account_code,
                  accountNumber: entry.account_code,
                  accountName: entry.account_name || entry.description,
                  debit: entry.debit,
                  credit: entry.credit
                });
              }
            }
            
            // Créer l'objet transaction
            const transactionObj: ServiceTransaction = {
              id: transaction.id,
              date: transaction.date,
              reference: transaction.reference,
              description: transaction.description,
              entries: entries,
              amount: transaction.total,
              status: transaction.status as 'pending' | 'validated' | 'canceled',
              createdAt: transaction.created_at,
              updatedAt: transaction.updated_at,
              createdBy: transaction.created_by || 'System',
              updatedBy: transaction.updated_by,
              validatedBy: transaction.validated_by,
              validatedAt: transaction.validated_at,
              attachments: []
            };
            
            // Ajouter la transaction à la liste s'il n'existe pas déjà avec le même ID
            if (!transactions.some(t => t.id === transactionObj.id)) {
              transactions.push(transactionObj);
            }
          }
        }
      } catch (dbError) {
        logger.warn('Erreur lors de la récupération des transactions depuis la base de données', dbError);
      }
      
      // 3. Si aucune transaction n'est trouvée, utiliser les données mock
      if (transactions.length === 0) {
        transactions = transactionsMockData.map((transaction: any) => ({
          id: transaction.id,
          date: transaction.date,
          reference: transaction.reference,
          description: transaction.description,
          entries: transaction.entries || [],
          amount: transaction.amount || 0,
          status: transaction.status === 'completed' ? 'validated' : 
                 transaction.status === 'pending' ? 'pending' : 'canceled',
          createdAt: transaction.createdAt || new Date().toISOString(),
          updatedAt: transaction.updatedAt || new Date().toISOString(),
          createdBy: transaction.createdBy || 'System',
          updatedBy: transaction.updatedBy,
          validatedBy: transaction.validatedBy,
          validatedAt: transaction.validatedAt
        }));
      }
      
      // 5. Trier par date (du plus récent au plus ancien)
      return transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      logger.error('Failed to get transactions', error);
      throw error;
    }
  }
  
  // Get a specific transaction by ID
  async getTransactionById(id: string): Promise<ServiceTransaction | null> {
    try {
      // Afficher l'ID recherché pour le débogage
      logger.debug(`Recherche de la transaction avec ID: ${id}`);

      // 1. D'abord, essayer de récupérer les transactions depuis AsyncStorage
      const data = await AsyncStorage.getItem('transactions');
      let transactions: ServiceTransaction[] = data ? JSON.parse(data) : [];
      let transaction = transactions.find(t => t.id === id);
      
      // 2. Si non trouvé dans AsyncStorage, rechercher dans la base de données SQLite
      if (!transaction) {
        try {
          logger.debug("Transaction non trouvée dans AsyncStorage, recherche dans la base de données");
          const db = await DatabaseService.getDatabase();
          
          // Récupérer la transaction
          const [sqlTransaction] = await DatabaseService.executeQuery(
            db,
            `SELECT * FROM accounting_transactions WHERE id = ?`,
            [id]
          );

          if (sqlTransaction && sqlTransaction.rows && sqlTransaction.rows.length > 0) {
            const transactionData = sqlTransaction.rows.item(0);
            
            // Récupérer les entrées pour cette transaction avec les noms de compte
            const [sqlEntries] = await DatabaseService.executeQuery(
              db,
              `SELECT e.*, a.name as account_name 
               FROM accounting_entries e 
               LEFT JOIN accounting_accounts a ON e.account_code = a.code
               WHERE e.transaction_id = ?`,
              [id]
            );
            
            const entries: ServiceTransactionEntry[] = [];
            if (sqlEntries && sqlEntries.rows && sqlEntries.rows.length > 0) {
              for (let j = 0; j < sqlEntries.rows.length; j++) {
                const entry = sqlEntries.rows.item(j);
                entries.push({
                  accountId: entry.account_code,
                  accountNumber: entry.account_code,
                  accountName: entry.account_name || entry.description,
                  debit: entry.debit,
                  credit: entry.credit
                });
              }
            }
            
            // Créer l'objet transaction
            transaction = {
              id: transactionData.id,
              date: transactionData.date,
              reference: transactionData.reference,
              description: transactionData.description,
              entries: entries,
              amount: transactionData.total,
              status: transactionData.status as 'pending' | 'validated' | 'canceled',
              createdAt: transactionData.created_at,
              updatedAt: transactionData.updated_at,
              createdBy: transactionData.created_by || 'System',
              updatedBy: transactionData.updated_by,
              validatedBy: transactionData.validated_by,
              validatedAt: transactionData.validated_at,
              attachments: []
            };
            
            logger.debug(`Transaction trouvée dans la base de données: ${transaction.reference}`);
          }
        } catch (dbError) {
          logger.warn('Erreur lors de la recherche dans la base de données', dbError);
        }
      }
      
      // 3. Si toujours non trouvé, chercher dans les données mock
      if (!transaction) {
        logger.debug("Transaction non trouvée dans la base de données, recherche dans les données mock");
        
        // Chercher par ID dans les données mock
        const mockTransaction = transactionsMockData.find(t => t.id === id);
        
        if (mockTransaction) {
          logger.debug("Transaction trouvée dans les données mock");
          // Convertir le format de la transaction mock pour assurer la compatibilité
          transaction = {
            id: mockTransaction.id,
            date: mockTransaction.date,
            reference: mockTransaction.reference,
            description: mockTransaction.description,
            entries: mockTransaction.entries || [],
            amount: mockTransaction.amount || 0,
            status: mockTransaction.status === 'completed' ? 'validated' : 
                   mockTransaction.status === 'pending' ? 'pending' : 'canceled',
            createdAt: mockTransaction.createdAt || new Date().toISOString(),
            updatedAt: mockTransaction.updatedAt || new Date().toISOString(),
            createdBy: mockTransaction.createdBy || 'System',
            updatedBy: mockTransaction.updatedBy,
            validatedBy: mockTransaction.validatedBy,
            validatedAt: mockTransaction.validatedAt
          };
        } else {
          logger.debug(`Transaction non trouvée dans les données mock pour ID: ${id}`);
        }
      }
      
      return transaction || null;
    } catch (error) {
      logger.error('Failed to get transaction', error);
      throw error;
    }
  }
  
  // Validate a transaction
  async validateTransaction(id: string): Promise<boolean> {
    try {
      const transactions = await this.getTransactions();
      const index = transactions.findIndex(t => t.id === id);
      
      if (index === -1) {
        throw new Error(`Transaction with id ${id} not found`);
      }
      
      transactions[index] = {
        ...transactions[index],
        status: 'validated',
        updatedAt: new Date().toISOString(),
        validatedAt: new Date().toISOString(),
        validatedBy: 'Current User' // Idéalement, récupérer le nom de l'utilisateur actuel
      };
      
      await AsyncStorage.setItem('transactions', JSON.stringify(transactions));
      return true;
    } catch (error) {
      logger.error('Failed to validate transaction', error);
      throw error;
    }
  }
  
  // Delete a transaction
  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const transactions = await this.getTransactions();
      const filteredTransactions = transactions.filter(t => t.id !== id);
      
      if (transactions.length === filteredTransactions.length) {
        throw new Error(`Transaction with id ${id} not found`);
      }
      
      await AsyncStorage.setItem('transactions', JSON.stringify(filteredTransactions));
      return true;
    } catch (error) {
      logger.error('Failed to delete transaction', error);
      throw error;
    }
  }

  // Autres méthodes de gestion des transactions et comptes...
  // [...]

  // Initialize demo data
  async initializeDemoData(): Promise<void> {
    // ... code inchangé ...
  }

  // Initialize mock transactions in AsyncStorage
  async initializeMockTransactions(): Promise<void> {
    // ... code inchangé ...
  }

  // SYSCOHADA Report Generation
  async generateSYSCOHADAReport(
    reportType: 'bilan' | 'compte_resultat' | 'balance' | 'tresorerie',
    startDate: Date,
    endDate: Date,
    companyName: string = 'Entreprise Demo',
    formatCurrency?: (value: number) => string
  ): Promise<string> {
    // ... code inchangé ...
  }
  
  // Partager un rapport existant
  async shareReport(reportFilePath: string): Promise<void> {
    // ... code inchangé ...
  }
  
  // Initialize with default chart of accounts for SYSCOHADA
  async initializeDefaultAccounts(): Promise<void> {
    try {
      const existingAccounts = await this.getAccounts();
      
      if (existingAccounts.length === 0) {
        // Based on SYSCOHADA chart of accounts
        const defaultAccounts: Omit<ServiceAccount, 'id'>[] = [
          // Class 1: Capital accounts
          { number: '10100000', name: 'Capital social', type: 'equity', balance: 0, isActive: true },
          { number: '11000000', name: 'Report à nouveau', type: 'equity', balance: 0, isActive: true },
          { number: '12000000', name: "Résultat de l'exercice", type: 'equity', balance: 0, isActive: true },
          
          // Class 2: Fixed assets
          { number: '21000000', name: 'Immobilisations incorporelles', type: 'asset', balance: 0, isActive: true },
          { number: '22000000', name: 'Terrains', type: 'asset', balance: 0, isActive: true },
          { number: '23000000', name: 'Bâtiments', type: 'asset', balance: 0, isActive: true },
          { number: '24000000', name: 'Matériel', type: 'asset', balance: 0, isActive: true },
          
          // Class 3: Stocks
          { number: '31000000', name: 'Marchandises', type: 'asset', balance: 0, isActive: true },
          { number: '32000000', name: 'Matières premières', type: 'asset', balance: 0, isActive: true },
          { number: '35000000', name: 'Produits finis', type: 'asset', balance: 0, isActive: true },
          
          // Class 4: Third-party accounts
          { number: '40000000', name: 'Fournisseurs', type: 'liability', balance: 0, isActive: true },
          { number: '41000000', name: 'Clients', type: 'asset', balance: 0, isActive: true },
          { number: '42000000', name: 'Personnel', type: 'liability', balance: 0, isActive: true },
          { number: '44000000', name: 'État', type: 'liability', balance: 0, isActive: true },
          
          // Class 5: Financial accounts
          { number: '52000000', name: 'Banque', type: 'asset', balance: 0, isActive: true },
          { number: '57000000', name: 'Caisse', type: 'asset', balance: 0, isActive: true },
          
          // Class 6: Expenses
          { number: '60000000', name: 'Achats', type: 'expense', balance: 0, isActive: true },
          { number: '61000000', name: 'Services extérieurs', type: 'expense', balance: 0, isActive: true },
          { number: '62000000', name: 'Autres services extérieurs', type: 'expense', balance: 0, isActive: true },
          { number: '63000000', name: 'Impôts et taxes', type: 'expense', balance: 0, isActive: true },
          { number: '64000000', name: 'Charges de personnel', type: 'expense', balance: 0, isActive: true },
          { number: '65000000', name: 'Autres charges', type: 'expense', balance: 0, isActive: true },
          { number: '66000000', name: 'Charges financières', type: 'expense', balance: 0, isActive: true },
          { number: '67000000', name: 'Charges exceptionnelles', type: 'expense', balance: 0, isActive: true },
          { number: '68000000', name: 'Dotations aux amortissements', type: 'expense', balance: 0, isActive: true },
          { number: '69000000', name: 'Impôts sur les bénéfices', type: 'expense', balance: 0, isActive: true },
          
          // Class 7: Income
          { number: '70000000', name: 'Ventes de produits', type: 'revenue', balance: 0, isActive: true },
          { number: '71000000', name: 'Production stockée', type: 'revenue', balance: 0, isActive: true },
          { number: '72000000', name: 'Production immobilisée', type: 'revenue', balance: 0, isActive: true },
          { number: '75000000', name: 'Autres produits', type: 'revenue', balance: 0, isActive: true },
          { number: '76000000', name: 'Produits financiers', type: 'revenue', balance: 0, isActive: true },
          { number: '77000000', name: 'Produits exceptionnels', type: 'revenue', balance: 0, isActive: true }
        ];
        
        for (const account of defaultAccounts) {
          await this.createAccount(account);
        }
        
        logger.info('Default SYSCOHADA accounts initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize default accounts', error);
      throw error;
    }
  }

  /**
   * Create a new journal entry
   */
  async createJournalEntry(journalEntry: ServiceJournalEntry): Promise<string> {
    try {
      const db = await DatabaseService.getDatabase();
      
      // Generate a unique ID for the transaction
      const transactionId = generateUniqueId();
      
      // Insert the main transaction record
      await DatabaseService.executeQuery(
        db,
        `INSERT INTO accounting_transactions 
         (id, reference, date, description, status, total, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          journalEntry.reference,
          journalEntry.date,
          journalEntry.description,
          journalEntry.status,
          journalEntry.total || 0, // Utiliser le total fourni ou 0 par défaut
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      
      // Insert each entry line
      for (const entry of journalEntry.entries) {
        await DatabaseService.executeQuery(
          db,
          `INSERT INTO accounting_entries 
           (id, transaction_id, account_code, description, debit, credit, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            generateUniqueId(),
            transactionId,
            entry.accountId,
            entry.description,
            entry.debit,
            entry.credit,
            new Date().toISOString()
          ]
        );
      }
      
      logger.info(`Created journal entry ${journalEntry.reference}`);
      return transactionId;
    } catch (error) {
      logger.error('Failed to create journal entry', error);
      throw error;
    }
  }

  // Resto des méthodes de base (gestion des transactions et comptes) non affichées ici...
  // Code inchangé pour ces méthodes
  
  // Autres méthodes nécessaires
  async getAccounts(): Promise<ServiceAccount[]> {
    try {
      const data = await AsyncStorage.getItem('accounts');
      const accounts = data ? JSON.parse(data) : [];
      
      return accounts.sort((a: ServiceAccount, b: ServiceAccount) => 
        a.number.localeCompare(b.number)
      );
    } catch (error) {
      logger.error('Failed to get accounts', error);
      throw error;
    }
  }
  
  async createAccount(account: Omit<ServiceAccount, 'id'>): Promise<ServiceAccount> {
    try {
      const newAccount: ServiceAccount = {
        ...account,
        id: generateUniqueId()
      };
      
      const accounts = await this.getAccounts();
      accounts.push(newAccount);
      
      await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
      
      return newAccount;
    } catch (error) {
      logger.error('Failed to create account', error);
      throw error;
    }
  }
}

export default new AccountingService();
