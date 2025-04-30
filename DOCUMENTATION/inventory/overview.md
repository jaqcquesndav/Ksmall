# Module d'Inventaire Ksmall

## Vue d'ensemble

Le module d'inventaire de Ksmall permet la gestion complète des produits, stocks, catégories, fournisseurs et mouvements d'inventaire. Il constitue un élément central de l'application, reliant les ventes, les achats et la gestion financière.

## Architecture

### Structure des fichiers

```
src/
├── context/
│   └── InventoryContext.tsx       # Contexte React pour l'état global de l'inventaire
├── hooks/api/
│   └── useInventory.ts           # Hooks personnalisés pour les opérations d'inventaire
├── services/
│   ├── InventoryService.ts       # Service pour les opérations locales d'inventaire
│   └── api/inventory/
│       └── InventoryApiService.ts # Service pour les appels API d'inventaire
├── types/
│   └── inventory.ts              # Définitions de types pour le module d'inventaire
└── screens/inventory/
    ├── InventoryScreen.tsx       # Écran principal d'inventaire
    ├── ProductDetailScreen.tsx   # Détails d'un produit
    └── ...                       # Autres écrans d'inventaire
```

### Flux de données

1. L'interface utilisateur interagit avec les hooks dans `useInventory.ts`
2. Les hooks appellent les méthodes appropriées dans `InventoryApiService.ts`
3. Les données reçues sont converties en types de domaine via des adaptateurs
4. L'état est mis à jour dans `InventoryContext.tsx` et l'UI est mise à jour

## Types principaux

### Types de domaine (UI)

```typescript
// src/types/inventory.ts
export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  costPrice: number;    // Coût d'achat du produit
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

export interface Stock {
  id: string;
  productId: string;
  quantity: number;
  location: string;
  lastUpdated: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  imageUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Types de service (API)

```typescript
// src/services/InventoryService.ts
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;        // Noter la différence avec costPrice dans Product
  quantity: number;
  category: string;
  subcategory: string; // Non présent dans le type Product
  reorderPoint: number;
  supplier: string;
  location: string;
  imageUrl?: string;
}
```

## Architecture d'adaptateurs

Pour gérer les différences entre les types de service et les types de domaine, nous utilisons des adaptateurs dans `InventoryContext.tsx`:

```typescript
const adapters = {
  // Conversion de InventoryItem (service) vers Product (domaine)
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
      barcode: item.sku,
      location: item.location,
      supplier: item.supplier,
      minStockLevel: item.reorderPoint,
      isActive: true, // Valeur par défaut
      attributes: {}, // Valeur par défaut
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },
  
  // Conversion de Product (domaine) vers InventoryItem (service)
  productToInventoryItem(product: Product): Omit<InventoryItem, 'id'> {
    return {
      name: product.name,
      sku: product.sku || '',
      description: product.description || '',
      price: product.price,
      cost: product.costPrice, // Conversion entre costPrice et cost
      quantity: product.quantity || 0,
      category: product.category || 'default',
      subcategory: '', // Propriété requise mais non présente dans Product
      reorderPoint: product.minStockLevel || 0,
      supplier: product.supplier || '',
      location: product.location || 'default',
      imageUrl: product.imageUrl
    };
  }
};
```

## Hooks d'inventaire

Le fichier `useInventory.ts` fournit une collection de hooks personnalisés pour interagir avec les fonctionnalités d'inventaire:

### Hooks principaux

- `useProducts()` - Récupération et gestion des produits
- `useProduct(id)` - Récupération et gestion d'un produit spécifique
- `useStocks()` - Gestion des niveaux de stock
- `useCategories()` - Gestion des catégories de produits
- `useSuppliers()` - Gestion des fournisseurs
- `useLowStockAlerts()` - Alertes pour les produits en rupture de stock
- `useStockTurnover()` - Analyse de la rotation des stocks

### Exemple d'utilisation

```typescript
import { useInventory } from '../hooks/api/useInventory';

