// Mock data for testing accounting and inventory features

// Accounting mock data
export const accountingMockData = {
  // Chart of accounts
  chartOfAccounts: [
    { code: '1000', name: 'ACTIFS', type: 'header' },
    { code: '1100', name: 'Immobilisations', type: 'group' },
    { code: '1110', name: 'Terrain', type: 'account', balance: 50000 },
    { code: '1120', name: 'Bâtiments', type: 'account', balance: 150000 },
    { code: '1130', name: 'Matériel et équipement', type: 'account', balance: 75000 },
    { code: '1140', name: 'Véhicules', type: 'account', balance: 35000 },
    { code: '1200', name: 'Actifs courants', type: 'group' },
    { code: '1210', name: 'Caisse', type: 'account', balance: 5000 },
    { code: '1220', name: 'Banque', type: 'account', balance: 42000 },
    { code: '1230', name: 'Comptes clients', type: 'account', balance: 28000 },
    { code: '1240', name: 'Stocks', type: 'account', balance: 65000 },
    
    { code: '2000', name: 'PASSIFS', type: 'header' },
    { code: '2100', name: 'Passifs non courants', type: 'group' },
    { code: '2110', name: 'Prêts à long terme', type: 'account', balance: 120000 },
    { code: '2200', name: 'Passifs courants', type: 'group' },
    { code: '2210', name: 'Comptes fournisseurs', type: 'account', balance: 35000 },
    { code: '2220', name: 'Salaires à payer', type: 'account', balance: 12000 },
    { code: '2230', name: 'Taxes à payer', type: 'account', balance: 8000 },
    
    { code: '3000', name: 'CAPITAUX PROPRES', type: 'header' },
    { code: '3100', name: 'Capital social', type: 'account', balance: 100000 },
    { code: '3200', name: 'Bénéfices non répartis', type: 'account', balance: 175000 },
    
    { code: '4000', name: 'PRODUITS', type: 'header' },
    { code: '4100', name: 'Ventes', type: 'account', balance: 350000 },
    { code: '4200', name: 'Prestations de services', type: 'account', balance: 120000 },
    { code: '4300', name: 'Autres produits', type: 'account', balance: 18000 },
    
    { code: '5000', name: 'CHARGES', type: 'header' },
    { code: '5100', name: 'Coût des marchandises vendues', type: 'account', balance: 180000 },
    { code: '5200', name: 'Salaires', type: 'account', balance: 120000 },
    { code: '5300', name: 'Loyer', type: 'account', balance: 36000 },
    { code: '5400', name: 'Électricité et eau', type: 'account', balance: 12000 },
    { code: '5500', name: 'Téléphone et Internet', type: 'account', balance: 6000 },
    { code: '5600', name: 'Fournitures de bureau', type: 'account', balance: 3000 },
    { code: '5700', name: 'Carburant', type: 'account', balance: 9000 },
    { code: '5800', name: 'Maintenance et réparations', type: 'account', balance: 15000 },
    { code: '5900', name: 'Amortissements', type: 'account', balance: 45000 },
  ],
  
  // Journal entries
  journalEntries: [
    {
      id: 'je1',
      date: '2023-10-15',
      reference: 'JE-2023-001',
      description: 'Achat de fournitures',
      lines: [
        { accountCode: '5600', description: 'Fournitures de bureau', debit: 500, credit: 0, taxCode: 'TVA' },
        { accountCode: '2230', description: 'TVA déductible', debit: 95, credit: 0, taxCode: '' },
        { accountCode: '1220', description: 'Banque', debit: 0, credit: 595, taxCode: '' }
      ],
      status: 'validated'
    },
    {
      id: 'je2',
      date: '2023-10-18',
      reference: 'JE-2023-002',
      description: 'Vente de marchandises',
      lines: [
        { accountCode: '1230', description: 'Comptes clients', debit: 1190, credit: 0, taxCode: '' },
        { accountCode: '4100', description: 'Ventes', debit: 0, credit: 1000, taxCode: 'TVA' },
        { accountCode: '2230', description: 'TVA collectée', debit: 0, credit: 190, taxCode: '' }
      ],
      status: 'validated'
    },
    {
      id: 'je3',
      date: '2023-10-22',
      reference: 'JE-2023-003',
      description: 'Paiement de loyer',
      lines: [
        { accountCode: '5300', description: 'Loyer', debit: 3000, credit: 0, taxCode: '' },
        { accountCode: '1220', description: 'Banque', debit: 0, credit: 3000, taxCode: '' }
      ],
      status: 'validated'
    },
    {
      id: 'je4',
      date: '2023-10-25',
      reference: 'JE-2023-004',
      description: 'Paiement des salaires',
      lines: [
        { accountCode: '5200', description: 'Salaires', debit: 10000, credit: 0, taxCode: '' },
        { accountCode: '1220', description: 'Banque', debit: 0, credit: 10000, taxCode: '' }
      ],
      status: 'validated'
    },
    {
      id: 'je5',
      date: '2023-10-28',
      reference: 'JE-2023-005',
      description: 'Règlement fournisseur',
      lines: [
        { accountCode: '2210', description: 'Comptes fournisseurs', debit: 2500, credit: 0, taxCode: '' },
        { accountCode: '1220', description: 'Banque', debit: 0, credit: 2500, taxCode: '' }
      ],
      status: 'pending'
    }
  ],
  
  // Financial statements data
  financialStatements: {
    // Income statement data
    incomeStatement: {
      title: 'Compte de Résultat',
      startDate: '2023-01-01',
      endDate: '2023-10-31',
      revenue: {
        sales: 350000,
        services: 120000,
        otherIncome: 18000,
        totalRevenue: 488000
      },
      expenses: {
        costOfGoodsSold: 180000,
        salaries: 120000,
        rent: 36000,
        utilities: 12000,
        telecommunications: 6000,
        officeSupplies: 3000,
        fuel: 9000,
        maintenanceRepairs: 15000,
        depreciation: 45000,
        totalExpenses: 426000
      },
      grossProfit: 308000,
      operatingProfit: 62000,
      netProfit: 62000,
      taxRate: 0.30,
      taxAmount: 18600,
      netProfitAfterTax: 43400
    },
    
    // Balance sheet data
    balanceSheet: {
      title: 'Bilan',
      date: '2023-10-31',
      assets: {
        nonCurrentAssets: {
          land: 50000,
          buildings: 150000,
          equipmentAndMachinery: 75000,
          vehicles: 35000,
          accumulatedDepreciation: -45000,
          totalNonCurrentAssets: 265000
        },
        currentAssets: {
          cash: 5000,
          bank: 42000,
          accountsReceivable: 28000,
          inventory: 65000,
          totalCurrentAssets: 140000
        },
        totalAssets: 405000
      },
      liabilities: {
        nonCurrentLiabilities: {
          longTermLoans: 120000,
          totalNonCurrentLiabilities: 120000
        },
        currentLiabilities: {
          accountsPayable: 35000,
          wagesPayable: 12000,
          taxPayable: 8000,
          totalCurrentLiabilities: 55000
        },
        totalLiabilities: 175000
      },
      equity: {
        capitalStock: 100000,
        retainedEarnings: 130000,
        totalEquity: 230000
      },
      totalLiabilitiesAndEquity: 405000
    }
  }
};

