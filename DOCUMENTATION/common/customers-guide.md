# Module de Gestion des Clients (Customers) Ksmall

## Introduction

Le module de gestion des clients de Ksmall permet de gérer l'ensemble des interactions avec les clients, incluant la création de nouveaux clients, la mise à jour des informations clients, le suivi des historiques d'achat, et l'importation/exportation des données clients.

## Architecture

### Structure des fichiers

```
src/
├── context/
│   └── CustomerContext.tsx      # Contexte React pour la gestion de l'état des clients
├── hooks/api/
│   └── useCustomers.ts         # Hooks personnalisés pour les opérations clients
├── services/
│   ├── CustomerService.ts      # Service pour les opérations clients
│   └── api/customer/
│       └── CustomerApiService.ts # Service pour les appels API clients
├── types/
│   └── Customer.ts             # Définitions de types pour les clients
└── screens/customer/
    ├── CustomerListScreen.tsx  # Liste des clients
    ├── CustomerDetailScreen.tsx # Détails d'un client
    └── ...                     # Autres écrans de gestion client
```

## Types principaux

### Types de domaine (UI)

```typescript
// src/types/Customer.ts
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  companyName?: string;
  taxId?: string;
  type: CustomerType;
  status: CustomerStatus;
  creditLimit: number;
  balance: number;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  GOVERNMENT = 'government',
  NON_PROFIT = 'non_profit'
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

export interface CustomerListFilters {
  search?: string;
  type?: CustomerType;
  status?: CustomerStatus;
  city?: string;
  country?: string;
  minBalance?: number;
  maxBalance?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CustomerAnalytics {
  totalSpent: number;
  averageOrderValue: number;
  totalOrders: number;
  lastPurchaseDate: string;
  frequentlyPurchasedItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    totalSpent: number;
  }>;
  purchaseFrequency: string; // e.g., "weekly", "monthly", "quarterly"
  lifetimeValue: number;
}
```

### Types de service (API)

```typescript
// Types implicites utilisés dans les réponses de l'API
interface ApiCustomer {
  id: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  addressLine: string;
  cityName: string;
  countryCode: string;
  postalCode: string;
  companyName?: string;
  taxIdentifier?: string;
  customerType: string;
  status: string;
  creditLimit: number;
  accountBalance: number;
  additionalNotes: string;
  created_at: string;
  updated_at: string;
}
```

## Architecture d'adaptateurs

Pour gérer les différences entre les types de service et les types de domaine, nous implémentons des adaptateurs dans `CustomerContext.tsx`:

```typescript
const adapters = {
  // Conversion d'ApiCustomer (service) vers Customer (domaine)
  apiCustomerToDomainCustomer(customer: ApiCustomer): Customer {
    return {
      id: customer.id,
      name: customer.fullName,
      email: customer.emailAddress,
      phone: customer.phoneNumber,
      address: customer.addressLine,
      city: customer.cityName,
      country: customer.countryCode,
      postalCode: customer.postalCode,
      companyName: customer.companyName,
      taxId: customer.taxIdentifier,
      type: mapCustomerType(customer.customerType),
      status: mapCustomerStatus(customer.status),
      creditLimit: customer.creditLimit,
      balance: customer.accountBalance,
      notes: customer.additionalNotes || '',
      isActive: customer.status === 'active',
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    };
  },
  
  // Conversion de Customer (domaine) vers ApiCustomer (service)
  domainCustomerToApiCustomer(customer: Customer): Omit<ApiCustomer, 'id' | 'created_at' | 'updated_at'> {
    return {
      fullName: customer.name,
      emailAddress: customer.email,
      phoneNumber: customer.phone,
      addressLine: customer.address,
      cityName: customer.city,
      countryCode: customer.country,
      postalCode: customer.postalCode,
      companyName: customer.companyName,
      taxIdentifier: customer.taxId,
      customerType: reverseMapCustomerType(customer.type),
      status: reverseMapCustomerStatus(customer.status),
      creditLimit: customer.creditLimit,
      accountBalance: customer.balance,
      additionalNotes: customer.notes
    };
  }
};

// Fonctions utilitaires pour mapper les énumérations
function mapCustomerType(apiType: string): CustomerType {
  switch(apiType.toLowerCase()) {
    case 'company': return CustomerType.COMPANY;
    case 'government': return CustomerType.GOVERNMENT;
    case 'non_profit': return CustomerType.NON_PROFIT;
    default: return CustomerType.INDIVIDUAL;
  }
}

function mapCustomerStatus(apiStatus: string): CustomerStatus {
  switch(apiStatus.toLowerCase()) {
    case 'inactive': return CustomerStatus.INACTIVE;
    case 'blocked': return CustomerStatus.BLOCKED;
    default: return CustomerStatus.ACTIVE;
  }
}

// Fonctions inverses pour les conversions de domaine vers API
function reverseMapCustomerType(type: CustomerType): string {
  return type.toString();
}

function reverseMapCustomerStatus(status: CustomerStatus): string {
  return status.toString();
}
```

