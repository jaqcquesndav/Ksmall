import { generateUniqueId } from '../utils/helpers';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'cancelled';
  reference: string;
  description: string;
  attachments?: string[];
  tags?: string[];
  relatedAccounts: {
    from?: string;
    to?: string;
  };
}

export const transactionsMockData: Transaction[] = [
  {
    id: generateUniqueId(),
    date: '2023-04-15',
    amount: 2500000,
    type: 'income',
    category: 'Sales',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    reference: 'INV-2023-042',
    description: 'Payment from ABC Corporation for services rendered',
    tags: ['major client', 'consulting'],
    relatedAccounts: {
      to: '512000'
    }
  },
  {
    id: generateUniqueId(),
    date: '2023-04-12',
    amount: 750000,
    type: 'expense',
    category: 'Office Supplies',
    paymentMethod: 'Corporate Card',
    status: 'completed',
    reference: 'EXP-2023-105',
    description: 'Purchase of office equipment and supplies',
    relatedAccounts: {
      from: '512000'
    }
  },
  {
    id: generateUniqueId(),
    date: '2023-04-10',
    amount: 1800000,
    type: 'expense',
    category: 'Salaries',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    reference: 'SAL-APR-2023',
    description: 'Monthly salary payments',
    relatedAccounts: {
      from: '512000'
    }
  },
  {
    id: generateUniqueId(),
    date: '2023-04-05',
    amount: 1200000,
    type: 'income',
    category: 'Sales',
    paymentMethod: 'Mobile Money',
    status: 'completed',
    reference: 'INV-2023-039',
    description: 'Payment from XYZ Ltd for consulting services',
    tags: ['consulting'],
    relatedAccounts: {
      to: '512000'
    }
  },
  {
    id: generateUniqueId(),
    date: '2023-04-01',
    amount: 350000,
    type: 'expense',
    category: 'Rent',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    reference: 'RENT-APR-2023',
    description: 'Monthly office rent payment',
    relatedAccounts: {
      from: '512000'
    }
  },
  {
    id: generateUniqueId(),
    date: '2023-03-28',
    amount: 180000,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'Direct Debit',
    status: 'completed',
    reference: 'UTIL-MAR-2023',
    description: 'Electricity and water bills',
    relatedAccounts: {
      from: '512000'
    }
  },
  {
    id: generateUniqueId(),
    date: '2023-03-25',
    amount: 950000,
    type: 'income',
    category: 'Consulting',
    paymentMethod: 'Check',
    status: 'completed',
    reference: 'INV-2023-037',
    description: 'Strategic consulting for DEF Partners',
    tags: ['consulting', 'strategy'],
    relatedAccounts: {
      to: '512000'
    }
  },
  {
    id: generateUniqueId(),
    date: '2023-05-01',
    amount: 450000,
    type: 'expense',
    category: 'Marketing',
    paymentMethod: 'Corporate Card',
    status: 'pending',
    reference: 'MKT-2023-022',
    description: 'Digital marketing campaign',
    relatedAccounts: {
      from: '512000'
    }
  },
  {
    id: generateUniqueId(),
    date: '2023-05-03',
    amount: 1500000,
    type: 'transfer',
    category: 'Internal Transfer',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    reference: 'TRF-2023-008',
    description: 'Transfer between main account and investment account',
    relatedAccounts: {
      from: '512000',
      to: '512100'
    }
  }
];

// Fonctions utilitaires pour la manipulation des transactions
export const getRecentTransactions = (count: number = 5): Transaction[] => {
  return [...transactionsMockData]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
};

export const getTransactionsByType = (type: 'income' | 'expense' | 'transfer'): Transaction[] => {
  return transactionsMockData.filter(transaction => transaction.type === type);
};

export const getTransactionById = (id: string): Transaction | undefined => {
  return transactionsMockData.find(transaction => transaction.id === id);
};

export const getTotalByType = (type: 'income' | 'expense'): number => {
  return transactionsMockData
    .filter(transaction => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
};
