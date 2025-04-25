# API Comptable

Ce document décrit les API comptables utilisées dans l'application Ksmall.

## Vue d'ensemble

Les API comptables permettent de gérer les opérations financières, les comptes, les transactions comptables, les journaux, les périodes comptables et les rapports financiers.

## Endpoints

### 1. Créer une Transaction Comptable

**Endpoint:** `POST /api/v1/accounting/transactions`

**Description:** Enregistre une nouvelle transaction comptable.

#### Requête

```json
{
  "date": "2025-04-25",
  "reference": "FAC-2025-0123",
  "description": "Vente de marchandises",
  "journalId": "journal-uuid-1234",
  "entries": [
    {
      "accountId": "account-uuid-4112",
      "description": "Vente de smartphone",
      "amount": 349990.00,
      "type": "credit"
    },
    {
      "accountId": "account-uuid-5711",
      "description": "TVA collectée",
      "amount": 53355.93,
      "type": "credit"
    },
    {
      "accountId": "account-uuid-4111",
      "description": "Créance client",
      "amount": 403345.93,
      "type": "debit"
    }
  ],
  "attachments": [
    {
      "type": "invoice",
      "url": "https://storage.ksmall.com/accounting/invoices/FAC-2025-0123.pdf"
    }
  ],
  "metadata": {
    "saleId": "sale-uuid-7890",
    "customerId": "customer-uuid-5678",
    "productIds": ["product-uuid-1234"]
  }
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "transactionId": "acc-transaction-uuid-1234",
    "date": "2025-04-25",
    "reference": "FAC-2025-0123",
    "description": "Vente de marchandises",
    "journalId": "journal-uuid-1234",
    "journalName": "Journal des ventes",
    "entries": [
      {
        "entryId": "entry-uuid-1234",
        "accountId": "account-uuid-4112",
        "accountCode": "4112",
        "accountName": "Ventes de marchandises",
        "description": "Vente de smartphone",
        "amount": 349990.00,
        "type": "credit"
      },
      {
        "entryId": "entry-uuid-2345",
        "accountId": "account-uuid-5711",
        "accountCode": "5711",
        "accountName": "TVA collectée",
        "description": "TVA collectée",
        "amount": 53355.93,
        "type": "credit"
      },
      {
        "entryId": "entry-uuid-3456",
        "accountId": "account-uuid-4111",
        "accountCode": "4111",
        "accountName": "Clients",
        "description": "Créance client",
        "amount": 403345.93,
        "type": "debit"
      }
    ],
    "totalDebit": 403345.93,
    "totalCredit": 403345.93,
    "isBalanced": true,
    "status": "posted",
    "createdAt": "2025-04-25T14:30:00Z",
    "createdBy": "user-uuid-1234",
    "attachments": [
      {
        "type": "invoice",
        "url": "https://storage.ksmall.com/accounting/invoices/FAC-2025-0123.pdf"
      }
    ],
    "metadata": {
      "saleId": "sale-uuid-7890",
      "customerId": "customer-uuid-5678",
      "productIds": ["product-uuid-1234"]
    }
  },
  "message": "Transaction comptable créée avec succès"
}
```

### 2. Récupérer une Transaction Comptable

**Endpoint:** `GET /api/v1/accounting/transactions/{transactionId}`

**Description:** Récupère les détails d'une transaction comptable spécifique.

#### Requête

