import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUniqueId } from '../utils/helpers';
import logger from '../utils/logger';
import DatabaseService from './DatabaseService';
import { accountingMockData } from '../data/accountingMockData';
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

export interface Transaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  entries: TransactionEntry[];
  amount: number;
  status: 'pending' | 'validated' | 'canceled';
  createdAt: string;
  updatedAt: string;
  createdBy: string;   // Changed to required field
  updatedBy?: string;
  validatedBy?: string;
  validatedAt?: string;
  attachments?: Attachment[];
}

export interface TransactionEntry {
  accountId: string;
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface Account {
  id: string;
  number: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  isActive: boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface FinancialReport {
  id: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance';
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  data: any;
}

export interface JournalEntry {
  date: string;
  reference: string;
  description: string;
  entries: {
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
    description: string;
  }[];
  status: string;
  total: number;
  attachments: any[];
  companyId: string;
}

class AccountingService {
  // Transactions
  async getTransactions(
    startDate?: Date, 
    endDate?: Date, 
    status?: 'pending' | 'validated' | 'canceled'
  ): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem('transactions');
      let transactions: Transaction[] = data ? JSON.parse(data) : [];
      
      // Si aucune transaction n'est trouvée dans AsyncStorage, utiliser les données mock
      if (transactions.length === 0) {
        const { transactionsMockData } = require('../data/transactionsMockData');
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
      
      if (startDate || endDate || status) {
        transactions = transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          const matchesStartDate = startDate ? transactionDate >= startDate : true;
          const matchesEndDate = endDate ? transactionDate <= endDate : true;
          const matchesStatus = status ? transaction.status === status : true;
          
          return matchesStartDate && matchesEndDate && matchesStatus;
        });
      }
      
      return transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      logger.error('Failed to get transactions', error);
      throw error;
    }
  }
  
  // Get a specific transaction by ID
  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      // Afficher l'ID recherché pour le débogage
      console.log(`Recherche de la transaction avec ID: ${id}`);

      // D'abord, essayer de récupérer les transactions depuis AsyncStorage
      const data = await AsyncStorage.getItem('transactions');
      console.log(`Données AsyncStorage récupérées, longueur: ${data ? JSON.parse(data).length : 0}`);
      
      let transactions: Transaction[] = data ? JSON.parse(data) : [];
      let transaction = transactions.find(t => t.id === id);
      
      // Si aucune transaction n'est trouvée dans AsyncStorage, chercher dans les données mock
      if (!transaction) {
        console.log("Transaction non trouvée dans AsyncStorage, recherche dans les données mock");
        // Importer directement les données mock
        const { transactionsMockData } = require('../data/transactionsMockData');
        
        // Chercher par ID dans les données mock
        const mockTransaction = transactionsMockData.find(t => t.id === id);
        
        if (mockTransaction) {
          console.log("Transaction trouvée dans les données mock");
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
          console.log(`Transaction non trouvée dans les données mock pour ID: ${id}`);
        }
      }
      
      return transaction || null;
    } catch (error) {
      console.error('Failed to get transaction', error);
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
    try {
      const isInitialized = await AsyncStorage.getItem('accounting_demo_initialized');
      
      if (!isInitialized) {
        // 1. Initialize accounts
        await this.initializeDefaultAccounts();
        
        // 2. Initialize transactions from mock data
        const db = await DatabaseService.getDatabase();
        
        // Pour éviter l'erreur TypeScript, utilisons executeQuery au lieu de transaction
        // Clear existing data in tables
        await DatabaseService.executeQuery(db, 'DELETE FROM accounting_transactions', []);
        await DatabaseService.executeQuery(db, 'DELETE FROM accounting_entries', []);
        await DatabaseService.executeQuery(db, 'DELETE FROM accounting_accounts', []);
        
        // Import accounts
        for (const account of accountingMockData.accounts) {
          await DatabaseService.executeQuery(
            db,
            `INSERT INTO accounting_accounts (id, code, name, type, balance, is_active) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [account.id, account.code, account.name, account.type, account.balance, 1]
          );
        }
        
        // Import journal entries
        for (const entry of accountingMockData.journalEntries) {
          const transactionId = generateUniqueId();
          
          // Calculer le total de la transaction (somme des débits ou crédits)
          const totalAmount = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
          
          await DatabaseService.executeQuery(
            db,
            `INSERT INTO accounting_transactions (id, reference, date, description, status, total, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              transactionId,
              entry.reference,
              entry.date,
              entry.description,
              entry.status,
              totalAmount,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          );
          
          // Insert transaction lines
          for (const line of entry.lines) {
            await DatabaseService.executeQuery(
              db,
              `INSERT INTO accounting_entries (id, transaction_id, account_code, description, debit, credit) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                generateUniqueId(),
                transactionId,
                line.accountCode,
                line.description,
                line.debit,
                line.credit
              ]
            );
          }
        }
        
        // Mark as initialized
        await AsyncStorage.setItem('accounting_demo_initialized', 'true');
        
        logger.info('Demo accounting data initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize demo accounting data', error);
      throw error;
    }
  }

  // Initialize mock transactions in AsyncStorage
  async initializeMockTransactions(): Promise<void> {
    try {
      // Vérifier si les transactions sont déjà initialisées
      const existingData = await AsyncStorage.getItem('transactions');
      if (existingData && JSON.parse(existingData).length > 0) {
        logger.info('Mock transactions already initialized');
        return;
      }

      // Importer les données mock depuis transactionsMockData
      const { transactionsMockData } = require('../data/transactionsMockData');
      
      // Vérifier si les données ont le bon format et les convertir si nécessaire
      const formattedTransactions = transactionsMockData.map((transaction: any) => {
        // S'assurer que tous les champs requis sont présents
        return {
          id: transaction.id || generateUniqueId(),
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
          validatedAt: transaction.validatedAt,
          attachments: transaction.attachments || []
        };
      });
      
      // Stocker dans AsyncStorage
      await AsyncStorage.setItem('transactions', JSON.stringify(formattedTransactions));
      
      logger.info(`Mock transactions initialized successfully: ${formattedTransactions.length} transactions loaded`);
    } catch (error) {
      logger.error('Failed to initialize mock transactions', error);
      throw error;
    }
  }

  // SYSCOHADA Report Generation
  async generateSYSCOHADAReport(
    reportType: 'bilan' | 'compte_resultat' | 'balance' | 'tresorerie',
    startDate: Date,
    endDate: Date,
    companyName: string = 'Entreprise Demo'
  ): Promise<string> {
    try {
      // Préparer les données selon le type de rapport
      const accounts = await this.getAccounts();
      const transactions = await this.getTransactions(startDate, endDate, 'validated');
      
      let data;
      let title;
      let template;
      
      switch (reportType) {
        case 'bilan':
          data = prepareBilanData(accounts);
          title = 'Bilan Comptable SYSCOHADA';
          template = getBilanTemplate(data, companyName, startDate, endDate);
          break;
        case 'compte_resultat':
          data = prepareCompteResultatData(accounts);
          title = 'Compte de Résultat SYSCOHADA';
          template = getCompteResultatTemplate(data, companyName, startDate, endDate);
          break;
        case 'balance':
          data = prepareBalanceData(accounts, transactions);
          title = 'Balance des Comptes SYSCOHADA';
          template = getBalanceTemplate(data, companyName, startDate, endDate);
          break;
        case 'tresorerie':
          data = prepareTresorerieData(accounts, transactions);
          title = 'Tableau des Flux de Trésorerie SYSCOHADA';
          template = getTresorerieTemplate(data, companyName, startDate, endDate);
          break;
        default:
          throw new Error(`Type de rapport non pris en charge: ${reportType}`);
      }
      
      // Générer le PDF
      const { uri } = await Print.printToFileAsync({
        html: template,
        base64: false
      });
      
      // Sauvegarder dans les fichiers de l'application
      const fileName = `${reportType}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}reports/${fileName}`;
      
      // Créer le dossier des rapports s'il n'existe pas
      const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}reports/`);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}reports/`);
      }
      
      // Copier le fichier
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri
      });
      
      // Enregistrer une référence dans la base de données
      const db = await DatabaseService.getDatabase();
      
      // Utiliser executeQuery au lieu de transaction pour éviter l'erreur TypeScript
      await DatabaseService.executeQuery(
        db,
        `INSERT INTO accounting_reports (id, type, title, start_date, end_date, file_path, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          generateUniqueId(),
          reportType,
          title,
          startDate.toISOString(),
          endDate.toISOString(),
          fileUri,
          new Date().toISOString()
        ]
      );
      
      // Supprimer le fichier temporaire
      await FileSystem.deleteAsync(uri);
      
      return fileUri;
    } catch (error) {
      logger.error(`Échec de génération du rapport ${reportType}`, error);
      throw error;
    }
  }
  
  // Partager un rapport existant
  async shareReport(reportFilePath: string): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(reportFilePath);
      } else {
        logger.error('Le partage n\'est pas disponible sur cet appareil');
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      logger.error('Échec du partage du rapport', error);
      throw error;
    }
  }
  
  // Initialize with default chart of accounts for SYSCOHADA
  async initializeDefaultAccounts(): Promise<void> {
    try {
      const existingAccounts = await this.getAccounts();
      
      if (existingAccounts.length === 0) {
        // Based on SYSCOHADA chart of accounts
        const defaultAccounts: Omit<Account, 'id'>[] = [
          // Class 1: Capital accounts
          { number: '10100000', name: 'Capital social', type: 'equity', balance: 0, isActive: true },
          { number: '11000000', name: 'Report à nouveau', type: 'equity', balance: 0, isActive: true },
          { number: '12000000', name: 'Résultat de l\'exercice', type: 'equity', balance: 0, isActive: true },
          
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
  async createJournalEntry(journalEntry: JournalEntry): Promise<string> {
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
  async getAccounts(): Promise<Account[]> {
    try {
      const data = await AsyncStorage.getItem('accounts');
      const accounts = data ? JSON.parse(data) : [];
      
      return accounts.sort((a: Account, b: Account) => 
        a.number.localeCompare(b.number)
      );
    } catch (error) {
      logger.error('Failed to get accounts', error);
      throw error;
    }
  }
  
  async createAccount(account: Omit<Account, 'id'>): Promise<Account> {
    try {
      const newAccount: Account = {
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
