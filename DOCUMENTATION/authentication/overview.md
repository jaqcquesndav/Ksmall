# API d'Authentification et Services

Ce document décrit les API d'authentification utilisées dans l'application Ksmall ainsi que l'architecture des services associés.

## Vue d'ensemble

Les API d'authentification gèrent l'inscription des utilisateurs, la connexion, la déconnexion, la gestion des sessions, la récupération de mot de passe et la mise à jour des profils utilisateurs.

## Architecture des Services d'Authentification

### Structure des Fichiers

```
src/
├── services/
│   ├── auth/
│   │   ├── TokenStorage.ts        # Gestion sécurisée du stockage des tokens
│   │   └── AuthService.ts         # Service d'authentification local
│   └── api/
│       ├── auth/
│       │   └── AuthApiService.ts  # Service API pour l'authentification
│       └── HttpInterceptor.ts     # Intercepteur HTTP pour gérer les tokens
├── hooks/
│   └── api/
│       └── useAuth.ts            # Hooks personnalisés pour l'authentification
├── context/
│   └── AuthContext.tsx          # Contexte React pour l'état d'authentification
└── screens/
    └── auth/
        ├── LoginScreen.tsx      # Écran de connexion
        └── ...                  # Autres écrans d'authentification
```

### Flux d'Authentification

1. L'utilisateur soumet ses identifiants via l'interface utilisateur (LoginScreen.tsx)
2. Le hook `useAuth()` appelle `AuthApiService.login()`
3. `AuthApiService` communique avec le backend via `HttpInterceptor`
4. Les tokens JWT reçus sont stockés de manière sécurisée via `TokenStorage`
5. L'état d'authentification est mis à jour dans `AuthContext`

### Mécanisme de Refresh Token

L'application utilise un système de refresh token pour maintenir l'authentification des utilisateurs :

1. `HttpInterceptor` détecte automatiquement les tokens expirés
2. Si un token est expiré, il tente de l'actualiser avec `AuthApiService.refreshToken()`
3. Si le refresh réussit, la requête originale est retentée avec le nouveau token
4. Si le refresh échoue, l'utilisateur est redirigé vers l'écran de connexion

### Gestion des Erreurs d'Authentification

L'application implémente une gestion robuste des erreurs d'authentification :

1. **Niveau Service API** : `AuthApiService` capture les erreurs réseau et serveur et les journalise
2. **Niveau Hooks** : `useAuth()` transforme les erreurs en messages compréhensibles pour l'utilisateur
3. **Niveau UI** : Les composants affichent les messages d'erreur appropriés et proposent des solutions

### Exemple de Gestion d'Erreur

```typescript
// Exemple de gestion d'erreur dans le hook useAuth
const login = async (email: string, password: string) => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await AuthApiService.login({ email, password });
    setUser(response.user);
    return true;
  } catch (error) {
    // Transformation de l'erreur technique en message utilisateur
    if (error.status === 401) {
      setError("Email ou mot de passe incorrect");
    } else if (error.status === 429) {
      setError("Trop de tentatives, veuillez réessayer plus tard");
    } else {
      setError("Une erreur s'est produite lors de la connexion");
      logger.error("Login error", error);
    }
    return false;
  } finally {
    setLoading(false);
  }
};
```

## Mode Hors Ligne et Fallbacks

L'application gère les scénarios hors ligne :

1. Les identifiants précédemment vérifiés peuvent être mis en cache localement pour une réauthentification limitée
2. Les tokens refresh permettent à l'utilisateur de rester connecté même sans connexion internet
3. Les opérations d'authentification qui échouent sont placées dans une file d'attente pour une tentative ultérieure une fois la connectivité rétablie

## Sécurité et Stockage des Tokens

Les tokens sont stockés de manière sécurisée en utilisant :
- **iOS** : Keychain pour les tokens d'accès et de rafraîchissement
- **Android** : Encrypted SharedPreferences
- **Expo** : SecureStore avec cryptage

## Endpoints

### 1. Inscription d'un utilisateur

**Endpoint:** `POST /api/v1/auth/register`

**Description:** Permet l'inscription d'un nouvel utilisateur dans le système.

#### Requête

```json
{
  "email": "utilisateur@example.com",
  "password": "MotDePasse123!",
  "fullName": "Nom Complet",
  "phoneNumber": "+123456789",
  "role": "merchant" // Options: merchant, admin, staff
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "userId": "user-uuid-1234",
    "email": "utilisateur@example.com",
    "fullName": "Nom Complet",
    "phoneNumber": "+123456789",
    "role": "merchant",
    "createdAt": "2025-04-25T14:30:00Z",
    "isEmailVerified": false
  },
  "message": "Utilisateur créé avec succès"
}
```

### 2. Connexion Utilisateur

**Endpoint:** `POST /api/v1/auth/login`

**Description:** Authentifie un utilisateur et génère un token JWT.

#### Requête

