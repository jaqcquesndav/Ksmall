export const accountingMockData = {
  journalEntries: [
    {
      id: '1',
      reference: 'JE-2023-001',
      date: '2023-04-15',
      description: 'Achat de matériel informatique',
      status: 'validated',
      lines: [
        {
          accountCode: '24000000',
          description: 'Matériel informatique',
          debit: 1200000,
          credit: 0
        },
        {
          accountCode: '52000000',
          description: 'Banque',
          debit: 0,
          credit: 1200000
        }
      ]
    },
    {
      id: '2',
      reference: 'JE-2023-002',
      date: '2023-04-10',
      description: 'Paiement de loyer',
      status: 'validated',
      lines: [
        {
          accountCode: '61300000',
          description: 'Loyers',
          debit: 450000,
          credit: 0
        },
        {
          accountCode: '52000000',
          description: 'Banque',
          debit: 0,
          credit: 450000
        }
      ]
    },
    {
      id: '3',
      reference: 'JE-2023-003',
      date: '2023-04-05',
      description: 'Vente de marchandises',
      status: 'validated',
      lines: [
        {
          accountCode: '41000000',
          description: 'Clients',
          debit: 1800000,
          credit: 0
        },
        {
          accountCode: '70000000',
          description: 'Ventes',
          debit: 0,
          credit: 1800000
        }
      ]
    },
    {
      id: '4',
      reference: 'JE-2023-004',
      date: '2023-04-01',
      description: 'Paiement de salaires',
      status: 'pending',
      lines: [
        {
          accountCode: '64000000',
          description: 'Charges de personnel',
          debit: 2500000,
          credit: 0
        },
        {
          accountCode: '52000000',
          description: 'Banque',
          debit: 0,
          credit: 2500000
        }
      ]
    }
  ],
  
  accounts: [
    {
      id: '1',
      code: '52000000',
      name: 'Banque',
      type: 'asset',
      balance: 3250000
    },
    {
      id: '2',
      code: '41000000',
      name: 'Clients',
      type: 'asset',
      balance: 1800000
    },
    {
      id: '3',
      code: '40000000',
      name: 'Fournisseurs',
      type: 'liability',
      balance: 750000
    }
  ]
};
