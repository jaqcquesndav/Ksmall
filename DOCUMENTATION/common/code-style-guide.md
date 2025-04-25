# Guide de Style du Code pour Ksmall

## Introduction

Ce guide définit les normes et meilleures pratiques pour le développement de l'application Ksmall, avec un accent particulier sur TypeScript et React Native. L'adhésion à ces standards garantit une meilleure maintenabilité, évite les erreurs TypeScript et facilite la collaboration entre développeurs.

## Principes généraux

1. **Simplicité**: Préférer le code simple et direct aux solutions complexes
2. **Cohérence**: Maintenir un style cohérent dans tout le codebase
3. **Type-safety**: Exploiter au maximum le système de types TypeScript
4. **Modularité**: Organiser le code en modules réutilisables et testables

## Normes TypeScript

### Types et interfaces

1. **Interfaces pour les structures de données principales**:
   ```typescript
   // À utiliser pour les modèles de données principaux
   interface Product {
     id: string;
     name: string;
     // ...autres propriétés
   }
   ```

2. **Types pour les unions et intersections**:
   ```typescript
   // Pour les unions et types composés
   type ProductStatus = 'in_stock' | 'out_of_stock' | 'discontinued';
   type SearchResults = Product | Category | null;
   ```

3. **Éviter `any`**:
   ```typescript
   // À éviter
   const processData = (data: any) => { /* ... */ };
   
   // Préférer
   const processData = (data: unknown) => {
     if (isValidProduct(data)) { /* ... */ }
   };
   ```

4. **Définir des assertions de type**:
   ```typescript
   function isValidProduct(data: unknown): data is Product {
     if (!data || typeof data !== 'object') return false;
     return 'id' in data && 'name' in data;
   }
   ```

### Adaptateurs et conversions

1. **Toujours utiliser des adaptateurs explicites** entre les couches API et domaine:
   ```typescript
   // Patterns recommandés pour les adaptateurs
   const apiProductToDomainProduct = (apiProduct: ApiProduct): Product => ({
     id: apiProduct.id,
     name: apiProduct.name,
     // Conversions explicites entre les formats
     price: Number(apiProduct.price),
     isActive: apiProduct.status === 'active',
     // Fournir des valeurs par défaut pour les champs obligatoires
     quantity: apiProduct.quantity || 0,
     costPrice: apiProduct.cost || 0
   });
   ```

2. **Documenter les différences critiques** entre les types correspondants:
   ```typescript
   /**
    * Converti un produit API en produit de domaine
    * @param apiProduct - Produit de l'API
    * @returns Produit formaté pour l'UI
    * @note Différences clés:
    * - 'cost' dans l'API devient 'costPrice' dans le domaine
    * - 'status' (string) devient 'isActive' (boolean)
    */
   function convertProduct(apiProduct: ApiProduct): Product {
     // ...
   }
   ```

### Fonctions et méthodes

1. **Signatures explicites** pour les paramètres et retours:
   ```typescript
   // Toujours spécifier les types de paramètres et de retour
   function calculateTotal(products: Product[]): number {
     return products.reduce((sum, product) => sum + product.price, 0);
   }
   ```

2. **Respect des signatures de méthodes existantes**:
   ```typescript
   // Si une méthode API attend 2 paramètres maximum
   // À faire:
   apiService.post(url, { data, ...config });
   
   // À éviter (cause des erreurs TypeScript):
   apiService.post(url, data, config);
   ```

3. **Paramètres optionnels et valeurs par défaut**:
   ```typescript
   function searchProducts(query: string, options: SearchOptions = {}) {
     const { limit = 10, page = 1 } = options;
     // ...
   }
   ```

## React et React Native

### Props et état

1. **Définir des interfaces pour les props**:
   ```typescript
   interface ProductCardProps {
     product: Product;
     onPress?: (product: Product) => void;
     isHighlighted?: boolean;
   }
   
   export function ProductCard({ 
     product, 
     onPress, 
     isHighlighted = false 
   }: ProductCardProps) {
     // ...
   }
   ```

2. **Utiliser les hooks bien typés**:
   ```typescript
   const [products, setProducts] = useState<Product[]>([]);
   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
   
   // Avec validation de types pour les réducteurs
   type ProductAction = 
     | { type: 'ADD'; payload: Product }
     | { type: 'REMOVE'; payload: string };
     
   const [state, dispatch] = useReducer<Reducer<ProductState, ProductAction>>(
     productReducer,
     initialState
   );
   ```

3. **Utiliser les contextes avec types**:
   ```typescript
   interface InventoryContextType {
     products: Product[];
     loading: boolean;
     error: Error | null;
     fetchProducts: () => Promise<void>;
     // ...autres méthodes et propriétés
   }
   
   const InventoryContext = createContext<InventoryContextType | undefined>(undefined);
   
   export function useInventoryContext(): InventoryContextType {
     const context = useContext(InventoryContext);
     if (context === undefined) {
       throw new Error('useInventoryContext must be used within an InventoryProvider');
     }
     return context;
   }
   ```

