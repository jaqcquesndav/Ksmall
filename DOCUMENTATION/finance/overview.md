# API de Financement et Services - Documentation

Cette section documente les API et services de financement disponibles dans l'application Ksmall. Ces API permettent aux entreprises de soumettre des demandes de financement, de gérer les documents requis, de recevoir et d'évaluer des offres, et de gérer leurs financements actifs.

## Architecture des Services de Financement

### Structure des fichiers

```
src/
├── services/
│   ├── FinanceService.ts           # Service principal pour les opérations de financement
│   ├── DocumentUploadService.ts    # Service pour la gestion des téléchargements de documents
│   ├── RiskAnalysisService.ts      # Service d'analyse de risque pour les demandes de financement
│   ├── FinancialModelsService.ts   # Service pour les modèles de prédiction financière
│   └── api/
│       └── finance/
│           ├── FinanceApiService.ts # Service API pour les requêtes financières
│           └── LenderApiService.ts  # Service API pour la communication avec les prêteurs
├── hooks/
│   └── api/
│       ├── useFinance.ts           # Hooks personnalisés pour les opérations de financement
│       └── useRiskAnalysis.ts      # Hooks pour l'analyse de risque
├── context/
│   └── FinanceContext.tsx         # Contexte React pour l'état global du financement
└── utils/
    ├── adapters/
    │   └── financeAdapters.ts     # Adaptateurs pour la conversion entre types de données
    └── risk/
        ├── creditScoring.ts       # Algorithmes de notation de crédit
        ├── fraudDetection.ts      # Système de détection de fraude
        └── sectorAnalysis.ts      # Analyse des risques sectoriels
```

### Flux de Données de Financement

1. **Saisie de Demande** : L'utilisateur remplit un formulaire de demande de financement
2. **Traitement par les Hooks** : Les hooks `useFinance()` appellent les méthodes de `FinanceService`
3. **Téléchargement de Documents** : `DocumentUploadService` gère l'envoi des pièces justificatives
4. **Analyse de Risque** : `RiskAnalysisService` évalue le profil de risque de la demande
5. **Communication avec l'API** : `FinanceApiService` transmet la demande aux partenaires financiers
6. **Réception et Traitement des Offres** : Les offres sont reçues, transformées par les adaptateurs, et présentées à l'utilisateur

## Algorithmes d'Analyse de Risque

Le module finance intègre des algorithmes sophistiqués d'analyse de risque qui évaluent automatiquement les demandes de financement. Ces algorithmes combinent plusieurs facteurs pour déterminer la solvabilité et le niveau de risque d'une entreprise.

### Système de Notation de Crédit

Le système de notation de crédit utilise un modèle à plusieurs variables pour attribuer un score entre 300 et 850 :

