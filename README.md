This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

# Architecture de flux de données - KSmall

## Vue d'ensemble

Cette application utilise une architecture de flux de données robuste qui permet :
- Une utilisation transparente en mode connecté et hors ligne
- Une synchronisation automatique des données lors du retour en ligne
- Un mode démo fonctionnel, activé automatiquement sur Android

## Composants principaux

- **AuthContext** : Gère l'authentification et la session utilisateur
- **ApiService** : Service principal pour les communications backend avec support hors ligne
- **DatabaseContext** : Assure la persistance locale des données
- **Contexts divers** : CurrencyContext, ThemeContext, etc.

## Flux par fonctionnalité

### Authentification
- **Login** : Utilise les identifiants stockés en mode hors ligne, l'API en mode connecté
- **Signup** : Disponible uniquement en mode connecté
- **Forgot Password** : Désactivé en mode hors ligne

### Gestion des profils
- Profils initialisés au démarrage dans App.tsx
- Données persistées localement 
- Synchronisation via file d'attente hors ligne

### Dashboard
- Données chargées via API en mode connecté
- Données fallback utilisées en mode hors ligne
- Notifications d'état de connexion pour l'utilisateur

### Comptabilité
- Transactions synchronisées et stockées localement
- Mode démo distinct pour les données comptables
- Interopérabilité entre journal, grand livre, etc.

## Points forts

1. **Gestion hors ligne robuste** : File d'attente, synchronisation automatique
2. **Fallback intelligent** : Implémentations API différentes selon la plateforme
3. **Mode démo cohérent** : Activation automatique sur Android, données réalistes

## Points d'amélioration possibles

1. **Gestion des conflits** : Améliorer l'interface de résolution des conflits lors de la synchronisation
   - L'application dispose d'un `ConflictResolutionModal` mais son intégration doit être optimisée
   - Ajouter une stratégie intelligente de résolution automatique des conflits mineurs

2. **Indicateurs de synchronisation** : Renforcer le feedback visuel
   - Implémenter des indicateurs visuels plus clairs pendant les processus de synchronisation
   - Ajouter des notifications de progression pour les synchronisations volumineuses
   - Créer un écran dédié à la gestion des synchronisations en attente

3. **Tests de fiabilité** : Augmenter la couverture de test des scénarios hors ligne
   - Tester davantage les scénarios de perte de connexion pendant une opération
   - Valider la robustesse des migrations de schéma de base de données locale

## Mode démo

Le mode démo est automatiquement activé dans les cas suivants :
- Sur la plateforme Android
- En cas d'erreur lors de l'initialisation de l'application
- En cas d'erreurs réseau persistantes

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
