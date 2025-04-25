# Vue d'ensemble des API Ksmall

Ce document fournit une vue d'ensemble des API utilisées dans l'application Ksmall, leur organisation et les bonnes pratiques pour les utiliser.

## Structure des API

Les API de Ksmall sont organisées dans les catégories suivantes :

1. **APIs d'Authentification** : Gestion des utilisateurs, connexion, inscription, et gestion des sessions
2. **APIs Comptables** : Gestion des transactions financières, reporting, et fonctionnalités comptables
3. **APIs d'Inventaire** : Gestion des produits, stocks, et mouvements d'inventaire
4. **APIs de Paiement** : Traitement des paiements, transactions, et intégrations avec les fournisseurs de paiement
5. **APIs Communes** : Fonctionnalités partagées et utilitaires utilisés à travers l'application

## Architecture d'adaptateurs

À partir de la version d'avril 2025, Ksmall utilise une architecture d'adaptateurs pour assurer une séparation claire entre les types de données de l'API et les types utilisés dans l'interface utilisateur. Cela offre plusieurs avantages :

1. **Découplage** : Les changements dans l'API n'affectent pas directement l'interface utilisateur
2. **Typage sûr** : Conversion explicite entre les types de domaine et les types de service
3. **Testabilité améliorée** : Les adaptateurs peuvent être facilement simulés pour les tests

### Exemple d'utilisation des adaptateurs

```typescript
// Dans un contexte comme InventoryContext.tsx
const adapters = {
  // Conversion de InventoryItem (service) vers Product (domaine)
  inventoryItemToProduct(item: InventoryItem): Product {
    return {
      id: item.id,
      name: item.name,
      // autres propriétés mappées
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },
  
  // Conversion de Product (domaine) vers InventoryItem (service)
  productToInventoryItem(product: Product): Omit<InventoryItem, 'id'> {
    return {
      name: product.name,
      // autres propriétés mappées avec valeurs par défaut pour les champs requis
      category: product.category || 'default',
      // etc.
    };
  }
};
```

## Format Standard des Requêtes et Réponses

### Format de Requête

Toutes les requêtes API suivent généralement ce format :

```json
{
  "method": "GET|POST|PUT|DELETE",
  "endpoint": "/path/to/resource",
  "headers": {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  },
  "params": {
    "key1": "value1",
    "key2": "value2"
  },
  "body": {
    "property1": "value1",
    "property2": "value2"
  }
}
```

### Format de Réponse

Les réponses API suivent généralement ce format :

```json
{
  "success": true|false,
  "statusCode": 200|201|400|401|403|404|500,
  "data": {
    // Les données retournées par l'API
  },
  "message": "Message descriptif",
  "errors": [
    {
      "field": "Champ concerné",
      "message": "Message d'erreur"
    }
  ],
  "pagination": {
    "totalItems": 100,
    "totalPages": 5,
    "currentPage": 1,
    "itemsPerPage": 20
  }
}
```

## Gestion des Erreurs

Les erreurs sont retournées avec un code d'état HTTP approprié et un objet JSON contenant des détails sur l'erreur :

- **400 Bad Request** : Requête mal formée ou paramètres invalides
- **401 Unauthorized** : Authentification requise ou échouée
- **403 Forbidden** : Autorisation insuffisante
- **404 Not Found** : Ressource non trouvée
- **500 Internal Server Error** : Erreur interne du serveur

## Authentification

La plupart des API nécessitent une authentification via un token JWT. Le token doit être inclus dans l'en-tête HTTP `Authorization` sous la forme `Bearer {token}`.

## Pagination

Pour les endpoints qui retournent de nombreuses ressources, la pagination est supportée via les paramètres suivants :

- `page` : Numéro de page (commence à 1)
- `limit` : Nombre d'éléments par page
- `sort` : Champ sur lequel trier les résultats
- `order` : Direction du tri (`asc` ou `desc`)

## Versionnement

Les API sont versionnées par URL, par exemple `/api/v1/resource`.

## Bonnes pratiques TypeScript

Pour assurer la robustesse du code et éviter les erreurs de type, suivez ces recommandations :

1. **Définir des interfaces explicites** pour tous les types de données :
   ```typescript
   // Exemple d'interface pour un produit
   interface Product {
     id: string;
     name: string;
     price: number;
     quantity: number;
     isActive: boolean;
     costPrice: number;
     createdAt: string;
     updatedAt: string;
   }
   ```

2. **Utiliser les adaptateurs** pour convertir les données entre les couches service et domaine :
   ```typescript
   // Convertir depuis l'API vers le modèle de domaine
   const domainProduct = adapters.inventoryItemToProduct(apiResponse);
   
   // Convertir depuis le modèle de domaine vers le format API
   const servicePayload = adapters.productToInventoryItem(domainProduct);
   ```

3. **Définir des valeurs par défaut** pour les propriétés obligatoires :
   ```typescript
   const defaultProduct: Product = {
     id: '',
     name: '',
     price: 0,
     quantity: 0,
     isActive: true,
     costPrice: 0,
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString()
   };
   ```

4. **Utiliser les types utilitaires TypeScript** comme `Partial<T>`, `Omit<T, K>`, et `Pick<T, K>` pour manipuler les types de manière sûre.

## Mise à jour Récente

La dernière mise à jour majeure de nos API a inclus :
- Implémentation de l'architecture d'adaptateurs pour une meilleure séparation des préoccupations
- Correction des problèmes de typage dans les services d'inventaire, client et fournisseur
- Standardisation des signatures de méthodes API dans les services
- Amélioration de la gestion des erreurs et de la validation des données

_Dernière mise à jour: 25 avril 2025_