*Nécessite un token d'authentification dans l'en-tête*

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "transactionId": "acc-transaction-uuid-1234",
    "date": "2025-04-25",
    "reference": "FAC-2025-0123",
    "description": "Vente de marchandises",
    "journalId": "journal-uuid-1234",
    "journalName": "Journal des ventes",
    "entries": [
      {
        "entryId": "entry-uuid-1234",
        "accountId": "account-uuid-4112",
        "accountCode": "4112",
        "accountName": "Ventes de marchandises",
        "description": "Vente de smartphone",
        "amount": 349990.00,
        "type": "credit",
        "balance": 4521765.00
      },
      {
        "entryId": "entry-uuid-2345",
        "accountId": "account-uuid-5711",
        "accountCode": "5711",
        "accountName": "TVA collectée",
        "description": "TVA collectée",
        "amount": 53355.93,
        "type": "credit",
        "balance": 689431.47
      },
      {
        "entryId": "entry-uuid-3456",
        "accountId": "account-uuid-4111",
        "accountCode": "4111",
        "accountName": "Clients",
        "description": "Créance client",
        "amount": 403345.93,
        "type": "debit",
        "balance": 2175324.82
      }
    ],
    "totalDebit": 403345.93,
    "totalCredit": 403345.93,
    "isBalanced": true,
    "status": "posted",
    "createdAt": "2025-04-25T14:30:00Z",
    "createdBy": "user-uuid-1234",
    "createdByName": "Jean Dupont",
    "updatedAt": null,
    "updatedBy": null,
    "attachments": [
      {
        "type": "invoice",
        "url": "https://storage.ksmall.com/accounting/invoices/FAC-2025-0123.pdf"
      }
    ],
    "metadata": {
      "saleId": "sale-uuid-7890",
      "customerId": "customer-uuid-5678",
      "customerName": "Client Example",
      "productIds": ["product-uuid-1234"]
    },
    "relatedTransactions": [
      {
        "transactionId": "acc-transaction-uuid-5678",
        "reference": "REC-2025-0123",
        "description": "Encaissement facture FAC-2025-0123",
        "date": "2025-04-26",
        "amount": 403345.93
      }
    ]
  },
  "message": "Transaction comptable récupérée avec succès"
}
```

### 3. Lister les Transactions Comptables

**Endpoint:** `GET /api/v1/accounting/transactions`

**Description:** Récupère une liste paginée des transactions comptables selon les filtres appliqués.

#### Paramètres de requête

- `startDate` (optionnel): Date de début (format: YYYY-MM-DD)
- `endDate` (optionnel): Date de fin (format: YYYY-MM-DD)
- `journalId` (optionnel): ID du journal
- `accountId` (optionnel): ID du compte
- `status` (optionnel): État de la transaction (draft, posted, approved, rejected)
- `reference` (optionnel): Référence de la transaction
- `minAmount` (optionnel): Montant minimum
- `maxAmount` (optionnel): Montant maximum
- `page` (optionnel, défaut=1): Numéro de page
- `limit` (optionnel, défaut=20): Nombre d'éléments par page

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "transactions": [
      {
        "transactionId": "acc-transaction-uuid-1234",
        "date": "2025-04-25",
        "reference": "FAC-2025-0123",
        "description": "Vente de marchandises",
        "journalName": "Journal des ventes",
        "totalAmount": 403345.93,
        "status": "posted",
        "createdAt": "2025-04-25T14:30:00Z",
        "createdByName": "Jean Dupont"
      },
      {
        "transactionId": "acc-transaction-uuid-5678",
        "date": "2025-04-26",
        "reference": "REC-2025-0123",
        "description": "Encaissement facture FAC-2025-0123",
        "journalName": "Journal de trésorerie",
        "totalAmount": 403345.93,
        "status": "posted",
        "createdAt": "2025-04-26T10:15:00Z",
        "createdByName": "Jean Dupont"
      }
    ],
    "summary": {
      "totalTransactions": 45,
      "totalDebits": 12500000.00,
      "totalCredits": 12500000.00,
      "balance": 0.00,
      "statusCounts": {
        "draft": 2,
        "posted": 40,
        "approved": 3,
        "rejected": 0
      }
    }
  },
  "pagination": {
    "totalItems": 45,
    "totalPages": 3,
    "currentPage": 1,
    "itemsPerPage": 20
  },
  "message": "Transactions comptables récupérées avec succès"
}
```

### 4. Créer un Compte

**Endpoint:** `POST /api/v1/accounting/accounts`

**Description:** Crée un nouveau compte comptable.

#### Requête

