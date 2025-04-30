# Architecture des Services Ksmall

## Vue d'ensemble

L'application Ksmall est construite sur une architecture de services modulaire où chaque service est responsable d'une fonctionnalité spécifique. Cette approche permet une maintenance plus facile et une meilleure séparation des responsabilités. Cependant, elle nécessite une coordination soignée entre les services pour garantir la compatibilité des données.

Ce document décrit l'architecture globale des services, leurs interactions et les mécanismes de gestion des données.

## Hiérarchie des Services

### Services principaux

Les services principaux fournissent l'accès aux fonctionnalités essentielles de l'application :

- **DatabaseService** : Gestion de la base de données SQLite locale
- **API** : Interface centralisée pour les appels API distants
- **SyncService** : Synchronisation des données entre le local et le serveur
- **AuthService** : Gestion de l'authentification et des autorisations

### Services métier

Ces services implémentent la logique métier spécifique à chaque domaine :

- **AccountingService** : Opérations comptables et financières
- **InventoryService** : Gestion des produits et des stocks
- **CustomerService** : Gestion des clients et des relations
- **PaymentService** : Traitement des paiements et transactions
- **FinancialService** : Analyses et rapports financiers

### Services de présentation

Ces services préparent les données pour l'affichage et l'interaction avec l'utilisateur :

- **DashboardAccountingService** : Données comptables pour le tableau de bord
- **CurrencyService** : Formatage et conversion des devises
- **MockDataService** : Données de démonstration pour le développement

## Flux de données

### Architecture en couches

L'architecture des services Ksmall suit un modèle en couches :

1. **Couche UI** (Écrans et composants) : Affiche les données et capture les interactions utilisateur
2. **Couche Hooks** (useInventory, useAccounting, etc.) : Expose les fonctionnalités des services aux composants
3. **Couche Service de présentation** (DashboardAccountingService, etc.) : Prépare les données pour l'affichage
4. **Couche Service métier** (AccountingService, InventoryService, etc.) : Implémente la logique métier
5. **Couche d'accès aux données** (DatabaseService, API) : Accède aux données locales et distantes

### Diagramme de flux de données

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    UI       │◄───►│   Hooks     │◄───►│ Présentation│
└─────────────┘     └─────────────┘     └──────┬──────┘
                                             ▲
                                             │
                                        ┌────▼─────┐
                                        │  Service  │
                                        │  Métier   │
                                        └────┬──────┘
                                             │
                           ┌─────────────┐   │   ┌─────────────┐
                           │     API     │◄──┴──►│ Base Données│
                           └─────────────┘       └─────────────┘