```typescript
// Dans RiskAnalysisService.ts
async calculateCreditScore(applicationId: string): Promise<CreditScoreResult> {
  try {
    // Récupérer les données de la demande
    const application = await this.getApplicationDetails(applicationId);
    
    // Récupérer les données financières de l'entreprise
    const financialData = await AccountingService.getFinancialMetrics(application.companyId);
    
    // Récupérer l'historique des paiements
    const paymentHistory = await PaymentService.getCompanyPaymentHistory(application.companyId);
    
    // Récupérer l'historique des financements
    const financingHistory = await this.getCompanyFinancingHistory(application.companyId);
    
    // 1. Calcul du score basé sur les ratios financiers (35% du score total)
    const financialScore = this.calculateFinancialRatiosScore({
      currentRatio: financialData.currentRatio,
      debtToEquityRatio: financialData.debtToEquityRatio,
      profitMargin: financialData.profitMargin,
      returnOnAssets: financialData.returnOnAssets,
      cashFlow: financialData.cashFlow
    });
    
    // 2. Calcul du score basé sur l'historique des paiements (30% du score total)
    const paymentScore = this.calculatePaymentHistoryScore(paymentHistory);
    
    // 3. Calcul du score basé sur l'ancienneté de l'entreprise (15% du score total)
    const companyAgeScore = this.calculateCompanyAgeScore(financialData.companyAgeDays);
    
    // 4. Calcul du score basé sur l'historique des financements (15% du score total)
    const financingScore = this.calculateFinancingHistoryScore(financingHistory);
    
    // 5. Calcul du score basé sur le secteur d'activité (5% du score total)
    const sectorScore = await this.calculateSectorScore(financialData.industrySectorCode);
    
    // Calcul du score total pondéré (sur 850)
    const weightedScore = (
      financialScore * 0.35 +
      paymentScore * 0.30 +
      companyAgeScore * 0.15 +
      financingScore * 0.15 +
      sectorScore * 0.05
    ) * 850;
    
    // Arrondir le score à l'entier le plus proche et le plafonner entre 300 et 850
    const finalScore = Math.max(300, Math.min(850, Math.round(weightedScore)));
    
    // Déterminer la catégorie de risque
    const riskCategory = this.determineRiskCategory(finalScore);
    
    // Générer et stocker le rapport de crédit
    const creditReport = {
      applicationId,
      companyId: application.companyId,
      creditScore: finalScore,
      riskCategory,
      components: {
        financialScore: financialScore * 0.35 * 850,
        paymentScore: paymentScore * 0.30 * 850,
        companyAgeScore: companyAgeScore * 0.15 * 850,
        financingScore: financingScore * 0.15 * 850,
        sectorScore: sectorScore * 0.05 * 850
      },
      recommendations: this.generateRecommendations(finalScore, financialData),
      createdAt: new Date().toISOString()
    };
    
    await this.storeCreditReport(creditReport);
    
    return {
      score: finalScore,
      category: riskCategory,
      components: creditReport.components,
      recommendations: creditReport.recommendations
    };
  } catch (error) {
    logger.error('Erreur lors du calcul du score de crédit', {
      error,
      applicationId
    });
    throw new Error(`Échec du calcul du score de crédit: ${error.message}`);
  }
}
```

### Détection de Fraude

Le système intègre également un module de détection de fraude pour sécuriser le processus de financement :

```typescript
// Dans fraudDetection.ts
export async function detectFraudSignals(application: FinancingApplication, 
                                         documents: FinancingDocument[]): Promise<FraudDetectionResult> {
  // Liste des signaux de fraude potentiels
  const fraudSignals: FraudSignal[] = [];
  let riskScore = 0;
  
  // 1. Vérification de la cohérence des documents
  const documentConsistency = await checkDocumentConsistency(documents);
  if (!documentConsistency.consistent) {
    fraudSignals.push({
      type: 'DOCUMENT_INCONSISTENCY',
      details: documentConsistency.details,
      severity: 'high'
    });
    riskScore += 40;
  }
  
  // 2. Analyse des métadonnées des documents
  const docAnalysis = await analyzeDocumentMetadata(documents);
  if (docAnalysis.manipulationDetected) {
    fraudSignals.push({
      type: 'DOCUMENT_MANIPULATION',
      details: docAnalysis.details,
      severity: 'high'
    });
    riskScore += 45;
  }
  
  // 3. Vérification des informations d'identité
  const identityCheck = await verifyIdentityInformation(application);
  if (!identityCheck.verified) {
    fraudSignals.push({
      type: 'IDENTITY_VERIFICATION_FAILED',
      details: identityCheck.details,
      severity: 'critical'
    });
    riskScore += 60;
  }
  
  // 4. Analyse de la vitesse de soumission
  const submissionSpeedAnalysis = await analyzeSubmissionSpeed(application);
  if (submissionSpeedAnalysis.suspicious) {
    fraudSignals.push({
      type: 'SUSPICIOUS_SUBMISSION_SPEED',
      details: submissionSpeedAnalysis.details,
      severity: 'medium'
    });
    riskScore += 25;
  }
  
  // 5. Vérification de la cohérence des données financières
  const financialDataCheck = await checkFinancialDataConsistency(application);
  if (!financialDataCheck.consistent) {
    fraudSignals.push({
      type: 'FINANCIAL_DATA_INCONSISTENCY',
      details: financialDataCheck.details,
      severity: 'high'
    });
    riskScore += 35;
  }
  
  // Déterminer le niveau de risque global
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  if (riskScore >= 80) {
    riskLevel = 'critical';
  } else if (riskScore >= 50) {
    riskLevel = 'high';
  } else if (riskScore >= 30) {
    riskLevel = 'medium';
  }
  
  // Déterminer l'action recommandée
  let recommendedAction: 'proceed' | 'review' | 'reject' | 'escalate' = 'proceed';
  
  switch (riskLevel) {
    case 'critical':
      recommendedAction = 'escalate';
      break;
    case 'high':
      recommendedAction = 'reject';
      break;
    case 'medium':
      recommendedAction = 'review';
      break;
    default:
      recommendedAction = 'proceed';
  }
  
  return {
    applicationId: application.id,
    fraudSignals,
    riskScore,
    riskLevel,
    recommendedAction,
    timestamp: new Date().toISOString()
  };
}
```

