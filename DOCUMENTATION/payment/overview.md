# API de Paiement et Services

Ce document décrit les API et services de paiement utilisés dans l'application Ksmall.

## Vue d'ensemble

Les API de paiement permettent de gérer les transactions financières, les différents modes de paiement, les reçus et les rapports financiers.

## Architecture des Services de Paiement

### Structure des fichiers

```
src/
├── services/
│   ├── PaymentService.ts             # Service principal pour les opérations de paiement
│   ├── ReceiptGeneratorService.ts    # Service pour la génération de reçus
│   ├── TransactionService.ts         # Service pour la gestion des transactions
│   └── api/
│       └── payment/
│           └── PaymentApiService.ts  # Service API pour les requêtes de paiement
├── hooks/
│   └── api/
│       └── usePayment.ts             # Hooks personnalisés pour les opérations de paiement
├── context/
│   └── PaymentContext.tsx           # Contexte React pour l'état global des paiements
└── utils/
    ├── paymentProviders/
    │   ├── orangeMoney.ts           # Intégration avec Orange Money
    │   ├── mtnMoney.ts              # Intégration avec MTN Money
    │   └── cardProcessor.ts         # Traitement des paiements par carte
    └── validations/
        └── paymentValidations.ts    # Validation des données de paiement
```

### Flux de Données de Paiement

1. **Initialisation** : L'interface utilisateur initie une demande de paiement
2. **Traitement par les Hooks** : Les hooks `usePayment()` appellent les méthodes de `PaymentService`
3. **Communication avec l'API** : `PaymentApiService` transmet la demande au backend
4. **Intégration avec les Prestataires** : Le backend communique avec les différents prestataires de paiement
5. **Réception et Traitement des Réponses** : Les réponses sont traitées et le statut est mis à jour

### Gestion des Erreurs et Fallbacks

Le module de paiement implémente plusieurs niveaux de gestion d'erreurs pour garantir l'intégrité des transactions :

#### 1. Validation Préalable

Avant toute tentative de paiement, une validation complète des données est effectuée :