function InventoryScreen() {
  const { useProducts, useLowStockAlerts } = useInventory();
  const { products, loading: productsLoading } = useProducts();
  const { lowStockProducts, loading: alertsLoading } = useLowStockAlerts();
  
  // Utilisation des données pour l'affichage...
}
```

## Mécanismes de Gestion des Erreurs et Fallbacks API

Le module d'inventaire implémente un système robuste et multicouche de gestion des erreurs pour assurer la continuité de service même en cas de problèmes API :

### 1. Stratégie de Cache et d'Expiration

```typescript
// Dans InventoryApiService.ts
async getProducts(options?: GetProductsOptions): Promise<InventoryItem[]> {
  const cacheKey = `products:${JSON.stringify(options || {})}`;
  
  try {
    // Vérifier si des données récentes sont en cache
    const cachedData = await CacheService.get<InventoryItem[]>(cacheKey);
    if (cachedData && !options?.forceRefresh) {
      logger.info('Données d\'inventaire récupérées depuis le cache', { cacheKey });
      return cachedData;
    }
    
    // Appeler l'API
    const response = await ApiClient.get('/api/products', { params: options });
    const products = response.data.data;
    
    // Mettre en cache pour 5 minutes
    await CacheService.set(cacheKey, products, 5 * 60);
    
    return products;
  } catch (error) {
    logger.error('Erreur lors de la récupération des produits', { error });
    
    // Essayer d'utiliser le cache même expiré en cas d'erreur
    const staleCache = await CacheService.getExpired<InventoryItem[]>(cacheKey);
    if (staleCache) {
      logger.warn('Utilisation de données de cache expirées suite à une erreur API');
      return staleCache;
    }
    
    // Si pas de cache, essayer la base de données locale
    if (DatabaseService.isAvailable) {
      const localProducts = await DatabaseService.getTable('products').findAll();
      if (localProducts.length > 0) {
        logger.warn('Utilisation de données locales suite à une erreur API');
        return localProducts.map(convertLocalProductToInventoryItem);
      }
    }
    
    // En dernier recours, utiliser les données de démo
    logger.warn('Utilisation de données de démonstration suite à une erreur API');
    return MockDataService.getDemoProducts(options?.category);
  }
}
```

### 2. File d'Attente pour les Opérations d'Écriture

```typescript
// Dans InventoryService.ts
async adjustStock(productId: string, quantity: number, reason: string): Promise<boolean> {
  try {
    // Tentative de mise à jour via API
    const result = await InventoryApiService.adjustStock(productId, quantity, reason);
    
    // Synchroniser avec la base de données locale
    await DatabaseService.updateProductStock(productId, quantity);
    
    return result;
  } catch (error) {
    logger.error('Erreur lors de l\'ajustement du stock', { error, productId });
    
    if (!NetworkService.isConnected) {
      // En mode hors ligne, enregistrer dans la file d'attente
      await OfflineQueueService.enqueue('inventory_adjust', {
        productId,
        quantity,
        reason,
        timestamp: new Date().toISOString()
      });
      
      // Mettre à jour la base de données locale
      await DatabaseService.updateProductStock(productId, quantity);
      
      logger.info('Ajustement de stock mis en file d\'attente pour synchronisation ultérieure');
      return true; // Succès local en mode hors ligne
    }
    
    throw error; // Ré-émettre l'erreur si en ligne
  }
}
```

### 3. Synchronisation Différentielle

```typescript
// Dans InventorySyncService.ts
async synchronizeInventoryData(): Promise<SyncResult> {
  // Vérifier la dernière synchronisation
  const lastSync = await SyncHistoryService.getLastSync('inventory');
  
  try {
    // Récupérer uniquement les changements depuis la dernière synchronisation
    const changes = await InventoryApiService.getChanges(lastSync?.timestamp);
    
    // Journaliser l'étendue des changements
    logger.info('Changements d\'inventaire récupérés', {
      products: changes.products.length,
      categories: changes.categories.length,
      suppliers: changes.suppliers.length
    });
    
    // Appliquer les changements à la base de données locale
    await DatabaseService.transaction(async (tx) => {
      for (const product of changes.products) {
        await tx.upsert('products', product);
      }
      
      for (const category of changes.categories) {
        await tx.upsert('categories', category);
      }
      
      for (const supplier of changes.suppliers) {
        await tx.upsert('suppliers', supplier);
      }
      
      // Enregistrer les suppressions
      for (const id of changes.deletedProductIds) {
        await tx.update('products', { id, isDeleted: true });
      }
    });
    
    // Mettre à jour l'historique de synchronisation
    await SyncHistoryService.recordSync('inventory', {
      timestamp: new Date().toISOString(),
      itemCount: changes.products.length + changes.categories.length + changes.suppliers.length,
      success: true
    });
    
    return {
      success: true,
      itemCount: changes.products.length + changes.categories.length + changes.suppliers.length,
      errors: []
    };
  } catch (error) {
    logger.error('Erreur lors de la synchronisation des données d\'inventaire', { error });
    
    // Enregistrer l'échec de synchronisation
    await SyncHistoryService.recordSync('inventory', {
      timestamp: new Date().toISOString(),
      itemCount: 0,
      success: false,
      error: error.message
    });
    
    return {
      success: false,
      itemCount: 0,
      errors: [error.message]
    };
  }
}
```

### 4. Stratégie de Dégradation Progressive

Le module d'inventaire implémente une stratégie de dégradation progressive lorsque des parties de l'API échouent :

1. **Mode Complet** - Toutes les API fonctionnent, fonctionnalités complètes
2. **Mode Partiellement Connecté** - Certaines API échouent, utiliser les données locales pour ces fonctionnalités
3. **Mode Lecture Seule** - Les API d'écriture échouent, permettre la navigation mais mettre les modifications en file d'attente
4. **Mode Entièrement Hors Ligne** - Toutes les API échouent, fonctionner avec les données locales uniquement

```typescript
// Dans InventoryContext.tsx
function determineInventoryMode(): 'full' | 'partial' | 'readonly' | 'offline' {
  if (!NetworkService.isConnected) {
    return 'offline';
  }
  
  const apiStatuses = APIHealthService.getServiceStatuses();
  
  if (apiStatuses.inventory.read === 'healthy' && apiStatuses.inventory.write === 'healthy') {
    return 'full';
  }
  
  if (apiStatuses.inventory.read === 'healthy' && apiStatuses.inventory.write === 'degraded') {
    return 'readonly';
  }
  
  if (apiStatuses.inventory.read === 'degraded') {
    return 'partial';
  }
  
  return 'offline';
}
```

## Compatibilité avec les autres modules

Le module d'inventaire est utilisé par d'autres modules de l'application, notamment le tableau de bord et la comptabilité. Pour assurer la compatibilité :

1. **Adaptateurs dédiés** - Des adaptateurs spécifiques convertissent les données d'inventaire pour le tableau de bord
2. **Types de métriques standardisés** - Les métriques d'inventaire suivent un format standard compatible avec le tableau de bord
3. **Fallbacks robustes** - Des données de démonstration sont disponibles pour chaque type de métrique

## API REST

### Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/products | Liste des produits |
| GET | /api/products/:id | Détails d'un produit |
| POST | /api/products | Création d'un produit |
| PUT | /api/products/:id | Mise à jour d'un produit |
| DELETE | /api/products/:id | Suppression d'un produit |
| GET | /api/categories | Liste des catégories |
| GET | /api/suppliers | Liste des fournisseurs |
| POST | /api/inventory/adjust | Ajustement de stock |
| GET | /api/inventory/movements | Historique des mouvements |

### Exemple de requête

```
GET /api/products?category=electronics&inStock=true
```

### Exemple de réponse

```json
{
  "success": true,
  "data": [
    {
      "id": "prod-123",
      "name": "Smartphone XYZ",
      "sku": "SM-XYZ-2025",
      "description": "Smartphone haut de gamme",
      "price": 699.99,
      "cost": 450,
      "quantity": 15,
      "category": "electronics",
      "subcategory": "phones",
      "reorderPoint": 5,
      "supplier": "sup-456",
      "location": "main-warehouse",
      "imageUrl": "https://example.com/images/sm-xyz.jpg"
    }
  ],
  "pagination": {
    "totalItems": 45,
    "totalPages": 3,
    "currentPage": 1,
    "itemsPerPage": 20
  }
}
```

## Bonnes pratiques TypeScript dans le module d'inventaire

1. **Toujours utiliser les adaptateurs** pour convertir les données entre les couches service et domaine
2. **Définir des valeurs par défaut** pour toutes les propriétés obligatoires
3. **Utiliser des types génériques** pour les paramètres et retours de fonctions
4. **Implémenter des fonctions utilitaires** pour les conversions de types récurrentes
5. **Ajouter une gestion d'erreur robuste** avec fallback vers des données locales

## Problèmes courants et solutions

### Problème: Property 'cost' does not exist on type 'Product'

**Solution**: Utiliser la propriété `costPrice` qui est la propriété correspondante dans le type `Product`, ou passer par un adaptateur:

```typescript
// Incorrect
const value = product.cost * product.quantity;

