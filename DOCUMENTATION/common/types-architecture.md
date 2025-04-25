# Architecture des Types dans Ksmall

## Introduction

Ce document décrit l'architecture des types utilisée dans l'application Ksmall, avec un focus particulier sur l'implémentation des adaptateurs pour résoudre les problèmes de typage entre les différentes couches de l'application.

## Problématique

Dans une application complexe comme Ksmall, on rencontre souvent des différences entre :
- Les types de données utilisés par les API (couche service)
- Les types de données utilisés par l'interface utilisateur (couche domaine)

Ces différences peuvent créer des problèmes de typage TypeScript et rendre le code fragile face aux changements.

## Solution : Architecture d'Adaptateurs

Pour résoudre ces problèmes, Ksmall implémente une architecture d'adaptateurs qui assure une conversion explicite et sûre entre les types de la couche service et ceux de la couche domaine.

### Principes fondamentaux

1. **Séparation claire des types** entre la couche service et la couche domaine
2. **Conversion explicite** via des fonctions d'adaptation dédiées
3. **Valeurs par défaut sécurisées** pour toutes les propriétés requises
4. **Maintien de l'intégrité des types** à travers les différentes couches

## Implémentation

### 1. Définition des Types

#### Types de Domaine (pour l'UI)

Ces types sont définis dans `src/types/` et sont conçus pour une utilisation optimale dans l'interface utilisateur :

```typescript
// src/types/inventory.ts
export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  costPrice: number;
  quantity: number;
  category: string;
  imageUrl?: string;
  barcode?: string;
  location?: string;
  supplier?: string;
  minStockLevel?: number;
  isActive: boolean;
  attributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

#### Types de Service (pour l'API)

Ces types reflètent la structure des données reçues ou envoyées via les API :

```typescript
// src/services/InventoryService.ts
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number; // Notez la différence avec costPrice dans Product
  quantity: number;
  category: string;
  subcategory: string; // Propriété non présente dans Product
  reorderPoint: number;
  supplier: string;
  location: string;
  imageUrl?: string;
}
```

### 2. Implémentation des Adaptateurs

Les adaptateurs sont des fonctions qui convertissent les types d'une couche à l'autre :

```typescript
// src/context/InventoryContext.tsx
const adapters = {
  // Convertit de InventoryItem (service) à Product (domaine)
  inventoryItemToProduct(item: InventoryItem): Product {
    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      description: item.description || '',
      price: item.price,
      costPrice: item.cost, // Conversion entre cost et costPrice
      quantity: item.quantity,
      category: item.category,
      imageUrl: item.imageUrl,
      barcode: item.sku, // Utilisation du SKU comme code-barres par défaut
      location: item.location,
      supplier: item.supplier,
      minStockLevel: item.reorderPoint,
      isActive: true, // Valeur par défaut
      attributes: {}, // Valeur par défaut
      createdAt: new Date().toISOString(), // Valeur par défaut
      updatedAt: new Date().toISOString()  // Valeur par défaut
    };
  },
  
  // Convertit de Product (domaine) à InventoryItem (service)
  productToInventoryItem(product: Product): Omit<InventoryItem, 'id'> {
    return {
      name: product.name,
      sku: product.sku || '',
      description: product.description || '',
      price: product.price,
      cost: product.costPrice, // Conversion entre costPrice et cost
      quantity: product.quantity || 0,
      category: product.category || 'default', // Valeur par défaut si non définie
      subcategory: '', // Propriété requise mais non présente dans Product
      reorderPoint: product.minStockLevel || 0,
      supplier: product.supplier || '',
      location: product.location || 'default',
      imageUrl: product.imageUrl
    };
  }
};
```

### 3. Utilisation des Adaptateurs

Les adaptateurs sont utilisés à chaque point d'interaction entre les couches :

```typescript
// Exemple d'utilisation dans un contexte
const getProducts = async () => {
  try {
    // Appel à l'API qui renvoie des InventoryItem[]
    const productsList = await inventoryService.getProducts();
    
    // Conversion vers Product[] pour l'UI
    const convertedProducts = productsList.map(item => adapters.inventoryItemToProduct(item));
    
    setProducts(convertedProducts);
    return convertedProducts;
  } catch (err) {
    // Gestion des erreurs...
  }
};

// Exemple d'envoi de données à l'API
const addProduct = async (product: Omit<Product, 'id'>) => {
  try {
    // Conversion du Product vers InventoryItem pour l'API
    const productAsInventoryItem = adapters.productToInventoryItem(product as Product);
    
    // Appel à l'API avec le format attendu
    const newInventoryItem = await inventoryService.addProduct(productAsInventoryItem);
    
    // Re-conversion du résultat vers Product pour l'UI
    const newProduct = adapters.inventoryItemToProduct(newInventoryItem);
    
    setProducts([...products, newProduct]);
    return newProduct;
  } catch (err) {
    // Gestion des erreurs...
  }
};
```

## Bonnes Pratiques

1. **Toujours utiliser les adaptateurs** pour convertir entre les couches, même si les types semblent compatibles
2. **Fournir des valeurs par défaut** pour toutes les propriétés requises
3. **Éviter les conversions de type par assertion** (`as`) sans logique de conversion
4. **Maintenir les adaptateurs à jour** en cas de changement dans les interfaces
5. **Centraliser les définitions de types** dans des fichiers dédiés
6. **Documenter les différences clés** entre les types correspondants

## Exemples Concrets

### Exemple 1 : Gestion des Clients

```typescript
// Dans src/context/CustomerContext.tsx
const adapters = {
  apiCustomerToDomainCustomer(customer: ApiCustomer): Customer {
    return {
      id: customer.id,
      name: customer.fullName || '',
      email: customer.emailAddress || '',
      phone: customer.phoneNumber || '',
      // Autres conversions...
      isActive: customer.status === 'active',
      createdAt: customer.created_at || new Date().toISOString(),
      updatedAt: customer.updated_at || new Date().toISOString()
    };
  }
};
```

### Exemple 2 : Gestion des Transactions

```typescript
// Dans src/context/PaymentContext.tsx
const adapters = {
  apiTransactionToDomainTransaction(transaction: ApiTransaction): Transaction {
    return {
      id: transaction.transaction_id,
      amount: parseFloat(transaction.amount),
      currency: transaction.currency_code,
      status: mapTransactionStatus(transaction.status),
      // Autres conversions...
      metadata: transaction.meta ? JSON.parse(transaction.meta) : {},
      createdAt: new Date(transaction.timestamp).toISOString()
    };
  }
};

function mapTransactionStatus(apiStatus: string): TransactionStatus {
  switch (apiStatus) {
    case 'completed': return 'success';
    case 'pending': return 'pending';
    case 'failed': return 'failed';
    default: return 'unknown';
  }
}
```

## Conclusion

L'architecture d'adaptateurs mise en place dans Ksmall assure une séparation claire entre les différentes couches de l'application, ce qui améliore la maintenabilité, la testabilité et la robustesse du code. En suivant ces principes, les développeurs peuvent plus facilement gérer les différences de types entre les API et l'interface utilisateur, tout en bénéficiant des avantages du typage fort avec TypeScript.

---

_Dernière mise à jour: 25 avril 2025_