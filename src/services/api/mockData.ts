import { CHAT_MODES } from '../../components/chat/ModeSelector';
import { generateUniqueId } from '../../utils/helpers';

/**
 * Données mock pour le développement et les tests hors ligne
 */
const mockData = {
  /**
   * Données simulées pour l'authentification
   */
  auth: {
    loginResponse: {
      user: {
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'Utilisateur Test',
        phoneNumber: '+33612345678',
        emailVerified: true,
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-04-01T14:22:00Z'
      },
      token: 'mock_token_123456789',
      refreshToken: 'mock_refresh_token_123456789',
      expiresAt: new Date().getTime() + 3600000 // 1 heure dans le futur
    }
  },

  /**
   * Données simulées pour la comptabilité
   */
  accounting: {
    transactions: [
      {
        id: 'tx-1',
        reference: 'FACT-2025-001',
        description: 'Vente de marchandises',
        date: '2025-04-15',
        amount: 1500.00,
        type: 'sale',
        status: 'completed',
        customer: 'Client A',
        createdAt: '2025-04-15T09:30:00Z',
        updatedAt: '2025-04-15T09:30:00Z'
      },
      {
        id: 'tx-2',
        reference: 'ACHAT-2025-001',
        description: 'Achat de fournitures',
        date: '2025-04-10',
        amount: 350.00,
        type: 'purchase',
        status: 'completed',
        supplier: 'Fournisseur B',
        createdAt: '2025-04-10T14:15:00Z',
        updatedAt: '2025-04-10T14:15:00Z'
      },
      {
        id: 'tx-3',
        reference: 'SAL-2025-004',
        description: 'Salaires Avril 2025',
        date: '2025-04-25',
        amount: 2800.00,
        type: 'expense',
        status: 'pending',
        category: 'Salaires',
        createdAt: '2025-04-23T16:45:00Z',
        updatedAt: '2025-04-23T16:45:00Z'
      }
    ],
    accounts: [
      {
        id: 'acc-1',
        code: '512',
        name: 'Banque',
        type: 'asset',
        balance: 12500.00,
        parentId: null,
        isActive: true
      },
      {
        id: 'acc-2',
        code: '401',
        name: 'Fournisseurs',
        type: 'liability',
        balance: 1850.00,
        parentId: null,
        isActive: true
      },
      {
        id: 'acc-3',
        code: '701',
        name: 'Ventes de produits',
        type: 'revenue',
        balance: 15000.00,
        parentId: null,
        isActive: true
      },
      {
        id: 'acc-4',
        code: '607',
        name: 'Achats de marchandises',
        type: 'expense',
        balance: 5000.00,
        parentId: null,
        isActive: true
      }
    ],
    financialReportData: {
      balanceSheet: {
        assets: [
          { name: 'Actifs immobilisés', amount: 15000 },
          { name: 'Stocks', amount: 8000 },
          { name: 'Créances clients', amount: 6000 },
          { name: 'Disponibilités', amount: 12500 }
        ],
        liabilities: [
          { name: 'Capital', amount: 30000 },
          { name: 'Dettes fournisseurs', amount: 1850 },
          { name: 'Emprunts', amount: 7000 },
          { name: 'Résultat de l\'exercice', amount: 2650 }
        ],
        totalAssets: 41500,
        totalLiabilities: 41500
      },
      incomeStatement: {
        revenues: [
          { name: 'Ventes de produits', amount: 15000 },
          { name: 'Prestations de services', amount: 5000 }
        ],
        expenses: [
          { name: 'Achats de marchandises', amount: 5000 },
          { name: 'Salaires', amount: 8000 },
          { name: 'Charges externes', amount: 2200 },
          { name: 'Amortissements', amount: 1500 },
          { name: 'Impôts', amount: 650 }
        ],
        totalRevenues: 20000,
        totalExpenses: 17350,
        netIncome: 2650
      }
    },
    ledgerEntries: [
      {
        id: 'le-1',
        date: '2025-04-15',
        journalEntryId: 'je-1',
        accountId: 'acc-1',
        accountCode: '512',
        accountName: 'Banque',
        debit: 1500.00,
        credit: 0,
        description: 'Vente de marchandises',
        reference: 'FACT-2025-001'
      },
      {
        id: 'le-2',
        date: '2025-04-15',
        journalEntryId: 'je-1',
        accountId: 'acc-3',
        accountCode: '701',
        accountName: 'Ventes de produits',
        debit: 0,
        credit: 1500.00,
        description: 'Vente de marchandises',
        reference: 'FACT-2025-001'
      },
      {
        id: 'le-3',
        date: '2025-04-10',
        journalEntryId: 'je-2',
        accountId: 'acc-4',
        accountCode: '607',
        accountName: 'Achats de marchandises',
        debit: 350.00,
        credit: 0,
        description: 'Achat de fournitures',
        reference: 'ACHAT-2025-001'
      },
      {
        id: 'le-4',
        date: '2025-04-10',
        journalEntryId: 'je-2',
        accountId: 'acc-2',
        accountCode: '401',
        accountName: 'Fournisseurs',
        debit: 0,
        credit: 350.00,
        description: 'Achat de fournitures',
        reference: 'ACHAT-2025-001'
      }
    ],
    journalEntries: [
      {
        id: 'je-1',
        date: '2025-04-15',
        reference: 'FACT-2025-001',
        description: 'Vente de marchandises',
        entries: [
          { accountId: 'acc-1', debit: 1500.00, credit: 0 },
          { accountId: 'acc-3', debit: 0, credit: 1500.00 }
        ],
        totalDebit: 1500.00,
        totalCredit: 1500.00,
        createdAt: '2025-04-15T09:30:00Z',
        updatedAt: '2025-04-15T09:30:00Z'
      },
      {
        id: 'je-2',
        date: '2025-04-10',
        reference: 'ACHAT-2025-001',
        description: 'Achat de fournitures',
        entries: [
          { accountId: 'acc-4', debit: 350.00, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 350.00 }
        ],
        totalDebit: 350.00,
        totalCredit: 350.00,
        createdAt: '2025-04-10T14:15:00Z',
        updatedAt: '2025-04-10T14:15:00Z'
      }
    ]
  },

  /**
   * Données simulées pour l'inventaire
   */
  inventory: {
    products: [
      {
        id: 'prod-1',
        name: 'Ordinateur portable',
        sku: 'LAPTOP-001',
        description: 'Ordinateur portable 15 pouces',
        category: 'Électronique',
        price: 899.99,
        costPrice: 650.00,
        quantity: 15,
        unit: 'pcs',
        imageUrl: 'https://example.com/images/laptop.jpg',
        barcode: '1234567890123',
        createdAt: '2025-01-10T08:15:00Z',
        updatedAt: '2025-04-05T11:20:00Z'
      },
      {
        id: 'prod-2',
        name: 'Smartphone',
        sku: 'PHONE-001',
        description: 'Smartphone dernière génération',
        category: 'Électronique',
        price: 599.99,
        costPrice: 400.00,
        quantity: 20,
        unit: 'pcs',
        imageUrl: 'https://example.com/images/smartphone.jpg',
        barcode: '2345678901234',
        createdAt: '2025-01-15T09:30:00Z',
        updatedAt: '2025-04-10T14:45:00Z'
      },
      {
        id: 'prod-3',
        name: 'Bureau',
        sku: 'DESK-001',
        description: 'Bureau moderne 120x80cm',
        category: 'Mobilier',
        price: 249.99,
        costPrice: 150.00,
        quantity: 8,
        unit: 'pcs',
        imageUrl: 'https://example.com/images/desk.jpg',
        barcode: '3456789012345',
        createdAt: '2025-02-05T10:45:00Z',
        updatedAt: '2025-03-20T15:30:00Z'
      }
    ],
    categories: [
      {
        id: 'cat-1',
        name: 'Électronique',
        description: 'Produits électroniques',
        productsCount: 2
      },
      {
        id: 'cat-2',
        name: 'Mobilier',
        description: 'Mobilier de bureau',
        productsCount: 1
      },
      {
        id: 'cat-3',
        name: 'Fournitures',
        description: 'Fournitures de bureau',
        productsCount: 0
      }
    ],
    operations: [
      {
        id: 'op-1',
        type: 'receipt',
        reference: 'RECPT-2025-001',
        date: '2025-04-05',
        description: 'Réception de stock',
        items: [
          {
            id: 'op-item-1',
            productId: 'prod-1',
            productName: 'Ordinateur portable',
            quantity: 5,
            unitPrice: 650.00,
            amount: 3250.00
          },
          {
            id: 'op-item-2',
            productId: 'prod-2',
            productName: 'Smartphone',
            quantity: 10,
            unitPrice: 400.00,
            amount: 4000.00
          }
        ],
        status: 'confirmed',
        totalAmount: 7250.00,
        createdAt: '2025-04-05T10:15:00Z',
        updatedAt: '2025-04-05T10:30:00Z',
        createdBy: 'user-1'
      },
      {
        id: 'op-2',
        type: 'issue',
        reference: 'ISSUE-2025-001',
        date: '2025-04-15',
        description: 'Sortie de stock pour vente',
        items: [
          {
            id: 'op-item-3',
            productId: 'prod-1',
            productName: 'Ordinateur portable',
            quantity: 2,
            unitPrice: 650.00,
            amount: 1300.00
          }
        ],
        status: 'confirmed',
        totalAmount: 1300.00,
        createdAt: '2025-04-15T14:45:00Z',
        updatedAt: '2025-04-15T14:50:00Z',
        createdBy: 'user-1'
      }
    ],
    locations: [
      {
        id: 'loc-1',
        name: 'Entrepôt principal',
        description: 'Entrepôt principal à Paris',
        address: '123 Rue de Paris, 75001 Paris',
        isDefault: true
      },
      {
        id: 'loc-2',
        name: 'Magasin 1',
        description: 'Magasin de vente',
        address: '456 Avenue de Lyon, 69001 Lyon',
        isDefault: false
      }
    ]
  },

  /**
   * Données simulées pour le chat
   */
  chat: {
    normalResponse: {
      content: "Voici la réponse à votre question. Comment puis-je vous aider davantage?",
      messageType: 'text',
      data: null
    },
    accountingResponse: {
      content: "D'après l'analyse de vos données comptables, voici une proposition d'écriture comptable pour cette transaction :",
      messageType: 'accounting_suggestion',
      data: {
        suggestion: {
          type: 'journal_entry',
          date: '2025-04-25',
          description: 'Achat de fournitures de bureau',
          entries: [
            { account: { id: 'acc-4', code: '607', name: 'Achats de marchandises' }, debit: 250, credit: 0 },
            { account: { id: 'acc-1', code: '512', name: 'Banque' }, debit: 0, credit: 250 }
          ],
          reference: 'SUGG-001'
        }
      }
    },
    inventoryResponse: {
      content: "Voici l'analyse des niveaux de stock actuels pour les produits demandés :",
      messageType: 'inventory_analysis',
      data: {
        products: [
          { id: 'prod-1', name: 'Ordinateur portable', quantity: 15, minLevel: 5, status: 'OK' },
          { id: 'prod-2', name: 'Smartphone', quantity: 20, minLevel: 8, status: 'OK' },
          { id: 'prod-3', name: 'Bureau', quantity: 8, minLevel: 10, status: 'Low' }
        ],
        suggestion: "Il est recommandé de commander des bureaux supplémentaires car le stock est inférieur au niveau minimum."
      }
    },
    analysisResponse: {
      content: "Voici l'analyse des données financières pour la période demandée :",
      messageType: 'financial_analysis',
      data: {
        period: { start: '2025-01-01', end: '2025-04-25' },
        metrics: [
          { name: 'Chiffre d\'affaires', value: 20000, change: '+15%' },
          { name: 'Marge brute', value: 12500, change: '+8%' },
          { name: 'Résultat net', value: 2650, change: '+5%' }
        ],
        chart: {
          type: 'line',
          data: {
            labels: ['Jan', 'Fév', 'Mar', 'Avr'],
            datasets: [
              {
                label: 'Chiffre d\'affaires',
                data: [4500, 5000, 5500, 5000]
              },
              {
                label: 'Charges',
                data: [3500, 4000, 4200, 3800]
              }
            ]
          }
        },
        insights: [
          "Le chiffre d'affaires a augmenté de 15% par rapport à la même période l'année dernière.",
          "La marge brute s'est améliorée grâce à une meilleure gestion des achats."
        ]
      }
    },
    conversations: [
      {
        id: 'conv-1',
        title: 'Aide pour les écritures comptables',
        createdAt: '2025-04-10T09:15:00Z',
        updatedAt: '2025-04-10T09:30:00Z',
        lastMessage: "D'après l'analyse de vos données comptables, voici une proposition d'écriture comptable...",
        mode: CHAT_MODES.ACCOUNTING,
        messages: []
      },
      {
        id: 'conv-2',
        title: 'Analyse de stock',
        createdAt: '2025-04-15T14:20:00Z',
        updatedAt: '2025-04-15T14:35:00Z',
        lastMessage: "Voici l'analyse des niveaux de stock actuels pour les produits demandés...",
        mode: CHAT_MODES.INVENTORY,
        messages: []
      }
    ]
  },

  /**
   * Données simulées pour les paiements
   */
  payment: {
    subscriptions: [
      {
        id: 'sub-1',
        planId: 'plan-pro',
        planName: 'Plan Pro',
        status: 'active',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2026-01-01T00:00:00Z',
        renewalDate: '2026-01-01T00:00:00Z',
        price: 29.99,
        currency: 'EUR',
        interval: 'month',
        features: ['comptabilité', 'inventaire', 'chat IA', 'dashboard'],
        paymentMethodId: 'pm-1'
      }
    ],
    subscriptionPlans: [
      {
        id: 'plan-starter',
        name: 'Plan Starter',
        description: 'Pour les petites entreprises',
        monthlyPrice: 9.99,
        yearlyPrice: 99.99,
        currency: 'EUR',
        features: ['comptabilité de base', 'inventaire limité'],
        isPopular: false,
        maxUsers: 2
      },
      {
        id: 'plan-pro',
        name: 'Plan Pro',
        description: 'Pour les entreprises en croissance',
        monthlyPrice: 29.99,
        yearlyPrice: 299.99,
        currency: 'EUR',
        features: ['comptabilité avancée', 'inventaire complet', 'chat IA', 'dashboard'],
        isPopular: true,
        maxUsers: 5
      },
      {
        id: 'plan-enterprise',
        name: 'Plan Enterprise',
        description: 'Pour les grandes entreprises',
        monthlyPrice: 99.99,
        yearlyPrice: 999.99,
        currency: 'EUR',
        features: ['toutes les fonctionnalités', 'support prioritaire', 'API dédiée'],
        isPopular: false,
        maxUsers: 20
      }
    ],
    paymentMethods: [
      {
        id: 'pm-1',
        type: 'card',
        default: true,
        details: {
          brand: 'Visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2027,
          holderName: 'Utilisateur Test'
        },
        createdAt: '2025-01-05T10:30:00Z',
        updatedAt: '2025-01-05T10:30:00Z'
      }
    ],
    invoices: [
      {
        id: 'inv-1',
        number: 'INV-2025-001',
        date: '2025-01-01T00:00:00Z',
        dueDate: '2025-01-15T00:00:00Z',
        status: 'paid',
        amount: 29.99,
        currency: 'EUR',
        description: 'Abonnement Plan Pro - Janvier 2025',
        items: [
          {
            id: 'inv-item-1',
            description: 'Abonnement mensuel Plan Pro',
            quantity: 1,
            unitPrice: 29.99,
            amount: 29.99
          }
        ],
        paidAt: '2025-01-05T10:35:00Z',
        pdfUrl: 'https://example.com/invoices/INV-2025-001.pdf'
      },
      {
        id: 'inv-2',
        number: 'INV-2025-002',
        date: '2025-02-01T00:00:00Z',
        dueDate: '2025-02-15T00:00:00Z',
        status: 'paid',
        amount: 29.99,
        currency: 'EUR',
        description: 'Abonnement Plan Pro - Février 2025',
        items: [
          {
            id: 'inv-item-2',
            description: 'Abonnement mensuel Plan Pro',
            quantity: 1,
            unitPrice: 29.99,
            amount: 29.99
          }
        ],
        paidAt: '2025-02-05T11:20:00Z',
        pdfUrl: 'https://example.com/invoices/INV-2025-002.pdf'
      },
      {
        id: 'inv-3',
        number: 'INV-2025-003',
        date: '2025-03-01T00:00:00Z',
        dueDate: '2025-03-15T00:00:00Z',
        status: 'paid',
        amount: 29.99,
        currency: 'EUR',
        description: 'Abonnement Plan Pro - Mars 2025',
        items: [
          {
            id: 'inv-item-3',
            description: 'Abonnement mensuel Plan Pro',
            quantity: 1,
            unitPrice: 29.99,
            amount: 29.99
          }
        ],
        paidAt: '2025-03-05T09:45:00Z',
        pdfUrl: 'https://example.com/invoices/INV-2025-003.pdf'
      },
      {
        id: 'inv-4',
        number: 'INV-2025-004',
        date: '2025-04-01T00:00:00Z',
        dueDate: '2025-04-15T00:00:00Z',
        status: 'paid',
        amount: 29.99,
        currency: 'EUR',
        description: 'Abonnement Plan Pro - Avril 2025',
        items: [
          {
            id: 'inv-item-4',
            description: 'Abonnement mensuel Plan Pro',
            quantity: 1,
            unitPrice: 29.99,
            amount: 29.99
          }
        ],
        paidAt: '2025-04-05T10:15:00Z',
        pdfUrl: 'https://example.com/invoices/INV-2025-004.pdf'
      }
    ],
    transactions: [
      {
        id: 'tx-p-1',
        date: '2025-01-05T10:35:00Z',
        amount: 29.99,
        currency: 'EUR',
        status: 'completed',
        paymentMethod: 'Visa ****4242',
        invoiceId: 'inv-1',
        description: 'Paiement de la facture INV-2025-001'
      },
      {
        id: 'tx-p-2',
        date: '2025-02-05T11:20:00Z',
        amount: 29.99,
        currency: 'EUR',
        status: 'completed',
        paymentMethod: 'Visa ****4242',
        invoiceId: 'inv-2',
        description: 'Paiement de la facture INV-2025-002'
      },
      {
        id: 'tx-p-3',
        date: '2025-03-05T09:45:00Z',
        amount: 29.99,
        currency: 'EUR',
        status: 'completed',
        paymentMethod: 'Visa ****4242',
        invoiceId: 'inv-3',
        description: 'Paiement de la facture INV-2025-003'
      },
      {
        id: 'tx-p-4',
        date: '2025-04-05T10:15:00Z',
        amount: 29.99,
        currency: 'EUR',
        status: 'completed',
        paymentMethod: 'Visa ****4242',
        invoiceId: 'inv-4',
        description: 'Paiement de la facture INV-2025-004'
      }
    ],
    accountStatus: {
      status: 'active',
      expiresAt: '2026-01-01T00:00:00Z',
      remainingDays: 250,
      features: ['comptabilité', 'inventaire', 'chat IA', 'dashboard'],
      restrictions: {
        maxUsers: 5,
        maxStorage: 10 // Go
      }
    }
  },

  /**
   * Données simulées pour le tableau de bord
   */
  dashboard: {
    layouts: [
      {
        id: 'layout-1',
        name: 'Tableau de bord par défaut',
        default: true,
        widgets: [
          {
            id: 'widget-1',
            type: 'stats',
            title: 'Chiffres clés',
            data: {
              items: [
                { label: 'Chiffre d\'affaires', value: '20 000 €', change: '+15%', changeType: 'positive' },
                { label: 'Dépenses', value: '17 350 €', change: '+8%', changeType: 'negative' },
                { label: 'Bénéfice net', value: '2 650 €', change: '+5%', changeType: 'positive' },
                { label: 'Trésorerie', value: '12 500 €', change: '-3%', changeType: 'negative' }
              ]
            },
            layout: { x: 0, y: 0, w: 12, h: 1 }
          },
          {
            id: 'widget-2',
            type: 'chart',
            title: 'Revenus vs. Dépenses',
            subtitle: 'Janvier - Avril 2025',
            data: {
              type: 'line',
              data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr'],
                datasets: [
                  {
                    label: 'Revenus',
                    data: [4500, 5000, 5500, 5000],
                    borderColor: '#4CAF50'
                  },
                  {
                    label: 'Dépenses',
                    data: [3500, 4000, 4200, 3800],
                    borderColor: '#F44336'
                  }
                ]
              }
            },
            layout: { x: 0, y: 1, w: 8, h: 2 }
          },
          {
            id: 'widget-3',
            type: 'chart',
            title: 'Répartition des ventes',
            data: {
              type: 'doughnut',
              data: {
                labels: ['Électronique', 'Mobilier', 'Services'],
                datasets: [
                  {
                    data: [15000, 2500, 2500],
                    backgroundColor: ['#2196F3', '#FF9800', '#9C27B0']
                  }
                ]
              }
            },
            layout: { x: 8, y: 1, w: 4, h: 2 }
          },
          {
            id: 'widget-4',
            type: 'table',
            title: 'Produits les plus vendus',
            data: {
              headers: ['Produit', 'Quantité', 'CA'],
              rows: [
                ['Ordinateur portable', '10', '8 999,90 €'],
                ['Smartphone', '15', '8 999,85 €'],
                ['Bureau', '5', '1 249,95 €']
              ]
            },
            layout: { x: 0, y: 3, w: 6, h: 2 }
          },
          {
            id: 'widget-5',
            type: 'list',
            title: 'Dernières transactions',
            data: {
              items: [
                { title: 'Vente de marchandises', subtitle: 'FACT-2025-001', value: '1 500,00 €', date: '15/04/2025' },
                { title: 'Achat de fournitures', subtitle: 'ACHAT-2025-001', value: '- 350,00 €', date: '10/04/2025' },
                { title: 'Salaires Avril 2025', subtitle: 'SAL-2025-004', value: '- 2 800,00 €', date: '25/04/2025' }
              ]
            },
            layout: { x: 6, y: 3, w: 6, h: 2 }
          }
        ],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-04-15T09:30:00Z'
      }
    ],
    widgetData: {
      // Données génériques pour les widgets, utilisées en fonction du type
      items: [
        { label: 'Chiffre d\'affaires', value: '20 000 €', change: '+15%', changeType: 'positive' },
        { label: 'Dépenses', value: '17 350 €', change: '+8%', changeType: 'negative' },
        { label: 'Bénéfice net', value: '2 650 €', change: '+5%', changeType: 'positive' },
        { label: 'Trésorerie', value: '12 500 €', change: '-3%', changeType: 'negative' }
      ]
    },
    businessMetrics: {
      totalRevenue: 20000,
      totalExpenses: 17350,
      netProfit: 2650,
      grossMargin: 0.625,
      accountsReceivable: 6000,
      accountsPayable: 1850,
      cashBalance: 12500,
      salesGrowth: 0.15,
      topProducts: [
        { id: 'prod-1', name: 'Ordinateur portable', revenue: 8999.90, quantity: 10 },
        { id: 'prod-2', name: 'Smartphone', revenue: 8999.85, quantity: 15 },
        { id: 'prod-3', name: 'Bureau', revenue: 1249.95, quantity: 5 }
      ],
      revenueByCategory: [
        { category: 'Électronique', value: 17999.75 },
        { category: 'Mobilier', value: 1249.95 },
        { category: 'Services', value: 750.30 }
      ]
    },
    salesMetrics: {
      total: 20000,
      growth: 0.15,
      averageOrderValue: 400,
      conversionRate: 0.08,
      byChannel: [
        { channel: 'En ligne', value: 14000 },
        { channel: 'Magasin', value: 6000 }
      ],
      byProduct: [
        { product: 'Ordinateur portable', value: 8999.90 },
        { product: 'Smartphone', value: 8999.85 },
        { product: 'Bureau', value: 1249.95 },
        { product: 'Services', value: 750.30 }
      ]
    },
    financialMetrics: {
      profitMargin: 0.1325,
      operatingMargin: 0.15,
      returnOnInvestment: 0.09,
      cashFlow: 1250,
      debToEquityRatio: 0.24,
      quickRatio: 1.8,
      currentRatio: 2.5
    },
    inventoryMetrics: {
      totalValue: 23549.85,
      turnoverRate: 4.5,
      stockOutRate: 0.02,
      averageStockDays: 30,
      lowStockItems: [
        { id: 'prod-3', name: 'Bureau', quantity: 8, minLevel: 10 }
      ]
    },
    chartData: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr'],
      datasets: [
        {
          label: 'Revenus',
          data: [4500, 5000, 5500, 5000],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)'
        },
        {
          label: 'Dépenses',
          data: [3500, 4000, 4200, 3800],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)'
        }
      ],
      title: 'Revenus vs. Dépenses',
      subtitle: 'Janvier - Avril 2025'
    },
    alerts: [
      {
        id: 'alert-1',
        type: 'warning',
        message: 'Le stock de Bureaux est bas',
        date: '2025-04-20T08:30:00Z',
        read: false,
        actionRequired: true,
        link: '/inventory/products/prod-3'
      },
      {
        id: 'alert-2',
        type: 'info',
        message: 'Facture INV-2025-004 payée',
        date: '2025-04-05T10:15:00Z',
        read: true,
        actionRequired: false,
        link: '/payments/invoices/inv-4'
      }
    ]
  },

  /**
   * Données simulées pour l'utilisateur et l'entreprise
   */
  user: {
    currentUser: {
      id: 'user-1',
      email: 'user@example.com',
      displayName: 'Utilisateur Test',
      phoneNumber: '+33612345678',
      emailVerified: true,
      position: 'Directeur',
      department: 'Administration',
      avatar: 'https://example.com/avatars/user1.jpg',
      preferences: {
        theme: 'light',
        language: 'fr',
        currency: 'EUR',
        dateFormat: 'dd/MM/yyyy'
      },
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_users'],
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-04-01T14:22:00Z'
    },
    currentCompany: {
      id: 'comp-1',
      name: 'Entreprise Test',
      legalName: 'Entreprise Test SARL',
      taxId: 'FR12345678901',
      registrationNumber: '123 456 789',
      industry: 'Commerce',
      size: '10-49',
      foundedYear: 2020,
      website: 'https://example.com',
      logo: 'https://example.com/logos/company1.png',
      address: '123 Rue de Paris',
      city: 'Paris',
      country: 'France',
      postalCode: '75001',
      phone: '+33123456789',
      email: 'contact@example.com',
      settings: {
        fiscalYear: { startMonth: 1, startDay: 1 },
        vatRate: 20
      },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-03-15T09:30:00Z'
    },
    teamMembers: [
      {
        id: 'team-1',
        userId: 'user-1',
        email: 'user@example.com',
        displayName: 'Utilisateur Test',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'manage_users'],
        status: 'active',
        joinedAt: '2025-01-15T10:30:00Z',
        lastActiveAt: '2025-04-25T08:15:00Z'
      },
      {
        id: 'team-2',
        userId: 'user-2',
        email: 'user2@example.com',
        displayName: 'Utilisateur 2',
        role: 'accountant',
        permissions: ['read', 'write'],
        status: 'active',
        joinedAt: '2025-02-01T09:45:00Z',
        lastActiveAt: '2025-04-24T16:30:00Z'
      },
      {
        id: 'team-3',
        userId: null,
        email: 'invite@example.com',
        displayName: 'Utilisateur Invité',
        role: 'viewer',
        permissions: ['read'],
        status: 'invited',
        invitedAt: '2025-04-20T11:15:00Z'
      }
    ],
    roles: [
      {
        id: 'role-admin',
        name: 'admin',
        description: 'Administrateur',
        permissions: ['read', 'write', 'delete', 'manage_users']
      },
      {
        id: 'role-accountant',
        name: 'accountant',
        description: 'Comptable',
        permissions: ['read', 'write']
      },
      {
        id: 'role-viewer',
        name: 'viewer',
        description: 'Visiteur',
        permissions: ['read']
      }
    ],
    userActivity: [
      {
        id: 'activity-1',
        type: 'login',
        description: 'Connexion réussie',
        timestamp: '2025-04-25T08:15:00Z'
      },
      {
        id: 'activity-2',
        type: 'transaction',
        description: 'Création d\'une transaction',
        timestamp: '2025-04-24T14:30:00Z',
        metadata: { transactionId: 'tx-3', amount: 2800 }
      },
      {
        id: 'activity-3',
        type: 'report',
        description: 'Génération d\'un rapport financier',
        timestamp: '2025-04-23T11:45:00Z',
        metadata: { reportType: 'income_statement' }
      }
    ],
    notifications: [
      {
        id: 'notif-1',
        type: 'alert',
        title: 'Stock bas',
        message: 'Le produit "Bureau" est en stock bas',
        read: false,
        timestamp: '2025-04-20T08:30:00Z',
        data: { productId: 'prod-3' }
      },
      {
        id: 'notif-2',
        type: 'payment',
        title: 'Paiement reçu',
        message: 'La facture INV-2025-004 a été payée',
        read: true,
        timestamp: '2025-04-05T10:15:00Z',
        data: { invoiceId: 'inv-4' }
      },
      {
        id: 'notif-3',
        type: 'system',
        title: 'Maintenance prévue',
        message: 'Une maintenance système est prévue le 30 avril à 22h00',
        read: false,
        timestamp: '2025-04-25T07:00:00Z'
      }
    ]
  }
};

export default mockData;