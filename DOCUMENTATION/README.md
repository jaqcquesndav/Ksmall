# Documentation de l'Application Ksmall

## Introduction

Ksmall est une application mobile de gestion d'entreprise complète, conçue pour les petites et moyennes entreprises. Elle intègre des fonctionnalités de gestion d'inventaire, de comptabilité, de gestion de la clientèle, de paiement, et bien plus encore.

Cette documentation a pour objectif de fournir une référence complète pour les développeurs travaillant sur l'application, y compris la structure du code, les API utilisées, et les bonnes pratiques à suivre.

## Structure de l'Application

L'application Ksmall est organisée selon une architecture modulaire, avec les principaux dossiers suivants :

- **src/components/** : Composants React Native réutilisables
- **src/context/** : Contextes React pour la gestion d'état global
- **src/hooks/** : Hooks personnalisés pour la logique métier
- **src/screens/** : Écrans de l'application
- **src/services/** : Services pour interagir avec les API et le stockage local
- **src/navigation/** : Configuration de la navigation de l'application
- **src/utils/** : Fonctions utilitaires
- **src/types/** : Définitions TypeScript pour le typage
- **src/assets/** : Images, icônes et autres ressources statiques

## Structure de la Documentation

- **api-overview.md** : Vue d'ensemble des API utilisées dans l'application
- **authentication/** : Documentation des API d'authentification
- **accounting/** : Documentation des API comptables
- **inventory/** : Documentation des API de gestion d'inventaire
- **payment/** : Documentation des API de paiement
- **finance/** : Documentation des API de gestion financière
- **chat/** : Documentation des fonctionnalités de chat et messagerie
- **common/** : Documentation des API communes et utilitaires
  - **code-style-guide.md** : Guide de style du code
  - **types-architecture.md** : Architecture des types
  - **services-architecture.md** : Architecture et interactions des services
  - **customers-guide.md** : Guide d'utilisation pour les clients
  - **typescript-troubleshooting.md** : Dépannage des problèmes TypeScript

## Guides de Développement

### Installation et configuration

Pour configurer l'environnement de développement :

```bash
# Cloner le dépôt
git clone [URL_DU_REPO]

# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm start
```

### Architecture de l'Application

Ksmall utilise une architecture basée sur les principes suivants :

1. **Séparation des préoccupations** : Les composants UI, la logique métier et l'accès aux données sont clairement séparés.
2. **Gestion d'état contextuelle** : Utilisation des Context API de React pour gérer l'état global.
3. **Hooks personnalisés** : Encapsulation de la logique dans des hooks réutilisables.
4. **Adaptateurs de services** : Les services sont conçus pour être facilement remplaçables ou simulables pour les tests.
5. **Gestion robuste des erreurs** : Mécanismes de fallback pour assurer une expérience utilisateur fluide même en mode hors ligne.

### Bonnes Pratiques

- Utiliser TypeScript pour tous les nouveaux fichiers
- Suivre les conventions de nommage établies
- Documenter les composants et fonctions avec des commentaires JSDoc
- Écrire des tests unitaires pour la logique métier critique
- Utiliser les adaptateurs pour convertir les types entre les couches service et domaine
- Implémenter des stratégies de fallback pour tous les appels API

## Ressources Additionnelles

- [Guide de Style du Code](./common/code-style-guide.md)
- [Architecture des Types](./common/types-architecture.md)
- [Architecture des Services](./common/services-architecture.md)
- [Guide de Contribution](./common/contributing.md)

## Dernière Mise à jour

Cette documentation a été mise à jour le 30 avril 2025.
