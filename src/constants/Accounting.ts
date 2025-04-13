/**
 * SYSCOHADA accounting constants
 */

// SYSCOHADA Account Classes
export const ACCOUNT_CLASSES = {
  CLASS1: { id: 1, name: "Comptes de capitaux", accounts: [] },
  CLASS2: { id: 2, name: "Comptes d'immobilisations", accounts: [] },
  CLASS3: { id: 3, name: "Comptes de stocks", accounts: [] },
  CLASS4: { id: 4, name: "Comptes de tiers", accounts: [] },
  CLASS5: { id: 5, name: "Comptes de trésorerie", accounts: [] },
  CLASS6: { id: 6, name: "Comptes de charges", accounts: [] },
  CLASS7: { id: 7, name: "Comptes de produits", accounts: [] },
};

// Common account types
export const ACCOUNT_TYPES = {
  CASH: 'cash',
  BANK: 'bank',
  MOBILE_MONEY: 'mobile_money',
  CREDIT_CARD: 'credit_card',
  SAVINGS: 'savings',
  RECEIVABLE: 'receivable',
  PAYABLE: 'payable',
  REVENUE: 'revenue',
  EXPENSE: 'expense',
  ASSET: 'asset',
  LIABILITY: 'liability',
  EQUITY: 'equity',
};

// Journal types
export const JOURNAL_TYPES = {
  ALL: 'all',
  CASH: 'cash',
  SALES: 'sales',
  PURCHASES: 'purchases',
  BANK: 'bank',
  GENERAL: 'general',
};

// Entry statuses
export const ENTRY_STATUS = {
  PENDING: 'pending',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
};

// Financial report types
export const REPORT_TYPES = {
  BALANCE_SHEET: 'balance_sheet',
  INCOME_STATEMENT: 'income_statement',
  CASH_FLOW: 'cash_flow',
  TAX_DECLARATION: 'tax_declaration',
  TAFIRE: 'tafire', // Tableau Financier des Ressources et des Emplois
};
