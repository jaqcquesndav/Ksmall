/**
 * Types relatifs à la comptabilité
 */

/**
 * Type représentant une transaction financière
 */
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  accountId: string;
  category?: string;
  type: 'income' | 'expense' | 'transfer';
  status: 'pending' | 'completed' | 'cancelled' | 'reconciled';
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type représentant un compte comptable
 */
export interface Account {
  id: string;
  number: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  description?: string;
  parentAccountId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type représentant une écriture au journal
 */
export interface JournalEntry {
  id: string;
  date: string;
  reference?: string;
  description: string;
  items: JournalEntryItem[];
  status: 'draft' | 'posted' | 'approved' | 'rejected';
  createdBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type représentant un élément d'écriture au journal
 */
export interface JournalEntryItem {
  id: string;
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
}

/**
 * Type représentant une écriture au grand livre
 */
export interface LedgerEntry {
  id: string;
  accountId: string;
  journalEntryId: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
}

/**
 * Type représentant un rapport financier
 */
export interface FinancialReport {
  id: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow';
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  data: {
    sections: ReportSection[];
    summary?: Record<string, number>;
  };
}

/**
 * Type représentant une section de rapport financier
 */
export interface ReportSection {
  title: string;
  items: ReportItem[];
  total: number;
  subsections?: ReportSection[];
}

/**
 * Type représentant un élément de rapport financier
 */
export interface ReportItem {
  name: string;
  value: number;
  accountId?: string;
  percentage?: number;
}