// Correct
const value = product.costPrice * product.quantity;
```

### Problème: Property 'subcategory' does not exist on type 'Product'

**Solution**: Cette propriété n'existe que dans le type de service. Lors de la conversion de `Product` vers `InventoryItem`, fournir une valeur par défaut:

```typescript
// Dans l'adaptateur
productToInventoryItem(product: Product): Omit<InventoryItem, 'id'> {
  return {
    // ...autres propriétés
    subcategory: '', // Valeur par défaut pour une propriété inexistante sur Product
    // ...autres propriétés
  };
}
```

### Problème: Erreurs 500 lors de l'appel aux API d'inventaire pour le dashboard

**Solution**: Implémenter un mécanisme de fallback vers les données locales ou de démo:

```typescript
// Dans DashboardScreen.tsx
useEffect(() => {
  if (inventoryError || !isConnected) {
    // Si API échoue ou mode hors ligne, charger depuis la base de données locale
    InventoryService.getInventoryMetrics()
      .then(metrics => setInventoryMetrics(metrics))
      .catch(err => {
        console.warn("Fallback pour les métriques d'inventaire a échoué:", err);
        // Utiliser des données de démo en dernier recours
        setInventoryMetrics({
          totalValue: 23549.85,
          totalItems: 142,
          lowStockItems: 3
        });
      });
  }
}, [inventoryError, isConnected]);
```

## Notes de la mise à jour d'avril 2025

L'architecture du module d'inventaire a été mise à jour pour résoudre plusieurs problèmes de typage TypeScript et améliorer la gestion des erreurs:

1. Implémentation complète de l'architecture d'adaptateurs
2. Correction des problèmes de propriétés manquantes ou non correspondantes
3. Ajout de valeurs par défaut pour toutes les propriétés requises
4. Standardisation des signatures des méthodes API
5. Amélioration de la gestion des erreurs avec mécanismes de fallback multiniveaux
6. Meilleure compatibilité avec le module de tableau de bord pour les métriques d'inventaire
7. Implémentation de stratégies robustes pour la gestion des données en mode hors ligne
8. Nouveau système de suivi de la fiabilité des données d'inventaire
9. Synchronisation différentielle avec pagination pour gérer les grands volumes de données
10. Intégration bidirectionnelle améliorée avec le module de comptabilité

Ces changements assurent une meilleure robustesse du code et facilitent la maintenance future du module d'inventaire.

---

_Dernière mise à jour: 30 avril 2025_