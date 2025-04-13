import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUniqueId } from '../utils/helpers';
import logger from '../utils/logger';

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
  
  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const transactions = await this.getTransactions();
      return transactions.find(t => t.id === id) || null;
    } catch (error) {
      logger.error(`Failed to get transaction ${id}`, error);
      throw error;
    }
  }
  
  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const now = new Date().toISOString();
      const newTransaction: Transaction = {
        ...transaction,
        id: generateUniqueId(),
        createdAt: now,
        updatedAt: now,
      };
      
      const transactions = await this.getTransactions();
      transactions.push(newTransaction);
      
      await AsyncStorage.setItem('transactions', JSON.stringify(transactions));
      
      // Update account balances
      await this.updateAccountBalances(newTransaction);
      
      return newTransaction;
    } catch (error) {
      logger.error('Failed to create transaction', error);
      throw error;
    }
  }
  
  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const transactions = await this.getTransactions();
      const index = transactions.findIndex(t => t.id === transaction.id);
      
      if (index === -1) {
        throw new Error(`Transaction ${transaction.id} not found`);
      }
      
      const updatedTransaction = {
        ...transaction,
        updatedAt: new Date().toISOString()
      };
      
      transactions[index] = updatedTransaction;
      await AsyncStorage.setItem('transactions', JSON.stringify(transactions));
      
      return updatedTransaction;
    } catch (error) {
      logger.error(`Failed to update transaction ${transaction.id}`, error);
      throw error;
    }
  }
  
  async deleteTransaction(id: string): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const filteredTransactions = transactions.filter(t => t.id !== id);
      
      await AsyncStorage.setItem('transactions', JSON.stringify(filteredTransactions));
    } catch (error) {
      logger.error(`Failed to delete transaction ${id}`, error);
      throw error;
    }
  }
  
  // Accounts
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
  
  async updateAccount(account: Account): Promise<Account> {
    try {
      const accounts = await this.getAccounts();
      const index = accounts.findIndex(a => a.id === account.id);
      
      if (index === -1) {
        throw new Error(`Account ${account.id} not found`);
      }
      
      accounts[index] = account;
      await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
      
      return account;
    } catch (error) {
      logger.error(`Failed to update account ${account.id}`, error);
      throw error;
    }
  }
  
  async updateAccountBalances(transaction: Transaction): Promise<void> {
    try {
      const accounts = await this.getAccounts();
      
      // Update each account involved in the transaction
      for (const entry of transaction.entries) {
        const accountIndex = accounts.findIndex(a => a.id === entry.accountId);
        
        if (accountIndex !== -1) {
          const account = accounts[accountIndex];
          const isAssetOrExpense = ['asset', 'expense'].includes(account.type);
          
          // Apply debits and credits according to accounting rules
          if (isAssetOrExpense) {
            account.balance += entry.debit - entry.credit;
          } else {
            account.balance += entry.credit - entry.debit;
          }
          
          accounts[accountIndex] = account;
        }
      }
      
      await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
    } catch (error) {
      logger.error(`Failed to update account balances for transaction ${transaction.id}`, error);
      throw error;
    }
  }
  
  // Financial Reports
  async generateFinancialReport(
    type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance',
    startDate: Date,
    endDate: Date
  ): Promise<FinancialReport> {
    try {
      const accounts = await this.getAccounts();
      const transactions = await this.getTransactions(startDate, endDate, 'validated');
      
      // Generate the appropriate report based on type
      let reportData;
      
      switch (type) {
        case 'balance_sheet':
          reportData = await this.generateBalanceSheet(accounts, transactions);
          break;
        case 'income_statement':
          reportData = await this.generateIncomeStatement(accounts, transactions);
          break;
        case 'cash_flow':
          reportData = await this.generateCashFlow(accounts, transactions);
          break;
        case 'trial_balance':
          reportData = await this.generateTrialBalance(accounts);
          break;
        default:
          throw new Error(`Invalid report type: ${type}`);
      }
      
      const report: FinancialReport = {
        id: generateUniqueId(),
        type,
        title: this.getReportTitle(type),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: new Date().toISOString(),
        data: reportData
      };
      
      // Save the report
      const reports = await this.getSavedReports();
      reports.push(report);
      await AsyncStorage.setItem('financialReports', JSON.stringify(reports));
      
      return report;
    } catch (error) {
      logger.error(`Failed to generate ${type} report`, error);
      throw error;
    }
  }
  
  private async generateBalanceSheet(accounts: Account[], transactions: Transaction[]): Promise<any> {
    // Implement balance sheet generation logic
    // Group accounts by type and calculate totals
    const assets = accounts.filter(a => a.type === 'asset');
    const liabilities = accounts.filter(a => a.type === 'liability');
    const equity = accounts.filter(a => a.type === 'equity');
    
    const totalAssets = assets.reduce((sum, account) => sum + account.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, account) => sum + account.balance, 0);
    const totalEquity = equity.reduce((sum, account) => sum + account.balance, 0);
    
    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity
    };
  }
  
  private async generateIncomeStatement(accounts: Account[], transactions: Transaction[]): Promise<any> {
    // Implement income statement generation logic
    const revenues = accounts.filter(a => a.type === 'revenue');
    const expenses = accounts.filter(a => a.type === 'expense');
    
    const totalRevenue = revenues.reduce((sum, account) => sum + account.balance, 0);
    const totalExpenses = expenses.reduce((sum, account) => sum + account.balance, 0);
    const netIncome = totalRevenue - totalExpenses;
    
    return {
      revenues,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome
    };
  }
  
  private async generateCashFlow(accounts: Account[], transactions: Transaction[]): Promise<any> {
    // Implement cash flow statement logic
    // This is a simplified version
    const cashAccounts = accounts.filter(a => a.type === 'asset' && a.number.startsWith('5'));
    
    const operatingTransactions = transactions.filter(t => {
      // Identify transactions related to operating activities
      return t.entries.some(e => {
        const account = accounts.find(a => a.id === e.accountId);
        return account && ['revenue', 'expense'].includes(account.type);
      });
    });
    
    const investingTransactions = transactions.filter(t => {
      // Identify transactions related to investing activities
      return t.entries.some(e => {
        const account = accounts.find(a => a.id === e.accountId);
        return account && account.type === 'asset' && !account.number.startsWith('5');
      });
    });
    
    const financingTransactions = transactions.filter(t => {
      // Identify transactions related to financing activities
      return t.entries.some(e => {
        const account = accounts.find(a => a.id === e.accountId);
        return account && ['liability', 'equity'].includes(account.type);
      });
    });
    
    return {
      operatingCashFlow: this.calculateNetCashFlow(operatingTransactions, cashAccounts),
      investingCashFlow: this.calculateNetCashFlow(investingTransactions, cashAccounts),
      financingCashFlow: this.calculateNetCashFlow(financingTransactions, cashAccounts),
      cashAccounts
    };
  }
  
  private calculateNetCashFlow(transactions: Transaction[], cashAccounts: Account[]): number {
    let netCashFlow = 0;
    
    for (const transaction of transactions) {
      for (const entry of transaction.entries) {
        if (cashAccounts.some(a => a.id === entry.accountId)) {
          netCashFlow += entry.debit - entry.credit;
        }
      }
    }
    
    return netCashFlow;
  }
  
  private async generateTrialBalance(accounts: Account[]): Promise<any> {
    // Generate trial balance
    let totalDebit = 0;
    let totalCredit = 0;
    
    const accountsWithBalances = accounts.map(account => {
      const isAssetOrExpense = ['asset', 'expense'].includes(account.type);
      const debit = isAssetOrExpense && account.balance > 0 ? account.balance : 0;
      const credit = !isAssetOrExpense && account.balance > 0 ? account.balance : 0;
      
      totalDebit += debit;
      totalCredit += credit;
      
      return {
        ...account,
        debit,
        credit
      };
    });
    
    return {
      accounts: accountsWithBalances,
      totalDebit,
      totalCredit
    };
  }
  
  private getReportTitle(type: string): string {
    switch(type) {
      case 'balance_sheet': return 'Bilan Comptable';
      case 'income_statement': return 'Compte de Résultat';
      case 'cash_flow': return 'Tableau des Flux de Trésorerie';
      case 'trial_balance': return 'Balance des Comptes';
      default: return 'Rapport Financier';
    }
  }
  
  async getSavedReports(): Promise<FinancialReport[]> {
    try {
      const data = await AsyncStorage.getItem('financialReports');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Failed to get saved reports', error);
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
}

export default new AccountingService();
