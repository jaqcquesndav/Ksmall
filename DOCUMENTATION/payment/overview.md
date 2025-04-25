# API de Paiement

Ce document décrit les API de paiement utilisées dans l'application Ksmall.

## Vue d'ensemble

Les API de paiement permettent de gérer les transactions financières, les différents modes de paiement, les reçus et les rapports financiers.

## Endpoints

### 1. Créer une Transaction

**Endpoint:** `POST /api/v1/payments/transactions`

**Description:** Crée une nouvelle transaction de paiement.

#### Requête

```json
{
  "amount": 349990.00,
  "currency": "XOF",
  "type": "sale",
  "paymentMethod": "mobile_money",
  "provider": "orange_money",
  "reference": "ORD-2025-0456",
  "customerPhone": "+22501234567",
  "customerName": "Client Example",
  "description": "Achat Smartphone XYZ Pro",
  "metadata": {
    "orderId": "order-uuid-7890",
    "salesPersonId": "user-uuid-5678"
  }
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "transactionId": "txn-uuid-1234",
    "amount": 349990.00,
    "currency": "XOF",
    "type": "sale",
    "status": "pending",
    "paymentMethod": "mobile_money",
    "provider": "orange_money",
    "reference": "ORD-2025-0456",
    "customerPhone": "+22501234567",
    "customerName": "Client Example",
    "description": "Achat Smartphone XYZ Pro",
    "fees": 1749.95,
    "netAmount": 348240.05,
    "paymentUrl": "https://payment.ksmall.com/redirect/txn-uuid-1234",
    "createdAt": "2025-04-25T15:30:00Z",
    "expiresAt": "2025-04-25T16:00:00Z",
    "metadata": {
      "orderId": "order-uuid-7890",
      "salesPersonId": "user-uuid-5678"
    }
  },
  "message": "Transaction créée avec succès"
}
```

### 2. Vérifier l'État d'une Transaction

**Endpoint:** `GET /api/v1/payments/transactions/{transactionId}`

**Description:** Récupère les détails et l'état actuel d'une transaction.

#### Requête

*Nécessite un token d'authentification dans l'en-tête*

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "transactionId": "txn-uuid-1234",
    "amount": 349990.00,
    "currency": "XOF",
    "type": "sale",
    "status": "completed",
    "paymentMethod": "mobile_money",
    "provider": "orange_money",
    "providerTransactionId": "OM12345678",
    "reference": "ORD-2025-0456",
    "customerPhone": "+22501234567",
    "customerName": "Client Example",
    "description": "Achat Smartphone XYZ Pro",
    "fees": 1749.95,
    "netAmount": 348240.05,
    "createdAt": "2025-04-25T15:30:00Z",
    "completedAt": "2025-04-25T15:32:45Z",
    "receiptUrl": "https://receipts.ksmall.com/txn-uuid-1234",
    "metadata": {
      "orderId": "order-uuid-7890",
      "salesPersonId": "user-uuid-5678"
    }
  },
  "message": "Transaction récupérée avec succès"
}
```

### 3. Annuler une Transaction

**Endpoint:** `POST /api/v1/payments/transactions/{transactionId}/cancel`

**Description:** Annule une transaction en attente ou demande un remboursement pour une transaction complétée.

#### Requête

*Nécessite un token d'authentification dans l'en-tête*

```json
{
  "reason": "Client a changé d'avis",
  "notes": "Remboursement complet accordé"
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "transactionId": "txn-uuid-1234",
    "originalStatus": "completed", 
    "currentStatus": "refund_pending", 
    "refundId": "rfd-uuid-5678", 
    "cancelledAt": "2025-04-25T16:15:00Z",
    "cancelledBy": "user-uuid-1234",
    "reason": "Client a changé d'avis",
    "notes": "Remboursement complet accordé"
  },
  "message": "Demande d'annulation/remboursement soumise avec succès"
}
```

### 4. Liste des Transactions

**Endpoint:** `GET /api/v1/payments/transactions`

**Description:** Récupère une liste paginée des transactions selon les filtres appliqués.

#### Paramètres de requête

- `startDate` (optionnel): Date de début (format: YYYY-MM-DD)
- `endDate` (optionnel): Date de fin (format: YYYY-MM-DD) 
- `status` (optionnel): État de la transaction (pending, completed, failed, refunded)
- `type` (optionnel): Type de transaction (sale, refund, deposit, withdrawal)
- `paymentMethod` (optionnel): Méthode de paiement (cash, card, mobile_money, bank_transfer)
- `minAmount` (optionnel): Montant minimum
- `maxAmount` (optionnel): Montant maximum
- `reference` (optionnel): Numéro de référence
- `customerPhone` (optionnel): Numéro de téléphone du client
- `page` (optionnel, défaut=1): Numéro de page
- `limit` (optionnel, défaut=20): Nombre d'éléments par page

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "transactions": [
      {
        "transactionId": "txn-uuid-1234",
        "amount": 349990.00,
        "currency": "XOF",
        "type": "sale",
        "status": "completed",
        "paymentMethod": "mobile_money",
        "provider": "orange_money",
        "reference": "ORD-2025-0456",
        "customerName": "Client Example",
        "createdAt": "2025-04-25T15:30:00Z",
        "completedAt": "2025-04-25T15:32:45Z"
      },
      {
        "transactionId": "txn-uuid-2345",
        "amount": 129990.00,
        "currency": "XOF",
        "type": "sale",
        "status": "completed",
        "paymentMethod": "cash",
        "provider": null,
        "reference": "ORD-2025-0457",
        "customerName": "Client Exemple 2",
        "createdAt": "2025-04-25T16:15:00Z", 
        "completedAt": "2025-04-25T16:15:00Z"
      }
    ],
    "summary": {
      "totalCount": 45,
      "totalAmount": 5485000.00,
      "completedCount": 42,
      "pendingCount": 1,
      "failedCount": 1,
      "refundedCount": 1,
      "totalFees": 27425.00,
      "netAmount": 5457575.00
    }
  },
  "pagination": {
    "totalItems": 45,
    "totalPages": 3,
    "currentPage": 1,
    "itemsPerPage": 20
  },
  "message": "Transactions récupérées avec succès"
}
```