```json
{
  "email": "utilisateur@example.com",
  "password": "MotDePasse123!",
  "deviceInfo": {
    "deviceId": "device-uuid-5678",
    "deviceType": "mobile",
    "platform": "iOS",
    "appVersion": "1.0.0"
  }
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "userId": "user-uuid-1234",
      "email": "utilisateur@example.com",
      "fullName": "Nom Complet",
      "role": "merchant",
      "lastLogin": "2025-04-25T14:35:00Z",
      "permissions": ["create_transaction", "view_reports"]
    }
  },
  "message": "Connexion réussie"
}
```

## Stratégies de Sécurité Avancées

### Multi-Factor Authentication (MFA)

L'application prend en charge plusieurs méthodes d'authentification à deux facteurs (2FA) :

1. **Authentification par SMS**
   - Un code à usage unique (OTP) est envoyé au numéro de téléphone vérifié de l'utilisateur
   - Implémenté via le service Twilio avec un fallback vers Firebase Phone Authentication

2. **Authentification par application d'authentification**
   - Support pour Google Authenticator, Microsoft Authenticator et autres applications TOTP
   - Génération et validation de codes basées sur l'algorithme TOTP (RFC 6238)

3. **Authentification biométrique**
   - Utilisation de FaceID/TouchID sur iOS
   - Intégration avec Biometric API sur Android
   - Stockage sécurisé des clés biométriques via Keychain/KeyStore

### Implémentation du MFA

```typescript
// Exemple d'implémentation du MFA dans AuthService
async function initiateMultiFactorAuth(userId: string, method: MFAMethod): Promise<MFAChallenge> {
  switch (method) {
    case 'sms':
      return await initiateSmsMFA(userId);
    case 'authenticator':
      return await initiateAuthenticatorMFA(userId);
    case 'biometric':
      return await initiateBiometricMFA(userId);
    default:
      throw new Error(`MFA method ${method} not supported`);
  }
}

// Exemple de validation MFA
async function validateMfaChallenge(userId: string, method: MFAMethod, code: string): Promise<AuthToken> {
  try {
    const result = await AuthApiService.validateMfa({ userId, method, code });
    await TokenStorage.saveTokens(result.tokens);
    return result.tokens;
  } catch (error) {
    logger.error("MFA validation error", error);
    throw new MFAValidationError(translateErrorMessage(error));
  }
}
```

### Détection de Fraude et Sécurité Proactive

L'application intègre des mesures de détection de fraude et de sécurité proactive :

1. **Détection d'anomalies de connexion**
   - Analyse de l'emplacement géographique
   - Vérification des empreintes digitales de l'appareil
   - Détection des modèles de connexion inhabituels

2. **Protection contre les attaques par force brute**
   - Limitation du taux de tentatives de connexion
   - Verrouillage temporaire du compte après plusieurs échecs
   - Alertes de sécurité pour l'utilisateur

3. **Audit et journalisation des activités**
   - Journalisation sécurisée de toutes les tentatives d'authentification
   - Notifications en temps réel pour les connexions suspectes
   - Tableau de bord de sécurité pour les utilisateurs finaux

### Architectures Zero-Trust et OAuth 2.0

L'application implémente une architecture de sécurité Zero-Trust en utilisant :

1. **OAuth 2.0 avec PKCE** pour l'authentification des applications mobiles
2. **Validation continue des identités** tout au long des sessions utilisateur
3. **Révocation instantanée des tokens** en cas de comportement suspect
4. **Intégration avec Auth0** comme fournisseur d'identité principal avec failover vers un système propriétaire

### Stratégies de Récupération de Compte

L'application offre plusieurs mécanismes sécurisés pour la récupération de compte :

1. **Réinitialisation par e-mail avec liens à usage unique et à durée limitée**
2. **Récupération par questions de sécurité** avec protection anti-hameçonnage
3. **Récupération via contact de confiance** pour les comptes de haut niveau
4. **Validation d'identité par pièce d'identité** pour les cas critiques de récupération

## Conformité et Régulations

L'architecture d'authentification est conçue pour respecter les normes de sécurité et régulations suivantes :

1. **GDPR** - Contrôles d'accès stricts et transparence concernant les données d'authentification
2. **PCI DSS** - Sécurisation des données sensibles selon les normes de l'industrie des paiements
3. **NIST 800-63B** - Conformité aux directives d'authentification numérique
4. **FIDO2** - Support des standards d'authentification forte sans mot de passe

## Tests de Sécurité et Audits

L'infrastructure d'authentification est régulièrement soumise à :

1. **Tests de pénétration** par des équipes de sécurité tierces
2. **Analyses de code statique** pour identifier les vulnérabilités potentielles
3. **Audits de sécurité** conformes aux standards de l'industrie
4. **Revues de code** centrées sur la sécurité pour chaque nouvelle fonctionnalité d'authentification

### 3. Déconnexion

**Endpoint:** `POST /api/v1/auth/logout`

**Description:** Déconnecte l'utilisateur en invalidant son token.

#### Requête

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Déconnexion réussie"
}
```

### 4. Actualiser le Token

**Endpoint:** `POST /api/v1/auth/refresh-token`

**Description:** Utilise un refresh token pour générer un nouveau token d'accès.

#### Requête

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "message": "Token actualisé"
}
```

