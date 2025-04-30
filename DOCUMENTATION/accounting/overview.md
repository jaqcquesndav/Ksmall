# API Comptable et Services

Ce document décrit les API comptables utilisées dans l'application Ksmall ainsi que l'architecture des services associés.

## Vue d'ensemble

Les API comptables permettent de gérer les opérations financières, les comptes, les transactions comptables, les journaux, les périodes comptables et les rapports financiers.

## Architecture des Services de Comptabilité

### Structure des fichiers

```
src/
├── services/
│   ├── AccountingService.ts       # Service principal pour les opérations comptables
│   ├── DashboardAccountingService.ts # Service pour intégrer les données comptables au dashboard
│   └── api/
│       └── accounting/
│           └── AccountingApiService.ts # Service API pour les requêtes comptables
├── hooks/
│   └── api/
│       └── useAccounting.ts      # Hooks personnalisés pour les opérations comptables
├── context/
│   └── AccountingContext.tsx    # Contexte React pour l'état comptable global
└── utils/
    └── adapters/
        └── accountingAdapters.ts # Adaptateurs pour conversion entre types service et domaine
```

### Flux de Données Comptables

1. **Saisie des Données** : L'utilisateur saisit les données comptables via l'interface utilisateur
2. **Traitement par les Hooks** : Les hooks `useAccounting()` appellent les méthodes appropriées de `AccountingService`
3. **Communication avec l'API** : `AccountingService` utilise `AccountingApiService` pour les requêtes au backend
4. **Transformation des Données** : Les adaptateurs convertissent les données entre les formats service et domaine
5. **Mise à jour de l'État** : Le contexte `AccountingContext` est mis à jour avec les nouvelles données

### Mécanismes de Gestion des Erreurs

L'application implémente plusieurs niveaux de gestion d'erreurs pour les opérations comptables :

1. **Validation Préalable** : Vérification de l'équilibre débit/crédit avant soumission
2. **Gestion des Erreurs API** : Capture et classification des erreurs de requête
3. **Mécanismes de Fallback** : Utilisation de données locales ou en cache en cas d'échec API
4. **Journalisation des Erreurs** : Toutes les erreurs sont enregistrées pour diagnostic

### Exemple de Gestion d'Erreur

```typescript
// Exemple de gestion d'erreur dans AccountingService
async createTransaction(transactionData: Transaction): Promise<ServiceTransaction> {
  try {
    // Validation locale avant envoi à l'API
    if (!this.isTransactionBalanced(transactionData)) {
      throw new Error('La transaction est déséquilibrée');
    }
    
    // Tentative d'enregistrement via l'API
    const result = await AccountingApiService.createTransaction(
      domainTransactionToServiceTransaction(transactionData)
    );
    
    return result;
  } catch (error) {
    // Journalisation de l'erreur
    logger.error('Erreur lors de la création de la transaction', error);
    
    // Stockage local pour synchronisation ultérieure si hors ligne
    if (!NetworkService.isConnected) {
      await OfflineQueueService.queueTransaction(transactionData);
      logger.info('Transaction mise en file d\'attente pour synchronisation ultérieure');
      
      // Retourner une transaction temporaire avec ID local
      return {
        ...domainTransactionToServiceTransaction(transactionData),
        id: `temp-${Date.now()}`,
        status: 'pending',
        syncStatus: 'queued'
      };
    }
    
    throw error;
  }
}
```

## Intégration avec le Dashboard

Le module comptable est fortement intégré avec le tableau de bord via le service `DashboardAccountingService` :

1. **Métriques Financières** : Le service calcule des métriques comme la rentabilité et la trésorerie
2. **Alertes Comptables** : Détection automatique des anomalies dans les transactions
3. **Données de Graphiques** : Préparation des données pour les visualisations du tableau de bord

### Exemple d'intégration

```typescript
// Dans DashboardAccountingService
async getFinancialMetrics() {
  try {
    // Tentative de récupération des données de l'API
    const apiData = await AccountingApiService.getFinancialMetrics();
    return apiData;
  } catch (error) {
    logger.error('Erreur lors de la récupération des métriques financières', error);
    
    // Fallback vers les données locales
    try {
      const localData = await this.calculateMetricsFromLocalData();
      return localData;
    } catch (localError) {
      // En dernier recours, utiliser des données de démonstration
      return MockDataService.getFinancialMetrics();
    }
  }
}
```

## Mode Hors Ligne

Le module comptable implémente une prise en charge robuste du mode hors ligne :

1. **Stockage Local** : Les transactions sont temporairement stockées dans la base de données locale
2. **File d'Attente de Synchronisation** : Les opérations hors ligne sont enregistrées pour traitement ultérieur
3. **Résolution de Conflits** : Mécanismes pour résoudre les conflits lors de la synchronisation
4. **Identifiants Temporaires** : Attribution d'IDs temporaires aux transactions avant synchronisation

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

## Problèmes Courants et Solutions

### Problème: Erreurs lors de la création de transactions en mode hors ligne

**Solution**: 
- Vérifier la connexion réseau avant de soumettre la transaction
- Utiliser `OfflineQueueService` pour mettre en file d'attente les transactions
- Synchroniser les données dès que la connectivité est rétablie

### Problème: Incohérences entre les données du tableau de bord et les données comptables

**Solution**:
- Utiliser les adaptateurs appropriés pour convertir les types de données
- Implémenter un mécanisme de cache avec TTL pour les données fréquemment consultées
- Forcer le rafraîchissement des données après des opérations critiques

### Problème: Erreur 409 - Transaction déséquilibrée

**Solution**:
- Implémenter une validation côté client avant soumission
- Vérifier que la somme des débits est égale à la somme des crédits
- Utiliser l'utilitaire `isTransactionBalanced()` avant d'appeler l'API

## Mises à jour récentes (Avril 2025)

- Amélioration de la gestion des erreurs API avec fallbacks automatiques
- Optimisation de la synchronisation des transactions en mode hors ligne
- Intégration améliorée avec le module de tableau de bord
- Support complet du plan comptable SYSCOHADA révisé
- Ajout de validations côté client pour une détection plus précoce des erreurs

---

_Dernière mise à jour: 30 avril 2025_