### Modèles de Prédiction Financière

Le système intègre des modèles de Machine Learning pour prédire la performance future des entreprises :

```typescript
// Dans FinancialModelsService.ts
async predictCashFlow(companyId: string, 
                       months: number = 6): Promise<CashFlowPredictionResult> {
  try {
    // Récupérer l'historique des flux de trésorerie
    const cashFlowHistory = await AccountingService.getCashFlowHistory(companyId, 24); // 2 ans d'historique
    
    // Récupérer les données saisonnières
    const seasonalityData = await this.getSeasonalityData(companyId, cashFlowHistory);
    
    // Récupérer les tendances de croissance
    const growthTrends = this.calculateGrowthTrends(cashFlowHistory);
    
    // Récupérer les données macroéconomiques pertinentes pour le secteur
    const macroData = await this.getMacroEconomicData(companyId);
    
    // Préparer les données pour le modèle
    const modelInputs = this.prepareModelInputs(cashFlowHistory, seasonalityData, growthTrends, macroData);
    
    // Appliquer le modèle de prédiction (ARIMA, Prophet, ou ML personnalisé)
    const predictions = await this.applyPredictionModel(modelInputs, months);
    
    // Calculer les intervalles de confiance
    const confidenceIntervals = this.calculateConfidenceIntervals(predictions, cashFlowHistory.volatility);
    
    // Générer les scénarios (optimiste, pessimiste, moyen)
    const scenarios = this.generateScenarios(predictions, confidenceIntervals);
    
    // Analyser les points critiques (rupture de trésorerie potentielle)
    const criticalPoints = this.analyzeCriticalPoints(scenarios);
    
    return {
      companyId,
      predictionPeriod: {
        start: addDays(new Date(), 1),
        end: addMonths(new Date(), months)
      },
      monthlyPredictions: predictions,
      confidenceIntervals,
      scenarios,
      criticalPoints,
      recommendations: this.generateCashFlowRecommendations(scenarios, criticalPoints),
      metadata: {
        modelVersion: '3.2.1',
        predictionAccuracy: this.calculateModelAccuracy(cashFlowHistory),
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('Erreur lors de la prédiction des flux de trésorerie', {
      error,
      companyId
    });
    throw new Error(`Échec de la prédiction des flux de trésorerie: ${error.message}`);
  }
}
```

## Intégration avec les Partenaires Financiers

L'application intègre plusieurs partenaires financiers via des API sécurisées, permettant une expérience transparente pour l'utilisateur tout en offrant un accès à diverses options de financement.

### Architecture d'Intégration des Partenaires

