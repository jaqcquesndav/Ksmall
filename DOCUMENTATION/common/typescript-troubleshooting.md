# Guide de Dépannage TypeScript pour Ksmall

Ce document fournit des conseils pour résoudre les erreurs TypeScript courantes rencontrées lors du développement de l'application Ksmall.

## Erreurs Fréquentes et Solutions

### 1. Problèmes de propriétés requises manquantes

**Erreur :**
```
Argument of type '{ ... }' is not assignable to parameter of type 'X'.
Property 'y' is optional in type '{ ... }' but required in type 'X'.
```

**Cause :** 
Une propriété obligatoire n'est pas fournie lors de la conversion entre types.

**Solution :**
- Utiliser l'adaptateur approprié qui garantit que toutes les propriétés requises sont définies
- Fournir des valeurs par défaut pour les propriétés manquantes

**Exemple :**
```typescript
// Incorrect
const productData = {
  name: "Produit",
  price: 100
}; 
// Erreur: propriété 'category' manquante qui est requise

// Correct
const productData = {
  name: "Produit",
  price: 100,
  category: "default", // Valeur par défaut pour propriété requise
};
```

### 2. Problèmes de propriétés inexistantes

**Erreur :**
```
Property 'x' does not exist on type 'Y'.
```

**Cause :**
Tentative d'accès à une propriété qui n'existe pas sur le type spécifié.

**Solution :**
- Utiliser la propriété correspondante dans le type cible
- Créer un adaptateur pour faire la correspondance entre les propriétés différentes

**Exemple :**
```typescript
// Incorrect
const value = product.cost * product.quantity; 
// Erreur: la propriété 'cost' n'existe pas sur le type Product

// Correct
const value = product.costPrice * product.quantity;
// ou utiliser un adaptateur
const value = product.quantity * (product.costPrice || 0);
```

### 3. Problèmes de signature de méthode

**Erreur :**
```
Expected X-Y arguments, but got Z.
```

**Cause :**
Le nombre de paramètres utilisés ne correspond pas à la signature de la méthode.

**Solution :**
- Vérifier la signature de la méthode dans sa déclaration
- Restructurer les paramètres en un seul objet de configuration si nécessaire

**Exemple :**
```typescript
// Incorrect
const response = await api.post(url, data, config);
// Erreur si api.post n'accepte que 2 paramètres

// Correct
const response = await api.post(url, { 
  data,
  ...config
});
```

### 4. Incompatibilité de types d'objet

**Erreur :**
```
Type 'X[]' is not assignable to parameter of type 'Y[]'.
```

**Cause :**
Les tableaux contiennent des objets de types différents mais qui devraient être compatibles.

**Solution :**
- Utiliser une fonction map avec un adaptateur pour convertir chaque élément
- Assurer que tous les champs requis sont présents

**Exemple :**
```typescript
// Incorrect
setProducts(apiProducts); 
// Erreur: les API products n'ont pas toutes les propriétés requises

// Correct
setProducts(apiProducts.map(product => ({
  ...product,
  isActive: true,
  createdAt: product.createdAt || new Date().toISOString(),
  updatedAt: product.updatedAt || new Date().toISOString()
})));
```

## Stratégies de Prévention

### 1. Définir des interfaces complètes

Assurez-vous que vos interfaces sont complètes et décrivent précisément la forme des données :

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number; // Utiliser des noms cohérents
  // ... autres propriétés
}
```

### 2. Utiliser des types utilitaires TypeScript

TypeScript fournit des types utilitaires puissants pour manipuler les types :

- `Partial<T>` - Rend toutes les propriétés optionnelles
- `Required<T>` - Rend toutes les propriétés obligatoires
- `Omit<T, K>` - Omet les propriétés spécifiées
- `Pick<T, K>` - Sélectionne uniquement les propriétés spécifiées

```typescript
// Pour créer un nouveau produit (sans id)
function createProduct(productData: Omit<Product, 'id'>) {
  // ...
}

// Pour des mises à jour partielles
function updateProduct(id: string, updates: Partial<Product>) {
  // ...
}
```

### 3. Validation à l'exécution

TypeScript effectue des vérifications de type uniquement à la compilation. Pour une sécurité supplémentaire, ajoutez une validation à l'exécution :

```typescript
function validateProduct(data: unknown): asserts data is Product {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Product must be an object');
  }
  
  const product = data as Record<string, unknown>;
  
  if (typeof product.name !== 'string') {
    throw new Error('Product name must be a string');
  }
  // ... autres validations
}

// Utilisation
try {
  const data = await fetchProductFromAPI(id);
  validateProduct(data);
  // data est maintenant typé comme Product
  return data;
} catch (error) {
  // Gérer l'erreur de validation
}
```

## Outils Recommandés

1. **ESLint avec TypeScript** - Détecte les erreurs de typage avant la compilation
2. **TypeScript Plugin pour VS Code** - Fournit des suggestions et corrections en temps réel
3. **ts-prune** - Identifie le code mort/inutilisé
4. **type-coverage** - Vérifie la couverture des types dans votre code

## Conclusion

La majorité des erreurs TypeScript dans Ksmall proviennent des différences entre les types de l'API et les types du domaine. L'utilisation systématique des adaptateurs et la fourniture de valeurs par défaut pour les propriétés requises permettent de résoudre la plupart de ces problèmes.

En cas de doute, rappelez-vous la règle d'or : **Conversion explicite plutôt qu'implicite**. Convertissez toujours explicitement les données entre les couches service et domaine à l'aide d'adaptateurs bien définis.

---

_Dernière mise à jour: 25 avril 2025_