### 5. Demande de Réinitialisation de Mot de Passe

**Endpoint:** `POST /api/v1/auth/forgot-password`

**Description:** Demande un lien de réinitialisation de mot de passe.

#### Requête

```json
{
  "email": "utilisateur@example.com"
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Email de réinitialisation envoyé"
}
```

### 6. Réinitialisation de Mot de Passe

**Endpoint:** `POST /api/v1/auth/reset-password`

**Description:** Réinitialise le mot de passe avec le token fourni par email.

#### Requête

```json
{
  "token": "reset-token-12345",
  "newPassword": "NouveauMotDePasse123!"
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Mot de passe réinitialisé avec succès"
}
```

### 7. Obtenir le Profil Utilisateur

**Endpoint:** `GET /api/v1/auth/profile`

**Description:** Récupère les informations du profil de l'utilisateur connecté.

#### Requête

*Nécessite un token d'authentification dans l'en-tête*

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "userId": "user-uuid-1234",
    "email": "utilisateur@example.com",
    "fullName": "Nom Complet",
    "phoneNumber": "+123456789",
    "role": "merchant",
    "createdAt": "2025-01-15T10:30:00Z",
    "lastLogin": "2025-04-25T14:35:00Z",
    "businessInfo": {
      "businessName": "Ma Boutique",
      "address": "123 Rue Commerce",
      "city": "Ville",
      "country": "Pays",
      "taxId": "TAX12345"
    },
    "settings": {
      "language": "fr",
      "timezone": "Europe/Paris",
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      }
    }
  },
  "message": "Profil récupéré avec succès"
}
```

### 8. Mettre à jour le Profil Utilisateur

**Endpoint:** `PUT /api/v1/auth/profile`

**Description:** Met à jour les informations du profil utilisateur.

#### Requête

*Nécessite un token d'authentification dans l'en-tête*

```json
{
  "fullName": "Nouveau Nom Complet",
  "phoneNumber": "+987654321",
  "businessInfo": {
    "businessName": "Nouveau Nom Boutique",
    "address": "456 Rue Commerce",
    "city": "Nouvelle Ville",
    "country": "Pays"
  },
  "settings": {
    "language": "en",
    "timezone": "Europe/London",
    "notifications": {
      "email": true,
      "sms": true,
      "push": false
    }
  }
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "userId": "user-uuid-1234",
    "email": "utilisateur@example.com",
    "fullName": "Nouveau Nom Complet",
    "phoneNumber": "+987654321",
    "role": "merchant",
    "businessInfo": {
      "businessName": "Nouveau Nom Boutique",
      "address": "456 Rue Commerce",
      "city": "Nouvelle Ville",
      "country": "Pays",
      "taxId": "TAX12345"
    },
    "settings": {
      "language": "en",
      "timezone": "Europe/London",
      "notifications": {
      "email": true,
      "sms": true,
      "push": false
      }
    }
  },
  "message": "Profil mis à jour avec succès"
}
```

## Codes d'erreur et messages

| Code | Message | Description |
|------|---------|-------------|
| 400 | "Données d'inscription invalides" | Les données fournies pour l'inscription ne sont pas valides |
| 401 | "Email ou mot de passe incorrect" | Échec d'authentification |
| 403 | "Token invalide ou expiré" | Le token JWT n'est plus valide |
| 404 | "Utilisateur non trouvé" | L'utilisateur demandé n'existe pas |
| 409 | "Cet email est déjà utilisé" | Tentative d'inscription avec un email déjà existant |
| 429 | "Trop de tentatives, veuillez réessayer plus tard" | Limite de taux atteinte pour les tentatives de connexion |
| 500 | "Erreur serveur lors de l'authentification" | Erreur interne du serveur |

## Bonnes pratiques de sécurité

1. Stockez les tokens de manière sécurisée (AsyncStorage crypté ou Keychain)
2. Ne stockez jamais les mots de passe des utilisateurs, même temporairement
3. Renouvelez le token à intervalles réguliers ou après des actions sensibles
4. Gérez correctement la déconnexion en supprimant le token côté client
5. Validez les requêtes avec vérification JWT côté serveur
6. Implémentez un système de détection des attaques par force brute

## Intégration avec d'autres services

Le service d'authentification s'intègre avec :

1. **Dashboard** - Pour afficher les informations de l'utilisateur et les permissions
2. **Accounting** - Pour relier les transactions aux utilisateurs qui les ont effectuées
3. **Inventory** - Pour attribuer des droits d'accès spécifiques selon le rôle
4. **Payment** - Pour autoriser les opérations financières selon les permissions

## Mises à jour récentes (Avril 2025)

- Amélioration de la gestion des tokens expirés avec refresh automatique
- Ajout de la vérification en deux étapes (2FA) pour améliorer la sécurité
- Optimisation des performances des requêtes d'authentification
- Meilleure gestion des erreurs avec messages utilisateur plus précis

---

_Dernière mise à jour: 30 avril 2025_