```
   ┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
   │  Client Ksmall  │  <─────>│  API Financement │  <─────>│   Adaptateur     │
   └─────────────────┘         │      Ksmall      │         │   Finance        │
                               └──────────────────┘         └──────────────────┘
                                                                     ↓
┌───────────────────────────────────────────────────────────────────────────────────┐
│                             Gestionnaire d'Intégration                            │
└───────────────────────────────────────────────────────────────────────────────────┘
      ↙                  ↓                    ↓                   ↓                 ↘
┌──────────┐      ┌──────────┐        ┌──────────┐         ┌──────────┐       ┌──────────┐
│ Banque A │      │ Fintech B│        │ Prêteur C│         │ Banque D │       │ Fond E   │
│   API    │      │   API    │        │   API    │         │   API    │       │   API    │
└──────────┘      └──────────┘        └──────────┘         └──────────┘       └──────────┘
```

### Système de Routage Intelligent

Le système de routage intelligent détermine les meilleurs partenaires financiers pour chaque demande :

```typescript
// Dans LenderMatchingService.ts
async findOptimalLenders(application: FinancingApplication, 
                          creditScore: number): Promise<LenderMatchResult[]> {
  try {
    // Récupérer tous les partenaires financiers disponibles
    const allLenders = await FinanceApiService.getLenders();
    
    // Filtrer les prêteurs selon les critères de base
    const eligibleLenders = allLenders.filter(lender => {
      // Vérifier si le prêteur offre le type de financement demandé
      const supportsFinancingType = lender.supportedProducts.includes(application.type);
      
      // Vérifier si le prêteur prête dans la devise demandée
      const supportsCurrency = lender.supportedCurrencies.includes(application.currency);
      
      // Vérifier si le montant demandé est dans la fourchette du prêteur
      const amountInRange = application.amount >= lender.minimumAmount && 
                           application.amount <= lender.maximumAmount;
      
      // Vérifier si le score de crédit dépasse le minimum requis
      const meetsMinimumCreditScore = creditScore >= lender.minimumCreditScore;
      
      return supportsFinancingType && supportsCurrency && amountInRange && meetsMinimumCreditScore;
    });
    
    // Pour chaque prêteur éligible, calculer un score de correspondance
    const lenderMatches = await Promise.all(eligibleLenders.map(async lender => {
      // Calculer un score de correspondance basé sur plusieurs facteurs
      const matchFactors = {
        // Facteur 1: Distance par rapport au score de crédit idéal du prêteur
        creditScoreMatch: this.calculateCreditScoreMatch(creditScore, lender.idealCreditScoreRange),
        
        // Facteur 2: Correspondance sectorielle (certains prêteurs préfèrent certains secteurs)
        sectorMatch: await this.calculateSectorMatch(application.companySector, lender.preferredSectors),
        
        // Facteur 3: Historique avec ce prêteur
        relationshipScore: await this.calculateRelationshipScore(application.companyId, lender.id),
        
        // Facteur 4: Taux d'acceptation historique pour des demandes similaires
        acceptanceRate: await this.getHistoricalAcceptanceRate(lender.id, application.type, creditScore),
        
        // Facteur 5: Temps de traitement moyen pour des demandes similaires
        processingTimeScore: this.calculateProcessingTimeScore(lender.averageProcessingTime)
      };
      
      // Calculer le score de correspondance global (0-100)
      const matchScore = 
        matchFactors.creditScoreMatch * 0.3 +
        matchFactors.sectorMatch * 0.2 +
        matchFactors.relationshipScore * 0.15 +
        matchFactors.acceptanceRate * 0.25 +
        matchFactors.processingTimeScore * 0.1;
      
      // Prédire les conditions probables basées sur des demandes similaires
      const likelyTerms = await this.predictLikelyTerms(
        lender.id, 
        application.type, 
        application.amount, 
        creditScore
      );
      
      return {
        lenderId: lender.id,
        lenderName: lender.name,
        lenderLogo: lender.logoUrl,
        matchScore: Math.round(matchScore * 100) / 100,
        matchFactors,
        likelyTerms,
        estimatedResponseTime: lender.averageProcessingTime,
        recommendationReason: this.generateRecommendationReason(matchFactors, likelyTerms)
      };
    }));
    
    // Trier les correspondances par score descendant
    return lenderMatches.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    logger.error('Erreur lors de la recherche des prêteurs optimaux', {
      error,
      applicationId: application.id
    });
    throw new Error(`Échec de la recherche des prêteurs: ${error.message}`);
  }
}
```

