# API d'Authentification

Ce document décrit les API d'authentification utilisées dans l'application Ksmall.

## Vue d'ensemble

Les API d'authentification gèrent l'inscription des utilisateurs, la connexion, la déconnexion, la gestion des sessions, la récupération de mot de passe et la mise à jour des profils utilisateurs.

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