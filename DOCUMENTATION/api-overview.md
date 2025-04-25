# Vue d'ensemble des API Ksmall

Ce document fournit une vue d'ensemble des API utilisées dans l'application Ksmall, leur organisation et les bonnes pratiques pour les utiliser.

## Structure des API

Les API de Ksmall sont organisées dans les catégories suivantes :

1. **APIs d'Authentification** : Gestion des utilisateurs, connexion, inscription, et gestion des sessions
2. **APIs Comptables** : Gestion des transactions financières, reporting, et fonctionnalités comptables
3. **APIs d'Inventaire** : Gestion des produits, stocks, et mouvements d'inventaire
4. **APIs de Paiement** : Traitement des paiements, transactions, et intégrations avec les fournisseurs de paiement
5. **APIs Communes** : Fonctionnalités partagées et utilitaires utilisés à travers l'application

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