```typescript
// Dans PaymentService.ts
async validatePaymentRequest(request: PaymentRequest): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  
  // Validation des champs obligatoires
  if (!request.amount || request.amount <= 0) {
    errors.push({ field: 'amount', message: 'Le montant doit être positif' });
  }
  
  if (!request.currency) {
    errors.push({ field: 'currency', message: 'La devise est requise' });
  }
  
  if (!request.paymentMethod) {
    errors.push({ field: 'paymentMethod', message: 'La méthode de paiement est requise' });
  }
  
  // Validation spécifique au mode de paiement
  if (request.paymentMethod === 'mobile_money') {
    if (!request.customerPhone) {
      errors.push({ field: 'customerPhone', message: 'Le numéro de téléphone est requis pour le mobile money' });
    }
    
    // Vérifier la conformité du numéro selon le fournisseur
    if (request.provider === 'orange_money' && !isValidOrangeMoneyNumber(request.customerPhone)) {
      errors.push({ field: 'customerPhone', message: 'Numéro de téléphone non valide pour Orange Money' });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

#### 2. Double Vérification des Transactions

Chaque transaction fait l'objet d'une double vérification pour éviter les problèmes courants :

```typescript
// Dans TransactionService.ts
async verifyTransactionStatus(transactionId: string): Promise<TransactionStatus> {
  try {
    // Vérifier d'abord dans notre base de données
    const localTransaction = await this.getTransactionById(transactionId);
    
    if (!localTransaction) {
      throw new TransactionNotFoundError(transactionId);
    }
    
    // Si la transaction est déjà dans un état final, pas besoin de vérifier auprès du prestataire
    if (['completed', 'failed', 'refunded', 'cancelled'].includes(localTransaction.status)) {
      return localTransaction.status;
    }
    
    // Sinon, vérifier auprès du prestataire de paiement
    try {
      const provider = PaymentProviderFactory.getProvider(localTransaction.provider);
      const providerStatus = await provider.checkTransactionStatus(localTransaction.providerTransactionId);
      
      // Mettre à jour notre base de données si le statut a changé
      if (providerStatus !== localTransaction.status) {
        await this.updateTransactionStatus(transactionId, providerStatus);
        
        // Déclencher les actions post-traitement appropriées (génération de reçu, etc.)
        await this.executePostTransactionActions(transactionId, providerStatus);
        
        return providerStatus;
      }
      
      return localTransaction.status;
    } catch (providerError) {
      logger.warn('Erreur lors de la vérification auprès du prestataire de paiement', {
        error: providerError,
        transactionId
      });
      
      // En cas d'erreur avec le prestataire, renvoyer le statut local mais avec un avertissement
      return {
        status: localTransaction.status,
        verificationSource: 'local_only',
        lastVerificationAttempt: new Date().toISOString(),
        warnings: ['Impossible de vérifier le statut auprès du prestataire de paiement']
      };
    }
  } catch (error) {
    logger.error('Erreur lors de la vérification du statut de la transaction', {
      error,
      transactionId
    });
    throw error;
  }
}
```

#### 3. Gestion des Retards et Expirations

Les paiements mobiles peuvent prendre du temps ou expirer - le système gère automatiquement ces cas :

```typescript
// Dans PaymentService.ts
startTransactionExpirationTimer(transactionId: string, expirationMinutes = 30): void {
  // Programmation d'une vérification après expiration
  setTimeout(async () => {
    const transaction = await this.getTransactionById(transactionId);
    
    // Ne rien faire si la transaction n'existe pas ou est déjà dans un état final
    if (!transaction || ['completed', 'failed', 'refunded', 'cancelled'].includes(transaction.status)) {
      return;
    }
    
    // Vérifier une dernière fois auprès du prestataire
    try {
      const finalStatus = await this.verifyTransactionStatus(transactionId);
      
      // Si toujours en attente, marquer comme expirée
      if (finalStatus === 'pending') {
        await this.updateTransactionStatus(transactionId, 'expired');
        logger.info(`Transaction ${transactionId} marquée comme expirée après ${expirationMinutes} minutes`);
        
        // Notifier l'utilisateur si nécessaire
        try {
          await this.sendTransactionExpirationNotification(transaction);
        } catch (notificationError) {
          logger.warn('Erreur lors de l\'envoi de la notification d\'expiration', {
            error: notificationError,
            transactionId
          });
        }
      }
    } catch (error) {
      logger.error('Erreur lors de la vérification finale avant expiration', {
        error,
        transactionId
      });
    }
  }, expirationMinutes * 60 * 1000);
}
```

#### 4. Mode Hors Ligne pour les Paiements en Espèces

Pour les paiements en espèces, un mode hors ligne est disponible :

```typescript
// Dans PaymentService.ts
async processOfflinePayment(paymentData: OfflinePaymentRequest): Promise<OfflinePaymentResult> {
  try {
    // Enregistrer la transaction localement
    const transaction = {
      transactionId: generateUUID(),
      amount: paymentData.amount,
      currency: paymentData.currency,
      type: paymentData.type,
      status: 'completed',
      paymentMethod: 'cash',
      provider: null,
      reference: paymentData.reference || generateReference(),
      customerName: paymentData.customerName,
      customerPhone: paymentData.customerPhone,
      description: paymentData.description,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      createdBy: paymentData.cashierId,
      isOffline: true,
      synced: false
    };
    
    // Stocker dans la base de données locale
    await DatabaseService.storeTransaction(transaction);
    
    // Mettre en file d'attente pour synchronisation ultérieure
    if (NetworkService.isConnected) {
      this.syncOfflineTransaction(transaction.transactionId)
        .catch(error => logger.error('Échec de la synchronisation initiale', { error, transactionId: transaction.transactionId }));
    } else {
      await OfflineQueueService.enqueue('sync_transaction', { transactionId: transaction.transactionId });
    }
    
    // Générer un reçu local
    const receipt = await ReceiptGeneratorService.generateOfflineReceipt(transaction);
    
    return {
      transaction,
      receipt,
      syncStatus: NetworkService.isConnected ? 'syncing' : 'queued'
    };
  } catch (error) {
    logger.error('Erreur lors du traitement du paiement hors ligne', { error });
    throw new Error('Impossible de traiter le paiement hors ligne: ' + error.message);
  }
}
```

#### 5. Supervision et Réconciliation Automatique

Le système effectue des réconciliations automatiques pour détecter les anomalies :

```typescript
// Dans PaymentReconciliationService.ts
async reconcileDailyTransactions(date = new Date()): Promise<ReconciliationReport> {
  const formattedDate = formatDate(date, 'YYYY-MM-DD');
  logger.info(`Démarrage de la réconciliation pour ${formattedDate}`);
  
  try {
    // Récupérer toutes les transactions de la journée depuis notre système
    const localTransactions = await TransactionService.getTransactionsByDateRange({
      startDate: startOfDay(date),
      endDate: endOfDay(date)
    });
    
    // Récupérer les transactions depuis les différents prestataires de paiement
    const providerTransactions = await this.fetchAllProviderTransactions(date);
    
    // Analyser les incohérences
    const { matched, unmatched, mismatched } = this.compareTransactions(localTransactions, providerTransactions);
    
    // Corriger automatiquement certaines incohérences
    const correctionResults = await this.attemptAutomaticCorrections(mismatched, unmatched);
    
    // Générer et sauvegarder le rapport
    const report = {
      date: formattedDate,
      totalLocalTransactions: localTransactions.length,
      totalProviderTransactions: providerTransactions.length,
      matched: matched.length,
      unmatched: unmatched.length,
      mismatched: mismatched.length,
      automaticallyCorrected: correctionResults.corrected.length,
      manualReviewRequired: correctionResults.manualReview.length,
      details: {
        matched,
        unmatched,
        mismatched,
        corrected: correctionResults.corrected,
        manualReview: correctionResults.manualReview
      }
    };
    
    await DatabaseService.storeReconciliationReport(report);
    
    // Si des problèmes nécessitent une intervention manuelle, créer une alerte
    if (correctionResults.manualReview.length > 0) {
      await NotificationService.createReconciliationAlert({
        date: formattedDate,
        count: correctionResults.manualReview.length,
        totalAmount: calculateTotalAmount(correctionResults.manualReview)
      });
    }
    
    return report;
  } catch (error) {
    logger.error('Erreur lors de la réconciliation des transactions', { error, date: formattedDate });
    throw new Error(`Échec de la réconciliation pour ${formattedDate}: ${error.message}`);
  }
}
```

## Intégration avec d'autres modules

Le module de paiement s'intègre avec plusieurs autres services de l'application :

1. **Service de facturation** : Pour générer et mettre à jour les factures
2. **Service d'inventaire** : Pour vérifier les disponibilités et mettre à jour les stocks
3. **Service comptable** : Pour générer les écritures comptables
4. **Service de notifications** : Pour avertir les clients et les administrateurs

### Exemple d'intégration avec le service comptable

```typescript
// Dans PaymentService.ts
async generateAccountingEntries(transaction: Transaction): Promise<void> {
  try {
    // Si la transaction n'est pas complétée, ne rien faire
    if (transaction.status !== 'completed') {
      return;
    }
    
    // Préparer les données pour l'écriture comptable
    const entryData = {
      date: transaction.completedAt || transaction.createdAt,
      type: 'payment',
      amount: transaction.amount,
      currency: transaction.currency,
      description: `Paiement ${transaction.paymentMethod} - Réf: ${transaction.reference}`,
      reference: transaction.transactionId,
      metadata: {
        transactionId: transaction.transactionId,
        paymentMethod: transaction.paymentMethod,
        provider: transaction.provider
      }
    };
    
    // Générer l'écriture selon le type de paiement
    let journalEntry;
    
    if (transaction.type === 'sale') {
      // Vente - Débit compte de trésorerie, crédit compte de produit
      journalEntry = await AccountingService.createSalePaymentEntry(entryData);
    } else if (transaction.type === 'refund') {
      // Remboursement - Débit compte de produit, crédit compte de trésorerie
      journalEntry = await AccountingService.createRefundPaymentEntry(entryData);
    } else {
      // Autre type de transaction
      journalEntry = await AccountingService.createGenericPaymentEntry(entryData);
    }
    
    logger.info('Écriture comptable générée avec succès', {
      transactionId: transaction.transactionId,
      journalEntryId: journalEntry.id
    });
    
    // Mettre à jour la transaction avec la référence à l'écriture comptable
    await this.updateTransaction(transaction.transactionId, {
      accountingEntryId: journalEntry.id
    });
  } catch (error) {
    logger.error('Erreur lors de la génération des écritures comptables', {
      error,
      transactionId: transaction.transactionId
    });
    
    // Créer une tâche pour résolution manuelle
    await TaskService.createTask({
      type: 'accounting_reconciliation',
      status: 'pending',
      priority: 'high',
      title: `Réconciliation comptable requise pour la transaction ${transaction.transactionId}`,
      description: `Erreur lors de la génération automatique: ${error.message}`,
      data: {
        transactionId: transaction.transactionId,
        error: error.message
      }
    });
  }
}
```

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

## Sécurité et Conformité

### 1. Protection des Données Sensibles

Le module de paiement implémente des mesures strictes pour protéger les données sensibles :

- Masquage des numéros de téléphone et coordonnées bancaires dans les logs et les réponses API
- Absence de stockage des données de carte complètes (conformité PCI-DSS)
- Chiffrement des données de transaction en transit et au repos
- Accès avec privilèges minimaux aux fonctionnalités de paiement

### 2. Prévention de la Fraude

Plusieurs mécanismes de détection et prévention de la fraude sont intégrés :

```typescript
// Dans FraudDetectionService.ts
async analyzeTransaction(transaction: Transaction): Promise<FraudAnalysisResult> {
  // Récupérer l'historique des transactions du client
  const customerHistory = await TransactionService.getCustomerTransactionHistory(
    transaction.customerPhone || transaction.customerName
  );
  
  // Facteurs de risque à évaluer
  const riskFactors = [];
  let riskScore = 0;
  
  // 1. Montant inhabituel
  const averageAmount = calculateAverageAmount(customerHistory);
  if (transaction.amount > averageAmount * 5) {
    riskFactors.push('unusual_amount');
    riskScore += 25;
  }
  
  // 2. Fréquence inhabituelle
  if (customerHistory.length >= 3) {
    const lastTransactionTime = new Date(customerHistory[0].createdAt).getTime();
    const secondLastTransactionTime = new Date(customerHistory[1].createdAt).getTime();
    
    // Calculer l'intervalle moyen entre les transactions
    const averageInterval = calculateAverageInterval(customerHistory);
    const currentInterval = lastTransactionTime - secondLastTransactionTime;
    
    if (currentInterval < averageInterval * 0.2) {
      riskFactors.push('unusual_frequency');
      riskScore += 15;
    }
  }
  
  // 3. Changement de comportement géographique
  if (transaction.metadata?.location) {
    const unusualLocation = isUnusualLocation(transaction.metadata.location, customerHistory);
    if (unusualLocation) {
      riskFactors.push('unusual_location');
      riskScore += 20;
    }
  }
  
  // Déterminer l'action à prendre
  let action = 'approve';
  if (riskScore >= 60) {
    action = 'block';
  } else if (riskScore >= 40) {
    action = 'review';
  }
  
  return {
    riskScore,
    riskFactors,
    action,
    customerId: transaction.customerPhone || transaction.customerName,
    transactionId: transaction.transactionId,
    timestamp: new Date().toISOString()
  };
}
```

## Déboggage et Dépannage

### Problème : Transaction bloquée en état 'pending'

**Solutions** :

1. Vérifier manuellement le statut via l'API de vérification
2. Vérifier les webhooks pour s'assurer qu'ils sont correctement configurés
3. Utiliser l'outil de réconciliation pour forcer une vérification
4. Contacter le prestataire de paiement avec l'ID de référence

### Problème : Échecs fréquents des paiements mobiles

**Solutions** :

1. Vérifier que les numéros de téléphone sont au format international (+XXX)
2. S'assurer que les comptes clients ont des fonds suffisants
3. Vérifier les limitations de transaction par jour/semaine
4. Tester avec des montants plus petits pour identifier les seuils problématiques

### Problème : Incohérences dans les rapports financiers

**Solutions** :

1. Exécuter l'outil de réconciliation manuellement
2. Vérifier les transactions non synchronisées depuis le mode hors ligne
3. Comparer les reçus générés avec les transactions enregistrées
4. Vérifier les écritures comptables générées pour chaque transaction

## Mises à jour récentes (Avril 2025)

- Introduction du système de détection de fraude adaptatif
- Amélioration des réconciliations automatiques avec correction intelligente
- Support complet du mode hors ligne pour tous les types de paiement
- Intégration améliorée avec le module comptable pour les rapprochements automatiques
- Nouveaux prestataires de paiement ajoutés (Wave Money, Visa QR)
- Optimisation des performances du traitement des webhooks (+60% de débit)

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

---

_Dernière mise à jour: 30 avril 2025_