### Mécanismes de Backup et Failover

Pour garantir la fiabilité du service, des mécanismes de backup sont implémentés :

```typescript
// Dans LenderApiService.ts
async submitApplicationToLender(
  applicationId: string, 
  lenderId: string, 
  applicationData: LenderApplicationData
): Promise<LenderSubmissionResult> {
  try {
    // Récupérer les informations du prêteur
    const lender = await this.getLenderById(lenderId);
    
    // Adapter les données au format attendu par ce prêteur spécifique
    const adaptedData = this.formatApplicationForLender(applicationData, lender.apiFormat);
    
    // Tenter de soumettre la demande au prêteur
    try {
      const result = await this.sendApiRequest({
        lenderId,
        method: 'POST',
        endpoint: lender.endpoints.submitApplication,
        data: adaptedData,
        timeout: 30000 // 30 secondes
      });
      
      // Enregistrer le succès de la soumission
      await this.logApplicationSubmission({
        applicationId,
        lenderId,
        status: 'success',
        externalReferenceId: result.referenceId,
        submissionDate: new Date()
      });
      
      return {
        success: true,
        lenderReferenceId: result.referenceId,
        submissionDate: new Date().toISOString(),
        estimatedResponseTime: result.estimatedResponseTime || lender.averageProcessingTime
      };
    } catch (apiError) {
      logger.warn(`Échec de la soumission à l'API principale du prêteur ${lenderName}`, {
        error: apiError,
        applicationId,
        lenderId
      });
      
      // Si l'API principale échoue et qu'une API de backup est disponible
      if (lender.backupEndpoints?.submitApplication) {
        logger.info(`Tentative de soumission via l'API de backup pour le prêteur ${lenderName}`, {
          applicationId,
          lenderId
        });
        
        try {
          const backupResult = await this.sendApiRequest({
            lenderId,
            method: 'POST',
            endpoint: lender.backupEndpoints.submitApplication,
            data: adaptedData,
            timeout: 45000 // Délai plus long pour l'API de backup
          });
          
          // Enregistrer le succès de la soumission via backup
          await this.logApplicationSubmission({
            applicationId,
            lenderId,
            status: 'success_via_backup',
            externalReferenceId: backupResult.referenceId,
            submissionDate: new Date()
          });
          
          return {
            success: true,
            lenderReferenceId: backupResult.referenceId,
            submissionDate: new Date().toISOString(),
            estimatedResponseTime: backupResult.estimatedResponseTime || lender.averageProcessingTime,
            usedBackupSystem: true
          };
        } catch (backupError) {
          // Si même l'API de backup échoue, passer au mode hors ligne
          logger.error(`Échec également sur l'API de backup pour le prêteur ${lenderName}`, {
            error: backupError,
            applicationId,
            lenderId
          });
          
          // Enregistrer la demande pour une soumission manuelle ultérieure
          const offlineSubmissionId = await this.queueOfflineSubmission({
            applicationId,
            lenderId,
            applicationData: adaptedData,
            attemptedAt: new Date()
          });
          
          return {
            success: false,
            error: "Les API du prêteur sont actuellement indisponibles",
            offlineSubmissionId,
            willSubmitManually: true,
            estimatedProcessingDelay: "24-48 heures"
          };
        }
      } else {
        // Pas d'API de backup disponible, passer directement au mode hors ligne
        const offlineSubmissionId = await this.queueOfflineSubmission({
          applicationId,
          lenderId,
          applicationData: adaptedData,
          attemptedAt: new Date()
        });
        
        return {
          success: false,
          error: "L'API du prêteur est actuellement indisponible",
          offlineSubmissionId,
          willSubmitManually: true,
          estimatedProcessingDelay: "24-48 heures"
        };
      }
    }
  } catch (error) {
    logger.error('Erreur lors de la soumission de la demande au prêteur', {
      error,
      applicationId,
      lenderId
    });
    throw new Error(`Échec de la soumission de la demande: ${error.message}`);
  }
}
```

## Gestion des Erreurs et Fallbacks

Le module de financement implémente plusieurs niveaux de gestion d'erreurs :

#### 1. Validation Locale

Avant toute tentative de paiement, une validation complète des données est effectuée :

```typescript
// Dans FinanceService.ts
async validateApplication(application: FinancingApplication): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  
  // Valider les champs obligatoires
  if (!application.amount || application.amount <= 0) {
    errors.push({ field: 'amount', message: 'Le montant doit être positif' });
  }
  
  if (!application.currency) {
    errors.push({ field: 'currency', message: 'La devise est requise' });
  }
  
  if (!application.type) {
    errors.push({ field: 'type', message: 'Le type de financement est requis' });
  }
  
  if (!application.purpose) {
    errors.push({ field: 'purpose', message: 'L\'objectif du financement est requis' });
  }
  
  // Validation spécifique au type de financement
  if (application.type === 'INVOICE_FINANCING') {
    if (!this.hasRequiredInvoiceDocuments(application)) {
      errors.push({ 
        field: 'documents', 
        message: 'Les factures à financer doivent être téléchargées' 
      });
    }
  }
  
  if (application.type === 'EQUIPMENT_FINANCING') {
    if (!application.metadata?.equipmentDetails) {
      errors.push({ 
        field: 'equipmentDetails', 
        message: 'Les détails de l\'équipement sont requis pour ce type de financement' 
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

#### 2. Gestion des Erreurs d'API

```typescript
// Exemple de gestion d'erreur dans useFinance pour la soumission d'une demande
const submitApplication = async (applicationId: string) => {
  try {
    setSubmitting(true);
    
    // Vérification des documents requis
    const missingDocs = await checkRequiredDocuments(applicationId);
    if (missingDocs.length > 0) {
      throw new Error(`Documents manquants: ${missingDocs.join(', ')}`);
    }
    
    // Tentative de soumission via API
    const result = await FinanceApiService.submitApplication(applicationId);
    
    // Mise à jour du contexte avec la demande soumise
    updateApplicationInContext(result);
    
    showSuccessMessage("Votre demande a été soumise avec succès!");
    return result;
  } catch (error) {
    logger.error('Erreur lors de la soumission de la demande', error);
    
    // Si c'est une erreur de documents manquants, afficher un message spécifique
    if (error.message?.includes('Documents manquants')) {
      setDocumentError(error.message);
      showErrorMessage(error.message);
    } 
    // Si c'est une erreur réseau, sauvegarder localement
    else if (!NetworkService.isConnected) {
      await FinanceService.saveApplicationDraft(applicationId, { attemptedSubmission: true });
      showWarningMessage("Votre demande a été sauvegardée et sera soumise automatiquement lorsque la connexion sera rétablie.");
    } 
    // Autres erreurs
    else {
      showErrorMessage("Une erreur s'est produite lors de la soumission de votre demande. Veuillez réessayer.");
    }
    
    return null;
  } finally {
    setSubmitting(false);
  }
};
```

#### 3. Sauvegarde Locale

```typescript
// Dans FinanceService.ts
async saveApplicationDraft(applicationId: string, metadata: any = {}): Promise<boolean> {
  try {
    // Récupérer l'application actuelle
    const application = await this.getApplicationById(applicationId);
    
    if (!application) {
      throw new Error(`Application introuvable: ${applicationId}`);
    }
    
    // Enrichir avec les métadonnées supplémentaires
    const enrichedApplication = {
      ...application,
      metadata: {
        ...application.metadata,
        ...metadata,
        lastSaved: new Date().toISOString(),
        savedOffline: !NetworkService.isConnected
      }
    };
    
    // Sauvegarder dans la base de données locale
    await DatabaseService.storeApplication(enrichedApplication);
    
    // Ajouter à la file d'attente si la synchronisation est nécessaire
    if (metadata.attemptedSubmission && !NetworkService.isConnected) {
      await OfflineQueueService.enqueue('submit_application', { applicationId });
    }
    
    return true;
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde du brouillon', {
      error,
      applicationId
    });
    return false;
  }
}
```

#### 4. Queue de Téléchargement

```typescript
// Dans DocumentUploadService.ts
async queueDocumentForUpload(
  file: File, 
  applicationId: string, 
  documentType: string
): Promise<QueuedDocument> {
  try {
    // Générer un ID temporaire
    const tempId = generateUUID();
    
    // Stocker le fichier localement
    const localFileUrl = await LocalStorageService.storeFile(file, `temp_docs/${tempId}`);
    
    // Créer l'entrée en file d'attente
    const queuedDoc: QueuedDocument = {
      id: tempId,
      applicationId,
      type: documentType,
      name: file.name,
      fileType: file.type,
      fileSize: file.size,
      localFileUrl,
      status: 'queued',
      createdAt: new Date().toISOString(),
      attempts: 0
    };
    
    // Sauvegarder dans la file d'attente locale
    await DatabaseService.storeQueuedDocument(queuedDoc);
    
    // Si en ligne, tenter le téléchargement immédiatement
    if (NetworkService.isConnected) {
      this.processUploadQueue()
        .catch(error => logger.warn('Échec du traitement immédiat de la file d\'attente', { error }));
    } else {
      // Programmer une tentative quand la connexion sera rétablie
      NetworkService.onConnectionRestored(() => {
        this.processUploadQueue()
          .catch(error => logger.warn('Échec du traitement différé de la file d\'attente', { error }));
      });
    }
    
    return queuedDoc;
  } catch (error) {
    logger.error('Erreur lors de la mise en file d\'attente du document', {
      error,
      applicationId,
      fileName: file.name
    });
    throw new Error(`Impossible de mettre en file d'attente le document: ${error.message}`);
  }
}
```

## Mode Hors Ligne

Le module de financement offre une prise en charge du mode hors ligne pour certaines fonctionnalités :

1. **Brouillons de Demandes** : Création et modification de demandes sans connexion internet
2. **Mise en Cache des Documents** : Stockage temporaire des documents à téléverser
3. **File d'Attente de Téléchargement** : Reprise automatique des téléchargements à la reconnexion
4. **Synchronisation Différée** : Soumission automatique des demandes finalisées lors de la reconnexion

## Intégration avec d'autres services

Le module de financement s'intègre avec plusieurs autres services :

1. **Service comptable** : Pour récupérer les états financiers et les ratios financiers
2. **Service d'authentification** : Pour la vérification d'identité des demandeurs
3. **Service de paiement** : Pour le traitement des remboursements
4. **Service d'inventaire** : Pour l'évaluation des garanties basées sur les stocks

### Exemple d'intégration avec le service comptable

```typescript
// Dans FinanceService
async generateFinancialSummary(applicationId: string): Promise<FinancialSummary> {
  // Récupération des données comptables
  const financialData = await AccountingService.getFinancialReports({
    startDate: subtractMonths(new Date(), 12), // Derniers 12 mois
    endDate: new Date(),
    includeRatios: true,
    includeStatements: true
  });
  
  // Calcul des métriques pertinentes pour l'évaluation de crédit
  const creditMetrics = this.calculateCreditMetrics(financialData);
  
  // Mise à jour de la demande avec les métriques calculées
  await FinanceApiService.updateApplication(applicationId, {
    financialMetrics: creditMetrics
  });
  
  return {
    summary: creditMetrics,
    reports: financialData
  };
}
```

## Fonctionnalités principales

- **Gestion des demandes de financement** - Création, soumission et suivi des demandes
- **Téléchargement de documents** - Gestion des pièces justificatives requises
- **Évaluation d'éligibilité** - Vérification préalable de l'admissibilité
- **Analyse de risque avancée** - Évaluation automatisée du profil de risque
- **Gestion des offres** - Réception et comparaison d'offres de financement
- **Suivi des financements actifs** - Consultation des échéanciers et gestion des remboursements
- **Prédictions financières** - Modèles prédictifs pour l'analyse des flux de trésorerie

## Structure des données

Les API de financement utilisent plusieurs interfaces de données qui définissent la structure des requêtes et des réponses :

- `FinancingApplication` - Structure d'une demande de financement
- `FinancingDocument` - Structure d'un document justificatif
- `FinancingOffer` - Structure d'une offre de financement
- `FinancingEligibility` - Structure du résultat d'évaluation d'éligibilité
- `ActiveFinancing` - Structure d'un financement actif
- `RepaymentSchedule` - Structure d'un échéancier de remboursement
- `RiskAssessment` - Structure d'une évaluation des risques
- `CreditScoreResult` - Structure du résultat de notation de crédit

## Base URL

Tous les endpoints de l'API de financement sont préfixés par `/finance`.

## Endpoints des demandes de financement

### Obtenir les demandes de financement

**Endpoint**: `GET /finance/applications`

**Description**: Récupère la liste des demandes de financement.

**Paramètres de requête**:
- `type` (optionnel) - Type de financement (LOAN, LINE_OF_CREDIT, etc.)
- `status` (optionnel) - Statut des demandes (draft, submitted, etc.)
- `startDate` (optionnel) - Date de début pour filtrer les demandes
- `endDate` (optionnel) - Date de fin pour filtrer les demandes
- `minAmount` (optionnel) - Montant minimum
- `maxAmount` (optionnel) - Montant maximum
- `limit` (optionnel) - Nombre maximum de résultats
- `offset` (optionnel) - Index de départ pour la pagination

**Réponse**: Un tableau d'objets `FinancingApplication`.

// ... le reste de la documentation sur les endpoints reste inchangé ...

## Mises à jour récentes (Avril 2025)

- Implémentation d'un nouveau système de notation de crédit basé sur l'IA
- Intégration de trois nouveaux partenaires financiers (NSIA Finance, Orabank, COFINA)
- Amélioration des algorithmes de détection de fraude
- Introduction de modèles prédictifs pour l'analyse des flux de trésorerie
- Support pour le financement de projets d'énergie renouvelable
- Nouveau système de routage intelligent des demandes vers les prêteurs les plus pertinents
- Tableau de bord amélioré pour le suivi des financements actifs

## Guides de Dépannage

### Problème : Échec d'analyse de risque

**Causes possibles**:
1. Données financières insuffisantes ou incohérentes
2. Ratios financiers inhabituels nécessitant une révision manuelle
3. Incohérences dans les documents téléchargés

**Solutions**:
1. Vérifier que tous les documents financiers requis sont correctement téléchargés
2. S'assurer que les états financiers sont complets et cohérents
3. Utiliser l'option d'analyse manuelle pour les cas complexes

### Problème : Pas d'offres reçues après soumission

**Causes possibles**:
1. Score de crédit insuffisant pour les partenaires disponibles
2. Montant demandé hors des plages acceptées
3. Secteur d'activité non pris en charge par les partenaires actuels

**Solutions**:
1. Vérifier le rapport d'éligibilité pour comprendre les critères non satisfaits
2. Ajuster le montant ou la durée demandés
3. Compléter le dossier avec des garanties supplémentaires

### Problème : Échec de la prédiction des flux de trésorerie

**Causes possibles**:
1. Historique financier insuffisant (moins de 6 mois de données)
2. Données financières trop irrégulières ou incohérentes
3. Changement récent majeur dans l'activité de l'entreprise

**Solutions**:
1. Utiliser le mode d'analyse simplifiée pour les jeunes entreprises
2. Vérifier et corriger les données financières incohérentes
3. Fournir des informations contextuelles sur les changements d'activité

---

_Dernière mise à jour: 30 avril 2025_