// Inventory mock data
export const inventoryMockData = {
  // Products
  products: [
    {
      id: 'p1',
      sku: 'LP-001',
      name: 'Laptop HP 15',
      description: 'HP 15.6" Laptop, Intel Core i5, 8GB RAM, 256GB SSD',
      category: 'electronics',
      subcategory: 'computers',
      cost: 450,
      price: 799,
      quantity: 15,
      reorderPoint: 5,
      supplier: 'HP Congo',
      location: 'Warehouse A',
      imageUrl: null
    },
    {
      id: 'p2',
      sku: 'PH-001',
      name: 'Samsung Galaxy A53',
      description: 'Samsung Galaxy A53 5G, 128GB, 6GB RAM, Dual SIM',
      category: 'electronics',
      subcategory: 'phones',
      cost: 280,
      price: 399,
      quantity: 28,
      reorderPoint: 10,
      supplier: 'Samsung Electronics',
      location: 'Warehouse A',
      imageUrl: null
    },
    {
      id: 'p3',
      sku: 'TV-001',
      name: 'LG Smart TV 43"',
      description: 'LG 43" 4K UHD Smart TV with WebOS',
      category: 'electronics',
      subcategory: 'televisions',
      cost: 320,
      price: 499,
      quantity: 8,
      reorderPoint: 3,
      supplier: 'LG Electronics',
      location: 'Warehouse B',
      imageUrl: null
    },
    {
      id: 'p4',
      sku: 'PR-001',
      name: 'Epson L3210',
      description: 'Epson L3210 All-in-One Ink Tank Printer',
      category: 'electronics',
      subcategory: 'printers',
      cost: 180,
      price: 249,
      quantity: 12,
      reorderPoint: 4,
      supplier: 'Epson Africa',
      location: 'Warehouse A',
      imageUrl: null
    },
    {
      id: 'p5',
      sku: 'KB-001',
      name: 'Logitech K380',
      description: 'Logitech K380 Wireless Bluetooth Keyboard',
      category: 'electronics',
      subcategory: 'accessories',
      cost: 25,
      price: 49.99,
      quantity: 42,
      reorderPoint: 15,
      supplier: 'Logitech',
      location: 'Warehouse A',
      imageUrl: null
    },
    {
      id: 'p6',
      sku: 'MS-001',
      name: 'Logitech M185',
      description: 'Logitech M185 Wireless Mouse',
      category: 'electronics',
      subcategory: 'accessories',
      cost: 10,
      price: 19.99,
      quantity: 36,
      reorderPoint: 12,
      supplier: 'Logitech',
      location: 'Warehouse A',
      imageUrl: null
    },
    {
      id: 'p7',
      sku: 'TB-001',
      name: 'WD Elements 1TB',
      description: 'WD Elements 1TB USB 3.0 Portable Hard Drive',
      category: 'electronics',
      subcategory: 'storage',
      cost: 45,
      price: 69.99,
      quantity: 20,
      reorderPoint: 7,
      supplier: 'Western Digital',
      location: 'Warehouse B',
      imageUrl: null
    },
    {
      id: 'p8',
      sku: 'CM-001',
      name: 'Nescafé Gold',
      description: 'Nescafé Gold Instant Coffee, 200g',
      category: 'groceries',
      subcategory: 'beverages',
      cost: 5,
      price: 9.99,
      quantity: 48,
      reorderPoint: 20,
      supplier: 'Nestlé',
      location: 'Warehouse C',
      imageUrl: null
    },
    {
      id: 'p9',
      sku: 'NK-001',
      name: 'Nike Air Max',
      description: 'Nike Air Max Running Shoes, Size 42',
      category: 'apparel',
      subcategory: 'shoes',
      cost: 75,
      price: 129.99,
      quantity: 10,
      reorderPoint: 3,
      supplier: 'Nike Africa',
      location: 'Warehouse D',
      imageUrl: null
    },
    {
      id: 'p10',
      sku: 'BK-001',
      name: 'Business Management',
      description: 'Business Management for Entrepreneurs',
      category: 'books',
      subcategory: 'business',
      cost: 12,
      price: 24.99,
      quantity: 25,
      reorderPoint: 8,
      supplier: 'Pearson Education',
      location: 'Warehouse C',
      imageUrl: null
    }
  ],
  
  // Transactions
  transactions: [
    {
      id: 't1',
      type: 'purchase',
      date: '2023-10-05',
      reference: 'PO-2023-001',
      items: [
        { productId: 'p1', quantity: 5, unitCost: 450, totalCost: 2250 },
        { productId: 'p4', quantity: 3, unitCost: 180, totalCost: 540 }
      ],
      supplier: 'HP Congo',
      status: 'completed',
      notes: 'Regular purchase order',
      totalAmount: 2790
    },
    {
      id: 't2',
      type: 'sale',
      date: '2023-10-10',
      reference: 'SO-2023-001',
      items: [
        { productId: 'p1', quantity: 2, unitPrice: 799, totalPrice: 1598 },
        { productId: 'p5', quantity: 3, unitPrice: 49.99, totalPrice: 149.97 }
      ],
      customer: 'John Mbongo',
      status: 'completed',
      notes: 'Corporate sale',
      totalAmount: 1747.97
    },
    {
      id: 't3',
      type: 'adjustment',
      date: '2023-10-12',
      reference: 'ADJ-2023-001',
      items: [
        { productId: 'p3', quantity: -1, reason: 'Damaged unit' }
      ],
      status: 'completed',
      notes: 'Inventory adjustment due to damage',
      totalAmount: 0
    },
    {
      id: 't4',
      type: 'sale',
      date: '2023-10-15',
      reference: 'SO-2023-002',
      items: [
        { productId: 'p2', quantity: 5, unitPrice: 399, totalPrice: 1995 }
      ],
      customer: 'Marie Nkumba',
      status: 'completed',
      notes: 'Retail sale',
      totalAmount: 1995
    },
    {
      id: 't5',
      type: 'purchase',
      date: '2023-10-20',
      reference: 'PO-2023-002',
      items: [
        { productId: 'p5', quantity: 10, unitCost: 25, totalCost: 250 },
        { productId: 'p6', quantity: 10, unitCost: 10, totalCost: 100 }
      ],
      supplier: 'Logitech',
      status: 'completed',
      notes: 'Restocking accessories',
      totalAmount: 350
    }
  ],
  
  // Categories
  categories: [
    { id: 'c1', name: 'Electronics', subcategories: ['Computers', 'Phones', 'Televisions', 'Printers', 'Accessories', 'Storage'] },
    { id: 'c2', name: 'Groceries', subcategories: ['Beverages', 'Food', 'Snacks'] },
    { id: 'c3', name: 'Apparel', subcategories: ['Shoes', 'Clothing', 'Accessories'] },
    { id: 'c4', name: 'Books', subcategories: ['Business', 'Education', 'Fiction', 'Non-fiction'] }
  ],
  
  // Suppliers
  suppliers: [
    { id: 's1', name: 'HP Congo', contactPerson: 'Jean Lukusa', email: 'jean.lukusa@hpcongo.com', phone: '+243 123 4567', address: 'Kinshasa, DRC', paymentTerms: 'Net 30', productCategories: ['Computers', 'Printers'] },
    { id: 's2', name: 'Samsung Electronics', contactPerson: 'Sophie Mbala', email: 'sophie@samsung-africa.com', phone: '+243 234 5678', address: 'Kinshasa, DRC', paymentTerms: 'Net 45', productCategories: ['Phones', 'Televisions', 'Accessories'] },
    { id: 's3', name: 'LG Electronics', contactPerson: 'Pierre Masamba', email: 'pierre@lg-africa.com', phone: '+243 345 6789', address: 'Kinshasa, DRC', paymentTerms: 'Net 30', productCategories: ['Televisions', 'Accessories'] },
    { id: 's4', name: 'Epson Africa', contactPerson: 'Clarisse Diamba', email: 'clarisse@epson-africa.com', phone: '+243 456 7890', address: 'Kinshasa, DRC', paymentTerms: 'Net 30', productCategories: ['Printers'] },
    { id: 's5', name: 'Logitech', contactPerson: 'Emmanuel Lobe', email: 'emmanuel@logitech.com', phone: '+243 567 8901', address: 'Kinshasa, DRC', paymentTerms: 'Net 60', productCategories: ['Accessories'] },
    { id: 's6', name: 'Western Digital', contactPerson: 'Pauline Kande', email: 'pauline@wd.com', phone: '+243 678 9012', address: 'Kinshasa, DRC', paymentTerms: 'Net 45', productCategories: ['Storage'] },
    { id: 's7', name: 'Nestlé', contactPerson: 'Robert Mwamba', email: 'robert@nestle.com', phone: '+243 789 0123', address: 'Kinshasa, DRC', paymentTerms: 'Net 30', productCategories: ['Beverages', 'Food'] },
    { id: 's8', name: 'Nike Africa', contactPerson: 'Alice Samba', email: 'alice@nike-africa.com', phone: '+243 890 1234', address: 'Kinshasa, DRC', paymentTerms: 'Net 45', productCategories: ['Shoes', 'Clothing'] },
    { id: 's9', name: 'Pearson Education', contactPerson: 'David Kongo', email: 'david@pearson.com', phone: '+243 901 2345', address: 'Kinshasa, DRC', paymentTerms: 'Net 60', productCategories: ['Business', 'Education'] }
  ]
};
