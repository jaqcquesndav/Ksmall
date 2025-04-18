# Architecture des Services API

## Vue d'ensemble

Cette application utilise une architecture de services API en couches qui permet :
- L'utilisation transparente du mode démo sur Android ou en cas d'erreur réseau
- Une transition fluide entre l'API en ligne et SQLite pour le stockage local
- Une gestion des erreurs centralisée et robuste

## Comment utiliser l'API dans les composants

### 🚫 NE JAMAIS importer directement ApiService.ts

Pour éviter les problèmes de bundling sur Android, n'importez **jamais** directement `ApiService.ts` dans vos composants.

### ✅ Utilisez toujours l'import depuis API.ts

```javascript
// Correct
import { API } from '../services/API';
// ou
import API from '../services/API';

// Exemple d'utilisation
const fetchData = async () => {
  try {
    const data = await API.get('/endpoint');
    // Utiliser les données
  } catch (error) {
    // Gérer l'erreur
  }
};
```

## Architecture des services

L'architecture se compose des couches suivantes :

1. **API.ts** - Point d'entrée principal avec gestion des erreurs et journalisation
2. **index.ts** - Sélecteur qui choisit la bonne implémentation en fonction de la plateforme
3. **ApiServiceWrapper.ts** - Implémentation basée sur `fetch` pour Android (sans axios)
4. **ApiService.ts** - Implémentation basée sur axios pour iOS/Web
5. **ApiServiceFallback.ts** - Implémentation de secours basée sur SQLite pour le mode démo

## Mode démo

Le mode démo est automatiquement activé dans les cas suivants :
- Sur la plateforme Android
- En cas d'erreur lors de l'initialisation de l'application
- En cas d'erreurs réseau persistantes

Pour activer/désactiver manuellement le mode démo :

```javascript
import { API } from '../services/API';

// Activer le mode démo
API.enableDemoMode(true);

// Désactiver le mode démo
API.enableDemoMode(false);

// Vérifier si le mode démo est actif
const isDemo = API.isDemoMode();
```

## Maintenance

Pour maintenir cette architecture, assurez-vous de :
1. Toujours utiliser l'import depuis `API.ts`
2. Maintenir la même interface entre toutes les implémentations de l'API
3. Éviter les dépendances directes à axios dans les fichiers autres que `ApiService.ts`