```json
{
  "code": "4113",
  "name": "Ventes de services",
  "type": "revenue",
  "subtype": "operating_revenue",
  "parentAccountId": "account-uuid-4110",
  "description": "Compte pour les ventes de services",
  "isActive": true,
  "currencyCode": "XOF",
  "tags": ["services", "operating"]
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "accountId": "account-uuid-4113",
    "code": "4113",
    "name": "Ventes de services",
    "type": "revenue",
    "subtype": "operating_revenue",
    "category": "profit_and_loss",
    "parentAccountId": "account-uuid-4110",
    "parentAccountName": "Revenus",
    "path": ["account-uuid-4100", "account-uuid-4110", "account-uuid-4113"],
    "description": "Compte pour les ventes de services",
    "isActive": true,
    "currencyCode": "XOF",
    "balance": 0.00,
    "createdAt": "2025-04-25T16:00:00Z",
    "createdBy": "user-uuid-1234",
    "tags": ["services", "operating"]
  },
  "message": "Compte créé avec succès"
}
```

### 5. Générer un Grand Livre

**Endpoint:** `GET /api/v1/accounting/ledger`

**Description:** Génère un grand livre pour un compte ou une période spécifique.

#### Paramètres de requête

- `accountId` (obligatoire): ID du compte
- `startDate` (optionnel): Date de début (format: YYYY-MM-DD)
- `endDate` (optionnel): Date de fin (format: YYYY-MM-DD)
- `format` (optionnel, défaut=json): Format du rapport (json, pdf, xlsx)
- `includeDetails` (optionnel, défaut=true): Inclure les détails des transactions
- `page` (optionnel, défaut=1): Numéro de page (uniquement pour format=json)
- `limit` (optionnel, défaut=100): Nombre d'éléments par page (uniquement pour format=json)

#### Réponse (format=json)

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "account": {
      "accountId": "account-uuid-4112",
      "code": "4112",
      "name": "Ventes de marchandises",
      "type": "revenue"
    },
    "period": {
      "startDate": "2025-04-01",
      "endDate": "2025-04-30",
      "startBalance": 4171775.00,
      "endBalance": 4521765.00
    },
    "entries": [
      {
        "transactionId": "acc-transaction-uuid-1234",
        "date": "2025-04-25",
        "reference": "FAC-2025-0123",
        "description": "Vente de smartphone",
        "debit": 0.00,
        "credit": 349990.00,
        "balance": 4521765.00,
        "journalName": "Journal des ventes"
      }
    ],
    "summary": {
      "totalDebits": 0.00,
      "totalCredits": 349990.00,
      "netChange": 349990.00,
      "transactionCount": 1
    }
  },
  "pagination": {
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1,
    "itemsPerPage": 100
  },
  "message": "Grand livre généré avec succès"
}
```

### 6. Générer des États Financiers

**Endpoint:** `GET /api/v1/accounting/financial-statements`

**Description:** Génère des états financiers (bilan, compte de résultat, tableau de flux de trésorerie).

#### Paramètres de requête

- `type` (obligatoire): Type d'état financier (balance_sheet, income_statement, cash_flow)
- `startDate` (obligatoire): Date de début (format: YYYY-MM-DD)
- `endDate` (obligatoire): Date de fin (format: YYYY-MM-DD)
- `format` (optionnel, défaut=json): Format du rapport (json, pdf, xlsx)
- `compareWithPrevious` (optionnel, défaut=false): Comparer avec la période précédente
- `level` (optionnel, défaut=2): Niveau de détail (1-3)

#### Réponse (format=json, type=balance_sheet)

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "statementType": "balance_sheet",
    "businessName": "Ma Boutique",
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-04-30"
    },
    "generatedAt": "2025-04-25T16:30:00Z",
    "currency": "XOF",
    "assets": {
      "currentAssets": {
        "cash": 5325000.00,
        "accountsReceivable": 2175324.82,
        "inventory": 12500000.00,
        "prepaidExpenses": 750000.00,
        "totalCurrentAssets": 20750324.82
      },
      "nonCurrentAssets": {
        "propertyPlantAndEquipment": 7500000.00,
        "lessAccumulatedDepreciation": -1250000.00,
        "intangibleAssets": 500000.00,
        "totalNonCurrentAssets": 6750000.00
      },
      "totalAssets": 27500324.82
    },
    "liabilitiesAndEquity": {
      "currentLiabilities": {
        "accountsPayable": 4250000.00,
        "taxesPayable": 689431.47,
        "shortTermLoans": 0.00,
        "totalCurrentLiabilities": 4939431.47
      },
      "nonCurrentLiabilities": {
        "longTermLoans": 7500000.00,
        "totalNonCurrentLiabilities": 7500000.00
      },
      "equity": {
        "capitalStock": 10000000.00,
        "retainedEarnings": 5060893.35,
        "totalEquity": 15060893.35
      },
      "totalLiabilitiesAndEquity": 27500324.82
    },
    "isBalanced": true,
    "comparisonWithPrevious": null,
    "notes": [
      {
        "category": "assets",
        "item": "inventory",
        "note": "L'inventaire a augmenté de 15% par rapport à la fin de l'année précédente en raison de l'expansion des lignes de produits."
      }
    ]
  },
  "message": "État financier généré avec succès"
}
```