### Hooks personnalisés

1. **Séparer la logique métier dans des hooks réutilisables**:
   ```typescript
   // Hook spécifique pour la logique d'inventaire
   export function useProductInventory(productId: string) {
     const [stock, setStock] = useState<Stock | null>(null);
     // ...logique d'inventaire
     return { stock, updateStock, isLowStock };
   }
   ```

2. **Nommer les hooks conformément aux conventions**:
   - Toujours commencer par `use`
   - Nommer selon la fonctionnalité (`useProducts`, `useCustomers`)
   - Pour les hooks API, préfixer ou suffixer clairement (`useProductsApi`, `useApiProducts`)

## Organisation du code

### Structure de fichiers

1. **Organisation par domaine fonctionnel**:
   ```
   src/
   ├── inventory/
   │   ├── components/
   │   ├── hooks/
   │   ├── screens/
   │   ├── services/
   │   └── types.ts
   ├── customers/
   │   ├── components/
   │   └── ...
   ```

2. **Barrel exports** pour simplifier les imports:
   ```typescript
   // src/inventory/index.ts
   export * from './components';
   export * from './hooks';
   export * from './types';
   
   // Utilisation
   import { ProductList, useProducts, Product } from '../inventory';
   ```

### Gestion des imports

1. **Grouper et ordonner les imports**:
   ```typescript
   // Librairies externes
   import React, { useState, useEffect } from 'react';
   import { View, Text } from 'react-native';
   
   // Imports internes par ordre alphabétique
   import { formatCurrency } from '../utils/formatting';
   import { Product } from '../types';
   import { useProducts } from '../hooks/api/useProducts';
   ```

## Tests

1. **Tester les conversions de types et adaptateurs**:
   ```typescript
   it('should correctly convert API product to domain product', () => {
     const apiProduct = {
       id: '123',
       name: 'Test',
       cost: 100,
       // ...autres propriétés
     };
     
     const result = apiProductToDomainProduct(apiProduct);
     
     expect(result.id).toBe('123');
     expect(result.name).toBe('Test');
     expect(result.costPrice).toBe(100); // Vérifier la conversion de 'cost' à 'costPrice'
     expect(result.isActive).toBe(true); // Vérifier les valeurs par défaut
   });
   ```

2. **Tests de type avec TypeScript**:
   ```typescript
   // Dans un fichier de test type (*.test-d.ts)
   import { expectType } from 'tsd';
   import { apiProductToDomainProduct } from './adapters';
   import { Product } from './types';
   
   // Vérification que la fonction retourne bien un type Product
   expectType<Product>(apiProductToDomainProduct({
     id: '123', 
     name: 'Test', 
     // ...autres propriétés requises
   }));
   ```

## Gestion des erreurs

1. **Typage des erreurs**:
   ```typescript
   interface ApiError {
     code: string;
     message: string;
     details?: Record<string, any>;
   }
   
   function isApiError(error: unknown): error is ApiError {
     if (typeof error !== 'object' || error === null) return false;
     return 'code' in error && 'message' in error;
   }
   
   try {
     // ...
   } catch (error: unknown) {
     if (isApiError(error)) {
       // Traitement spécifique aux erreurs API
     } else {
       // Erreur générique
     }
   }
   ```

2. **Propagation des erreurs typées**:
   ```typescript
   async function fetchData(): Promise<Product[]> {
     try {
       const response = await api.get('/products');
       return response.data.map(apiProductToDomainProduct);
     } catch (error) {
       // Reconditionnement des erreurs avec contexte
       throw new FetchDataError('Failed to fetch products', { cause: error });
     }
   }
   ```

## Documentation du code

1. **Utiliser les commentaires JSDoc** pour les interfaces, types et fonctions importantes:
   ```typescript
   /**
    * Représente un produit dans l'UI
    * @interface
    * @property {string} id - Identifiant unique
    * @property {string} name - Nom du produit
    * @property {number} price - Prix public
    * @property {number} costPrice - Prix d'achat/coût
    */
   export interface Product {
     id: string;
     name: string;
     price: number;
     costPrice: number;
     // ...autres propriétés
   }
   ```

2. **Documenter les décisions importantes**:
   ```typescript
   /**
    * Convertit les produits de l'API vers le format domaine.
    * REMARQUE: Cette fonction gère la divergence entre 'cost' (API) et 'costPrice' (UI)
    * ainsi que les valeurs par défaut pour les propriétés obligatoires.
    */
   function convertProducts(apiProducts) {
     // ...
   }
   ```

## Conclusion

L'adhésion à ces principes de style de code garantit:
1. Une réduction des erreurs TypeScript
2. Une meilleure maintenabilité du code
3. Une expérience de développement plus agréable
4. Une collaboration plus efficace entre les membres de l'équipe

Toutes les contributions au projet Ksmall doivent suivre ces directives.

---

_Dernière mise à jour: 25 avril 2025_