### 5. Générer un Reçu

**Endpoint:** `GET /api/v1/payments/transactions/{transactionId}/receipt`

**Description:** Génère un reçu pour une transaction complétée.

#### Paramètres de requête

- `format` (optionnel, défaut=pdf): Format du reçu (pdf, html, json)
- `template` (optionnel): Identifiant du modèle de reçu à utiliser

#### Réponse

Pour `format=json`:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "transactionId": "txn-uuid-1234",
    "receiptNumber": "REC-2025-0456",
    "business": {
      "name": "Ma Boutique",
      "address": "123 Rue Commerce, Ville, Pays",
      "phone": "+22567890123",
      "email": "contact@maboutique.com",
      "taxId": "TAX12345",
      "logo": "https://storage.ksmall.com/businesses/logos/logo-uuid-1234.png"
    },
    "customer": {
      "name": "Client Example",
      "phone": "+22501234567",
      "email": "client@example.com"
    },
    "transaction": {
      "reference": "ORD-2025-0456",
      "date": "2025-04-25T15:32:45Z",
      "paymentMethod": "Orange Money",
      "providerTransactionId": "OM12345678"
    },
    "items": [
      {
        "description": "Smartphone XYZ Pro",
        "quantity": 1,
        "unitPrice": 349990.00,
        "totalPrice": 349990.00,
        "taxRate": 18.0,
        "taxAmount": 53355.93
      }
    ],
    "totals": {
      "subtotal": 296634.07,
      "taxTotal": 53355.93,
      "discount": 0,
      "total": 349990.00,
      "amountPaid": 349990.00,
      "balance": 0.00
    },
    "additionalInfo": {
      "notes": "Merci pour votre achat!",
      "returnPolicy": "Retours acceptés sous 14 jours avec emballage d'origine"
    },
    "barcodeData": "REC-2025-0456",
    "qrCodeData": "https://receipts.ksmall.com/verify/txn-uuid-1234"
  },
  "message": "Reçu généré avec succès"
}
```

Pour `format=pdf` ou `format=html`, la réponse sera un fichier binaire avec l'en-tête `Content-Type` approprié.

### 6. Configurer les Méthodes de Paiement

**Endpoint:** `PUT /api/v1/payments/methods`

**Description:** Configure les méthodes de paiement acceptées pour le compte.

#### Requête

```json
{
  "enabledMethods": [
    {
      "method": "mobile_money",
      "providers": ["orange_money", "mtn_money", "moov_money"],
      "isDefault": true,
      "config": {
        "orange_money": {
          "merchantId": "OM_MERCHANT_ID",
          "webhook": true
        },
        "mtn_money": {
          "merchantId": "MTN_MERCHANT_ID",
          "webhook": true
        },
        "moov_money": {
          "merchantId": "MOOV_MERCHANT_ID",
          "webhook": true
        }
      }
    },
    {
      "method": "cash",
      "providers": [],
      "isDefault": false,
      "config": {}
    },
    {
      "method": "card",
      "providers": ["visa", "mastercard"],
      "isDefault": false,
      "config": {
        "processorId": "CARD_PROCESSOR_ID",
        "allowSaveCard": true
      }
    }
  ],
  "offlinePayments": {
    "enabled": true,
    "requiresApproval": true,
    "allowedMethods": ["cash", "bank_transfer"]
  }
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "enabledMethods": [
      {
        "method": "mobile_money",
        "providers": ["orange_money", "mtn_money", "moov_money"],
        "isDefault": true,
        "config": {
          "orange_money": {
            "merchantId": "OM_MERCHANT_ID",
            "webhook": true,
            "status": "active"
          },
          "mtn_money": {
            "merchantId": "MTN_MERCHANT_ID",
            "webhook": true,
            "status": "active"
          },
          "moov_money": {
            "merchantId": "MOOV_MERCHANT_ID",
            "webhook": true,
            "status": "active"
          }
        }
      },
      {
        "method": "cash",
        "providers": [],
        "isDefault": false,
        "status": "active"
      },
      {
        "method": "card",
        "providers": ["visa", "mastercard"],
        "isDefault": false,
        "config": {
          "processorId": "CARD_PROCESSOR_ID",
          "allowSaveCard": true,
          "status": "active"
        }
      }
    ],
    "offlinePayments": {
      "enabled": true,
      "requiresApproval": true,
      "allowedMethods": ["cash", "bank_transfer"]
    },
    "updatedAt": "2025-04-25T17:00:00Z"
  },
  "message": "Méthodes de paiement configurées avec succès"
}
```

### 7. Demande de Retrait

**Endpoint:** `POST /api/v1/payments/withdrawals`

**Description:** Initie une demande de retrait vers un compte bancaire ou mobile money.

#### Requête

```json
{
  "amount": 1000000.00,
  "currency": "XOF",
  "destination": {
    "type": "mobile_money",
    "provider": "orange_money",
    "accountNumber": "+22501234567",
    "accountName": "Nom du Propriétaire"
  },
  "description": "Retrait hebdomadaire",
  "metadata": {
    "category": "operational_expenses"
  }
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "withdrawalId": "wdr-uuid-1234",
    "amount": 1000000.00,
    "currency": "XOF",
    "fees": 5000.00,
    "netAmount": 995000.00,
    "status": "pending",
    "destination": {
      "type": "mobile_money",
      "provider": "orange_money",
      "accountNumber": "+225*****4567",
      "accountName": "Nom du Propriétaire"
    },
    "description": "Retrait hebdomadaire",
    "estimatedArrivalTime": "2025-04-26T12:00:00Z",
    "createdAt": "2025-04-25T17:15:00Z",
    "metadata": {
      "category": "operational_expenses"
    }
  },
  "message": "Demande de retrait créée avec succès"
}
```

## Codes d'erreur et messages

| Code | Message | Description |
|------|---------|-------------|
| 400 | "Données de paiement invalides" | Les données fournies pour la transaction ne sont pas valides |
| 401 | "Non autorisé" | Authentification requise |
| 402 | "Paiement requis" | L'opération nécessite un paiement préalable |
| 403 | "Accès refusé" | Pas assez de permissions pour effectuer cette opération |
| 404 | "Transaction non trouvée" | La transaction demandée n'existe pas |
| 409 | "Transaction déjà traitée" | Une tentative de modifier une transaction déjà complétée ou annulée |
| 422 | "Fonds insuffisants" | Le compte n'a pas assez de fonds pour effectuer l'opération |
| 424 | "Échec du traitement par le fournisseur de paiement" | Le fournisseur de paiement a rejeté la transaction |
| 500 | "Erreur serveur lors du traitement du paiement" | Erreur interne du serveur |

## Bonnes pratiques de gestion des paiements

1. Toujours vérifier l'état final d'une transaction via l'API avant de confirmer une commande
2. Implémenter des mécanismes de réconciliation quotidienne entre les transactions enregistrées et les rapports des fournisseurs de paiement
3. Configurer correctement les webhooks pour recevoir les notifications de paiement en temps réel
4. Générer et stocker les reçus pour toutes les transactions complétées
5. Utiliser des références uniques pour chaque transaction afin de faciliter le suivi
6. Ne jamais stocker les données de carte de crédit complètes, utiliser un service conforme PCI-DSS