### 7. Clôturer une Période Comptable

**Endpoint:** `POST /api/v1/accounting/periods/close`

**Description:** Clôture une période comptable et reporte les soldes.

#### Requête

```json
{
  "periodEndDate": "2025-04-30",
  "notes": "Clôture mensuelle - Avril 2025",
  "adjustingEntries": [
    {
      "description": "Amortissement mensuel",
      "journalId": "journal-uuid-3456",
      "entries": [
        {
          "accountId": "account-uuid-6612",
          "description": "Dotation aux amortissements",
          "amount": 125000.00,
          "type": "debit"
        },
        {
          "accountId": "account-uuid-2183",
          "description": "Amortissements cumulés",
          "amount": 125000.00,
          "type": "credit"
        }
      ]
    }
  ]
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "periodId": "period-uuid-1234",
    "startDate": "2025-04-01",
    "endDate": "2025-04-30",
    "status": "closed",
    "notes": "Clôture mensuelle - Avril 2025",
    "closedBy": "user-uuid-1234",
    "closedAt": "2025-04-30T23:59:59Z",
    "adjustingEntries": [
      {
        "transactionId": "acc-transaction-uuid-9876",
        "description": "Amortissement mensuel",
        "amount": 125000.00,
        "journalName": "Journal des opérations diverses"
      }
    ],
    "summary": {
      "totalRevenue": 2350000.00,
      "totalExpenses": 1125000.00,
      "profit": 1225000.00,
      "transactionCount": 53
    },
    "reportUrls": {
      "balanceSheet": "https://storage.ksmall.com/accounting/reports/2025-04/balance-sheet.pdf",
      "incomeStatement": "https://storage.ksmall.com/accounting/reports/2025-04/income-statement.pdf",
      "generalLedger": "https://storage.ksmall.com/accounting/reports/2025-04/general-ledger.xlsx"
    }
  },
  "message": "Période comptable clôturée avec succès"
}
```

## Codes d'erreur et messages

| Code | Message | Description |
|------|---------|-------------|
| 400 | "Données comptables invalides" | Les données fournies ne sont pas valides |
| 401 | "Non autorisé" | Authentification requise |
| 403 | "Accès refusé" | Pas assez de permissions pour cette opération comptable |
| 404 | "Compte ou transaction non trouvé(e)" | Le compte ou la transaction demandé(e) n'existe pas |
| 409 | "Transaction déséquilibrée" | Les débits et crédits ne sont pas équilibrés |
| 422 | "Période comptable fermée" | Tentative de modification dans une période clôturée |
| 423 | "Compte système protégé" | Tentative de modification d'un compte système protégé |
| 500 | "Erreur serveur lors de l'opération comptable" | Erreur interne du serveur |

## Bonnes pratiques comptables

1. Maintenir l'équilibre entre les débits et les crédits pour chaque transaction
2. Clôturer régulièrement les périodes comptables (mensuellement ou trimestriellement)
3. Effectuer des rapprochements bancaires réguliers
4. Sauvegarder les pièces justificatives pour chaque transaction
5. Suivre les normes comptables applicables (SYSCOA/OHADA)
6. Effectuer des audits périodiques des comptes
7. Configurer des droits d'accès appropriés pour les fonctions comptables sensibles