```

## Adaptateurs de données

Pour garantir la compatibilité des données entre les différentes couches, Ksmall utilise des adaptateurs qui convertissent les types de données.

### Structure des adaptateurs

Les adaptateurs sont organisés par domaine :

```
src/utils/adapters/
├── accountingAdapters.ts
├── dashboardAdapters.ts
├── inventoryAdapters.ts
└── financeAdapters.ts
```

### Exemple d'adaptation

```typescript
// Exemple d'adaptation entre service et domaine
export function serviceAccountToDomainAccount(serviceAccount: ServiceAccount): Account {
  return {
    id: serviceAccount.id,
    number: serviceAccount.number,
    name: serviceAccount.name,
    type: serviceAccount.type,
    balance: serviceAccount.balance,
    description: '',  // Valeur par défaut pour les propriétés manquantes
    parentAccountId: undefined, 
    isActive: serviceAccount.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
```

## Gestion des modes hors ligne et démo

Ksmall gère deux modes spéciaux qui affectent le comportement des services :

### Mode hors ligne

- **Détection** : Gérée par NetInfoService
- **Stockage** : Les données sont stockées localement via DatabaseService
- **Sync** : SyncService gère la synchronisation quand la connectivité est restaurée
- **Fallback** : Les services utilisent des données locales ou de démo

### Mode démo

- **Activation** : Via SettingsService ou en mode développement
- **Données** : Fournies par MockDataService
- **Isolation** : Les services ont une logique conditionnelle pour utiliser des données de démo

## Services et leurs interactions

### DatabaseService et SyncService

Ces deux services forment le socle de persistance des données :

- **DatabaseService** gère le stockage local SQLite
- **SyncService** coordonne la synchronisation avec le serveur
- Les services métier utilisent ces deux services pour lire/écrire des données

### AccountingService et DashboardAccountingService

- **AccountingService** implémente les opérations comptables fondamentales
- **DashboardAccountingService** transforme les données comptables pour le tableau de bord
- **Stratégie de fallback** : DashboardAccountingService utilise des données locales ou démo si les API échouent

### InventoryService et API

- **InventoryService** gère les opérations d'inventaire locales
- **API.inventory** gère les appels API pour l'inventaire
- Les deux services utilisent des types parfois différents, nécessitant des adaptateurs

## Gestion des erreurs API

Les erreurs API sont gérées à plusieurs niveaux :

1. **useApi** (hook) : Capture les erreurs d'appels API et les transforme en ApiError
2. **API error handler** : Traite les erreurs spécifiques (authentification, réseau, etc.)
3. **Service fallback** : Les services implémentent une logique de fallback vers des données locales/démo

### Exemple de fallback dans DashboardAccountingService

```typescript
async getFinancialMetrics() {
  try {
    // Tenter d'obtenir les données depuis l'API via le hook useApi
    // ...
  } catch (error) {
    logger.error('Erreur lors de la récupération des métriques financières:', error);
    // Fallback vers les données locales ou démo
    return {
      totalRevenue: 3500000,
      totalExpenses: 2425000,
      netIncome: 1075000,
      profitMargin: 30.7
    };
  }
}
```

## Bonnes pratiques pour l'utilisation des services

1. **Toujours accéder aux services via les hooks** pour bénéficier de la gestion d'erreur et du cache
2. **Utiliser les adaptateurs** pour convertir les types entre les couches
3. **Implémenter une logique de fallback** pour gérer les scénarios d'échec d'API
4. **Vérifier la disponibilité du réseau** avant les opérations nécessitant une connexion

## Problèmes courants et solutions

### Problème : Erreurs API 500 dans les hooks dashboard

**Solution** : Améliorer la gestion des erreurs dans les hooks et implémenter un mécanisme robuste de fallback :

```typescript
useEffect(() => {
  if (financialError || !isConnected) {
    // En cas d'erreur API ou mode hors ligne, utiliser les données locales
    loadFallbackDashboardData();
  }
}, [financialError, isConnected]);
```

### Problème : Incompatibilité entre types de service et types de domaine

**Solution** : Toujours utiliser des adaptateurs pour convertir les données :

```typescript
// Au lieu de:
const dashboardData = apiData; // peut causer des erreurs de type

// Utiliser:
const dashboardData = apiToDashboardAdapter(apiData);
```

### Problème : Données incomplètes ou manquantes

**Solution** : Fournir des valeurs par défaut dans les adaptateurs et vérifier l'existence des propriétés :

```typescript
const data = {
  ...defaultValues,
  ...(apiResponse || {})
};
```

## Mise à jour des services (Avril 2025)

L'architecture des services a été améliorée pour résoudre plusieurs problèmes :

1. **Gestion robuste des erreurs API** dans les hooks useDashboard et usePayment
2. **Mécanismes de fallback améliorés** dans DashboardAccountingService
3. **Adaptateurs standardisés** pour une meilleure compatibilité des données
4. **Détection et récupération des erreurs API** dans useApi hook
5. **Mode démo amélioré** avec des données plus réalistes

Ces améliorations garantissent une meilleure expérience utilisateur même en cas d'erreurs API ou de mode hors ligne.

---

_Dernière mise à jour : 30 avril 2025_