## Méthodes principales du service client

Le service `CustomerService.ts` fournit les méthodes suivantes:

```typescript
class CustomerService {
  // Récupération de la liste des clients avec filtrage et pagination
  async getCustomers(filters?: CustomerListFilters, page: number = 1, limit: number = 20): Promise<{
    data: Customer[];
    total: number;
    page: number;
    limit: number;
  }>;
  
  // Récupération d'un client par son ID
  async getCustomerById(id: string): Promise<Customer>;
  
  // Création d'un nouveau client
  async createCustomer(customerData: Partial<Customer>): Promise<Customer>;
  
  // Mise à jour d'un client existant
  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer>;
  
  // Suppression d'un client
  async deleteCustomer(id: string): Promise<boolean>;
  
  // Importation de clients depuis un fichier
  async importCustomers(
    fileUri: string,
    options?: { headerRow?: boolean; mapping?: Record<string, string> }
  ): Promise<{ success: boolean; imported: number; errors: number; log: string[] }>;
  
  // Exportation de la liste des clients
  async exportCustomers(
    format: 'csv' | 'xlsx' | 'pdf', 
    options?: { ids?: string[]; includeInactive?: boolean }
  ): Promise<string>;
  
  // Analyse du comportement d'achat d'un client
  async analyzeCustomerPurchaseBehavior(
    customerId: string, 
    options?: { startDate?: string; endDate?: string }
  ): Promise<CustomerAnalytics>;
  
  // Recherche de clients par terme
  async searchCustomers(searchTerm: string, limit: number = 10): Promise<Customer[]>;
}
```

## Correction du problème de signature de méthode

Lors de la mise à jour d'avril 2025, nous avons rencontré un problème de typage avec la méthode `importCustomers` dans `CustomerService.ts`:

```typescript
// Problème initial: Expected 1-2 arguments, but got 3
const response = await this.api.post(
  '/customers/import', 
  formData, 
  {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }
);

// Solution implémentée: Combiner les données et la configuration en un seul objet
const response = await this.api.post('/customers/import', {
  data: formData,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

Cette correction permet de s'assurer que la méthode `post` du service API respecte sa signature TypeScript déclarée, qui n'accepte que 1-2 arguments.

## API REST

### Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /customers | Liste des clients avec filtrage et pagination |
| GET | /customers/:id | Détails d'un client spécifique |
| POST | /customers | Création d'un nouveau client |
| PUT | /customers/:id | Mise à jour d'un client existant |
| DELETE | /customers/:id | Suppression d'un client |
| GET | /customers/search | Recherche de clients |
| POST | /customers/import | Importation de clients depuis un fichier |
| GET | /customers/export | Exportation de la liste des clients |
| GET | /customers/:id/analytics | Analyse du comportement d'achat |

### Paramètres de requête courants

Pour l'endpoint `/customers`:
- `page` - Numéro de page (commence à 1)
- `limit` - Nombre d'éléments par page
- `search` - Terme de recherche global
- `type` - Filtrage par type de client
- `status` - Filtrage par statut
- `sortBy` - Champ sur lequel trier
- `sortDirection` - Direction du tri (`asc` ou `desc`)

## Bonnes pratiques

1. **Toujours utiliser les adaptateurs** pour convertir entre les formats API et domaine
2. **Valider les données** avant de les envoyer à l'API
3. **Gérer les erreurs** de manière appropriée à chaque niveau
4. **Limiter les données sensibles** exposées dans l'UI
5. **Respecter les signatures de méthodes** pour éviter les erreurs TypeScript
6. **Utiliser les types utilitaires** comme `Partial<T>` pour les mises à jour partielles

## Notes de la mise à jour d'avril 2025

Le module de gestion des clients a reçu les améliorations suivantes:

1. Correction du problème de signature de méthode dans `importCustomers`
2. Implémentation des adaptateurs pour la conversion entre types API et domaine
3. Amélioration de la gestion des erreurs
4. Documentation complète des interfaces et méthodes
5. Standardisation des signatures des méthodes API

Ces améliorations assurent une meilleure robustesse du code et facilitent la maintenance future du module de gestion des clients.

---

_Dernière mise à jour: 25 avril 2025_