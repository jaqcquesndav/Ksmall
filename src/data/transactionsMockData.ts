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
  account?: string;
  relatedAccounts: {
    from?: string;
    to?: string;
  };
  // Ajout des champs pour les écritures comptables SYSCOHADA
  entries: JournalEntry[];
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  validatedBy?: string;
  validatedAt?: string;
}

export interface JournalEntry {
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export const transactionsMockData: Transaction[] = [
  {
    id: generateUniqueId(),
    date: '2025-04-14',
    amount: 3200000,
    type: 'income',
    category: 'Sales',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    reference: 'INV-2025-042',
    description: 'Payment from ABC Corporation - Contract renewal',
    account: '41000000',
    tags: ['major client', 'consulting'],
    relatedAccounts: {
      to: '512000'
    },
    entries: [
      {
        accountNumber: '512000',
        accountName: 'Banques locales',
        debit: 3200000,
        credit: 0,
        description: 'Encaissement facture client'
      },
      {
        accountNumber: '41000000',
        accountName: 'Clients ordinaires',
        debit: 0,
        credit: 3200000,
        description: 'Règlement facture ABC Corporation'
      }
    ],
    createdBy: 'Admin User',
    createdAt: '2025-04-14T10:30:00Z',
    updatedAt: '2025-04-14T10:30:00Z',
    validatedBy: 'Finance Manager',
    validatedAt: '2025-04-14T11:15:00Z'
  },
  {
    id: generateUniqueId(),
    date: '2025-04-12',
    amount: 850000,
    type: 'expense',
    category: 'Office Supplies',
    paymentMethod: 'Corporate Card',
    status: 'completed',
    reference: 'EXP-2025-105',
    description: 'Purchase of new office equipment',
    account: '40000000',
    relatedAccounts: {
      from: '512000'
    },
    entries: [
      {
        accountNumber: '60000000',
        accountName: 'Achats et variations de stocks',
        debit: 720339,
        credit: 0,
        description: 'Achat équipements bureau'
      },
      {
        accountNumber: '44560100',
        accountName: 'TVA récupérable sur autres B&S',
        debit: 129661,
        credit: 0,
        description: 'TVA sur achat équipements'
      },
      {
        accountNumber: '512000',
        accountName: 'Banques locales',
        debit: 0,
        credit: 850000,
        description: 'Paiement fournisseur'
      }
    ],
    createdBy: 'Admin User',
    createdAt: '2025-04-12T14:45:00Z',
    updatedAt: '2025-04-12T14:45:00Z',
    validatedBy: 'Finance Manager',
    validatedAt: '2025-04-12T16:20:00Z'
  },
  {
    id: generateUniqueId(),
    date: '2025-04-10',
    amount: 2100000,
    type: 'expense',
    category: 'Salaries',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    reference: 'SAL-APR-2025',
    description: 'Monthly salary payments',
    account: '52000000',
    relatedAccounts: {
      from: '512000'
    },
    entries: [
      {
        accountNumber: '66100000',
        accountName: 'Rémunérations directes versées au personnel national',
        debit: 2100000,
        credit: 0,
        description: 'Salaires du personnel'
      },
      {
        accountNumber: '512000',
        accountName: 'Banques locales',
        debit: 0,
        credit: 2100000,
        description: 'Paiement des salaires'
      }
    ],
    createdBy: 'HR Manager',
    createdAt: '2025-04-10T09:00:00Z',
    updatedAt: '2025-04-10T09:00:00Z',
    validatedBy: 'Finance Manager',
    validatedAt: '2025-04-10T10:30:00Z'
  },
  {
    id: generateUniqueId(),
    date: '2025-04-08',
    amount: 1500000,
    type: 'income',
    category: 'Sales',
    paymentMethod: 'Mobile Money',
    status: 'completed',
    reference: 'INV-2025-039',
    description: 'Payment from XYZ Ltd for consulting services',
    account: '41000000',
    tags: ['consulting'],
    relatedAccounts: {
      to: '512000'
    },
    entries: [
      {
        accountNumber: '518000',
        accountName: 'Virements Mobile Money',
        debit: 1500000,
        credit: 0,
        description: 'Encaissement par Mobile Money'
      },
      {
        accountNumber: '41000000',
        accountName: 'Clients ordinaires',
        debit: 0,
        credit: 1500000,
        description: 'Règlement facture XYZ Ltd'
      }
    ],
    createdBy: 'Sales Rep',
    createdAt: '2025-04-08T11:30:00Z',
    updatedAt: '2025-04-08T11:30:00Z',
    validatedBy: 'Finance Manager',
    validatedAt: '2025-04-08T13:45:00Z'
  },
  {
    id: generateUniqueId(),
    date: '2025-04-05',
    amount: 450000,
    type: 'expense',
    category: 'Rent',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    reference: 'RENT-APR-2025',
    description: 'Monthly office rent payment',
    account: '52000000',
    relatedAccounts: {
      from: '512000'
    },
    entries: [
      {
        accountNumber: '62600000',
        accountName: 'Loyers et charges locatives',
        debit: 450000,
        credit: 0,
        description: 'Loyer mensuel bureaux'
      },
      {
        accountNumber: '512000',
        accountName: 'Banques locales',
        debit: 0,
        credit: 450000,
        description: 'Paiement loyer'
      }
    ],
    createdBy: 'Admin User',
    createdAt: '2025-04-05T15:20:00Z',
    updatedAt: '2025-04-05T15:20:00Z',
    validatedBy: 'Finance Manager',
    validatedAt: '2025-04-05T16:10:00Z'
  },
  {
    id: generateUniqueId(),
    date: '2025-04-03',
    amount: 780000,
    type: 'income',
    category: 'Software Sales',
    paymentMethod: 'Credit Card',
    status: 'completed',
    reference: 'INV-2025-040',
    description: 'Payment for software license - Digicom',
    account: '41000000',
    relatedAccounts: {
      to: '512000'
    },
    entries: [
      {
        accountNumber: '512000',
        accountName: 'Banques locales',
        debit: 780000,
        credit: 0,
        description: 'Encaissement par carte de crédit'
      },
      {
        accountNumber: '41000000',
        accountName: 'Clients ordinaires',
        debit: 0,
        credit: 780000,
        description: 'Règlement facture Digicom'
      }
    ],
    createdBy: 'Sales Manager',
    createdAt: '2025-04-03T09:15:00Z',
    updatedAt: '2025-04-03T09:15:00Z',
    validatedBy: 'Finance Manager',
    validatedAt: '2025-04-03T10:25:00Z'
  },
  {
    id: generateUniqueId(),
    date: '2025-04-01',
    amount: 180000,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'Direct Debit',
    status: 'completed',
    reference: 'UTIL-APR-2025',
    description: 'Electricity and water bills',
    account: '52000000',
    relatedAccounts: {
      from: '512000'
    },
    entries: [
      {
        accountNumber: '62100000',
        accountName: 'Eau, électricité et gaz',
        debit: 180000,
        credit: 0,
        description: 'Factures eau et électricité'
      },
      {
        accountNumber: '512000',
        accountName: 'Banques locales',
        debit: 0,
        credit: 180000,
        description: 'Prélèvement automatique'
      }
    ],
    createdBy: 'Admin User',
    createdAt: '2025-04-01T08:30:00Z',
    updatedAt: '2025-04-01T08:30:00Z',
    validatedBy: 'Finance Manager',
    validatedAt: '2025-04-01T09:45:00Z'
  },
  {
    id: generateUniqueId(),
    date: '2025-03-28',
    amount: 950000,
    type: 'income',
    category: 'Consulting',
    paymentMethod: 'Check',
    status: 'completed',
    reference: 'INV-2025-037',
    description: 'Strategic consulting for DEF Partners',
    account: '41000000',
    tags: ['consulting', 'strategy'],
    relatedAccounts: {
      to: '512000'
    },
    entries: [
      {
        accountNumber: '512000',
        accountName: 'Banques locales',
        debit: 950000,
        credit: 0,
        description: 'Encaissement par chèque'
      },
      {
        accountNumber: '41000000',
        accountName: 'Clients ordinaires',
        debit: 0,
        credit: 950000,
        description: 'Règlement facture DEF Partners'
      }
    ],
    createdBy: 'Accounting Clerk',
    createdAt: '2025-03-28T14:20:00Z',
    updatedAt: '2025-03-28T14:20:00Z',
    validatedBy: 'Finance Manager',
    validatedAt: '2025-03-28T16:30:00Z'
  },
  {
    id: generateUniqueId(),
    date: '2025-04-15',
    amount: 520000,
    type: 'expense',
    category: 'Marketing',
    paymentMethod: 'Corporate Card',
    status: 'pending',
    reference: 'MKT-2025-022',
    description: 'Digital marketing campaign Q2-2025',
    account: '40000000',
    relatedAccounts: {
      from: '512000'
    },
    entries: [
      {
        accountNumber: '62300000',
        accountName: 'Publicité, publications, relations publiques',
        debit: 520000,
        credit: 0,
        description: 'Campagne marketing digital Q2'
      },
      {
        accountNumber: '512000',
        accountName: 'Banques locales',
        debit: 0,
        credit: 520000,
        description: 'Paiement prestataire marketing'
      }
    ],
    createdBy: 'Marketing Manager',
    createdAt: '2025-04-15T08:45:00Z',
    updatedAt: '2025-04-15T08:45:00Z'
  },
  {
    id: generateUniqueId(),
    date: '2025-04-02',
    amount: 1500000,
    type: 'transfer',
    category: 'Internal Transfer',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    reference: 'TRF-2025-008',
    description: 'Transfer between main account and investment account',
    account: '52000000',
    relatedAccounts: {
      from: '512000',
      to: '512100'
    },
    entries: [
      {
        accountNumber: '512100',
        accountName: 'Banques locales - Compte d\'investissement',
        debit: 1500000,
        credit: 0,
        description: 'Transfert pour placement'
      },
      {
        accountNumber: '512000',
        accountName: 'Banques locales - Compte principal',
        debit: 0,
        credit: 1500000,
        description: 'Transfert vers compte d\'investissement'
      }
    ],
    createdBy: 'Finance Director',
    createdAt: '2025-04-02T10:00:00Z',
    updatedAt: '2025-04-02T10:00:00Z',
    validatedBy: 'Finance Director',
    validatedAt: '2025-04-02T10:05:00Z'
  }
];

// Fonctions utilitaires pour la manipulation des transactions
export const getRecentTransactions = (count: number = 5): Transaction[] => {
  return [...transactionsMockData]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
};

// Fonction pour obtenir les transactions récentes au format attendu par le DashboardService
// Filtre uniquement les transactions liées à la trésorerie (comptes de classe 5 en SYSCOHADA)
export const getRecentTransactionsForDashboard = (count: number = 5) => {
  const allTransactions = [...transactionsMockData]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Filtrer les transactions qui impliquent un compte de trésorerie (classe 5)
  const treasuryTransactions = allTransactions.filter(transaction => {
    return transaction.entries.some(entry => 
      entry.accountNumber.startsWith('5') || // Tous les comptes de classe 5 (trésorerie)
      (entry.accountNumber.startsWith('52') || entry.accountNumber.startsWith('51')) // Pour être sûr d'inclure les sous-comptes
    );
  });
  
  return treasuryTransactions.slice(0, count).map(transaction => {
    // Trouver l'écriture spécifique de trésorerie
    const treasuryEntry = transaction.entries.find(entry => 
      entry.accountNumber.startsWith('5')
    );
    
    // Calculer le montant correct (positif pour les débits, négatif pour les crédits)
    const amount = treasuryEntry 
      ? treasuryEntry.debit > 0 
        ? treasuryEntry.debit 
        : -treasuryEntry.credit
      : transaction.type === 'expense' ? -transaction.amount : transaction.amount;
    
    // Créer l'objet avec le bon format pour RecentTransactionsWidget
    return {
      id: transaction.id,
      date: new Date(transaction.date), // Convertir explicitement en objet Date
      reference: transaction.reference,
      description: transaction.description,
      amount: amount,
      status: transaction.status === 'completed' ? 'posted' : 
              transaction.status === 'pending' ? 'pending' : 'canceled',
      account: treasuryEntry ? treasuryEntry.accountNumber : transaction.account || ''
    };
  });
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
