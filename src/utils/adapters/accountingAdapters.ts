/**
 * Adaptateurs pour convertir entre les types de service et les types de domaine pour la comptabilité
 */
import {
  Account,
  ServiceAccount,
  Transaction,
  ServiceTransaction,
  ServiceTransactionEntry,
  JournalEntry,
  ServiceJournalEntry,
  JournalEntryItem,
  FinancialReport,
  ServiceFinancialReport
} from '../../types/accounting';

/**
 * Convertit un compte du format service au format domaine
 */
export const serviceAccountToDomainAccount = (account: ServiceAccount): Account => {
  return {
    id: account.id,
    number: account.number,
    name: account.name,
    type: account.type,
    balance: account.balance,
    description: '',
    isActive: account.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Convertit un compte du format domaine au format service
 */
export const domainAccountToServiceAccount = (account: Account): ServiceAccount => {
  return {
    id: account.id,
    number: account.number,
    name: account.name,
    type: account.type,
    balance: account.balance,
    isActive: account.isActive
  };
};

/**
 * Convertit une transaction du format service au format domaine
 * Note: Ce convertisseur est simplifié car les structures sont très différentes
 * On utilise la première entrée comme référence pour l'accountId
 */
export const serviceTransactionToDomainTransaction = (transaction: ServiceTransaction): Transaction => {
  // Trouver le compte principal (si plusieurs entrées, prendre le premier compte débiteur)
  const principalAccount = transaction.entries.find(entry => entry.debit > 0)?.accountId || 
                           transaction.entries[0]?.accountId || '';
  
  return {
    id: transaction.id,
    date: transaction.date,
    amount: transaction.amount,
    description: transaction.description,
    accountId: principalAccount,
    category: '',
    type: determineTransactionType(transaction),
    status: mapTransactionStatus(transaction.status),
    reference: transaction.reference,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  };
};

/**
 * Détermine le type de transaction en fonction des entrées
 */
const determineTransactionType = (transaction: ServiceTransaction): 'income' | 'expense' | 'transfer' => {
  // Logique simplifiée - à adapter selon les besoins réels
  const hasRevenue = transaction.entries.some(entry => entry.accountId.startsWith('7'));
  const hasExpense = transaction.entries.some(entry => entry.accountId.startsWith('6'));
  
  if (hasRevenue && !hasExpense) return 'income';
  if (hasExpense && !hasRevenue) return 'expense';
  return 'transfer';
};

/**
 * Mappe le statut de transaction entre les formats
 */
const mapTransactionStatus = (status: 'pending' | 'validated' | 'canceled'): 'pending' | 'completed' | 'cancelled' | 'reconciled' => {
  switch (status) {
    case 'pending': return 'pending';
    case 'validated': return 'completed';
    case 'canceled': return 'cancelled';
    default: return 'pending';
  }
};

/**
 * Convertit une écriture de journal du format service au format domaine
 */
export const serviceJournalEntryToDomainJournalEntry = (entry: ServiceJournalEntry): JournalEntry => {
  return {
    id: `journal-${Date.now()}`, // Générer un ID temporaire
    date: entry.date,
    reference: entry.reference,
    description: entry.description,
    items: entry.entries.map(item => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      accountId: item.accountId,
      description: item.description,
      debit: item.debit,
      credit: item.credit
    })),
    status: mapJournalEntryStatus(entry.status),
    createdBy: entry.companyId || 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Mappe le statut d'écriture de journal
 */
const mapJournalEntryStatus = (status: string): 'draft' | 'posted' | 'approved' | 'rejected' => {
  switch (status.toLowerCase()) {
    case 'draft': return 'draft';
    case 'posted': case 'validated': return 'posted';
    case 'approved': return 'approved';
    case 'rejected': case 'canceled': return 'rejected';
    default: return 'draft';
  }
};

/**
 * Convertit une écriture de journal du format domaine au format service
 */
export const domainJournalEntryToServiceJournalEntry = (entry: JournalEntry): ServiceJournalEntry => {
  return {
    date: entry.date,
    reference: entry.reference || '',
    description: entry.description,
    entries: entry.items.map(item => ({
      accountId: item.accountId,
      accountName: '', // Nécessite une recherche de compte pour obtenir le nom
      debit: item.debit,
      credit: item.credit,
      description: item.description || ''
    })),
    status: reverseMapJournalEntryStatus(entry.status),
    total: calculateJournalEntryTotal(entry),
    attachments: [],
    companyId: entry.createdBy || 'system'
  };
};

/**
 * Mappe le statut d'écriture de journal en sens inverse
 */
const reverseMapJournalEntryStatus = (status: 'draft' | 'posted' | 'approved' | 'rejected'): string => {
  switch (status) {
    case 'draft': return 'draft';
    case 'posted': return 'validated';
    case 'approved': return 'approved';
    case 'rejected': return 'canceled';
    default: return 'draft';
  }
};

/**
 * Calcule le total d'une écriture de journal (somme des débits ou crédits)
 */
const calculateJournalEntryTotal = (entry: JournalEntry): number => {
  return entry.items.reduce((sum, item) => sum + item.debit, 0);
};

/**
 * Convertit un rapport financier du format service au format domaine
 */
export const serviceFinancialReportToDomainFinancialReport = (report: ServiceFinancialReport): FinancialReport => {
  return {
    id: report.id,
    type: mapReportType(report.type),
    title: report.title,
    startDate: report.startDate,
    endDate: report.endDate,
    createdAt: report.createdAt,
    data: {
      sections: [],  // Il faudrait transformer les données spécifiques au format attendu
      summary: {}
    }
  };
};

/**
 * Mappe le type de rapport
 */
const mapReportType = (type: string): 'balance_sheet' | 'income_statement' | 'cash_flow' => {
  switch (type) {
    case 'balance_sheet': case 'bilan': return 'balance_sheet';
    case 'income_statement': case 'compte_resultat': return 'income_statement';
    case 'cash_flow': case 'tresorerie': return 'cash_flow';
    default: return 'balance_sheet';
  }
};