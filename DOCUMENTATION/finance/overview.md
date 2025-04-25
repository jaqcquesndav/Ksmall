# API de Financement - Documentation

Cette section documente les API de financement disponibles dans l'application Ksmall. Ces API permettent aux entreprises de soumettre des demandes de financement, de gérer les documents requis, de recevoir et d'évaluer des offres, et de gérer leurs financements actifs.

## Fonctionnalités principales

- **Gestion des demandes de financement** - Création, soumission et suivi des demandes
- **Téléchargement de documents** - Gestion des pièces justificatives requises
- **Évaluation d'éligibilité** - Vérification préalable de l'admissibilité
- **Gestion des offres** - Réception et comparaison d'offres de financement
- **Suivi des financements actifs** - Consultation des échéanciers et gestion des remboursements

## Structure des données

Les API de financement utilisent plusieurs interfaces de données qui définissent la structure des requêtes et des réponses :

- `FinancingApplication` - Structure d'une demande de financement
- `FinancingDocument` - Structure d'un document justificatif
- `FinancingOffer` - Structure d'une offre de financement
- `FinancingEligibility` - Structure du résultat d'évaluation d'éligibilité
- `ActiveFinancing` - Structure d'un financement actif
- `RepaymentSchedule` - Structure d'un échéancier de remboursement

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

### Obtenir une demande de financement

**Endpoint**: `GET /finance/applications/:applicationId`

**Description**: Récupère les détails d'une demande de financement spécifique.

**Paramètres de chemin**:
- `applicationId` - ID de la demande de financement

**Réponse**: Un objet `FinancingApplication`.

### Créer une demande de financement

**Endpoint**: `POST /finance/applications`

**Description**: Crée une nouvelle demande de financement.

**Corps de la requête**:
```typescript
{
  type: FINANCING_TYPES;        // Type de financement demandé
  amount: number;               // Montant demandé
  currency: string;             // Devise (ex: XOF, EUR, USD)
  purpose: string;              // Objectif du financement
  term?: number;                // Durée souhaitée en mois (optionnel)
  interestRate?: number;        // Taux d'intérêt souhaité (optionnel)
  notes?: string;               // Notes additionnelles (optionnel)
}
```

**Réponse**: Un objet `FinancingApplication` représentant la nouvelle demande.

### Mettre à jour une demande de financement

**Endpoint**: `PUT /finance/applications/:applicationId`

**Description**: Met à jour une demande de financement existante.

**Paramètres de chemin**:
- `applicationId` - ID de la demande à modifier

**Corps de la requête**: Les champs à modifier de l'objet `FinancingApplication`.

**Réponse**: Un objet `FinancingApplication` avec les données mises à jour.

### Soumettre une demande de financement

**Endpoint**: `POST /finance/applications/:applicationId/submit`

**Description**: Soumet une demande de financement pour évaluation.

**Paramètres de chemin**:
- `applicationId` - ID de la demande à soumettre

**Réponse**: Un objet `FinancingApplication` avec le statut mis à jour.

### Annuler une demande de financement

**Endpoint**: `POST /finance/applications/:applicationId/cancel`

**Description**: Annule une demande de financement.

**Paramètres de chemin**:
- `applicationId` - ID de la demande à annuler

**Réponse**: Un objet `FinancingApplication` avec le statut mis à jour.

## Endpoints des documents

### Téléverser un document

**Endpoint**: `POST /finance/applications/:applicationId/documents`

**Description**: Téléverse un document pour une demande de financement.

**Paramètres de chemin**:
- `applicationId` - ID de la demande de financement

**Paramètres de requête**:
- `type` - Type de document ('identity', 'financial', 'business', etc.)

**Corps de la requête**: FormData contenant le fichier à téléverser.

**Réponse**: Un objet `FinancingDocument`.

### Supprimer un document

**Endpoint**: `DELETE /finance/applications/:applicationId/documents/:documentId`

**Description**: Supprime un document d'une demande de financement.

**Paramètres de chemin**:
- `applicationId` - ID de la demande de financement
- `documentId` - ID du document à supprimer

**Réponse**: Un booléen indiquant le succès ou l'échec de l'opération.

## Endpoints des fournisseurs et de l'éligibilité

### Obtenir les fournisseurs de financement

**Endpoint**: `GET /finance/providers`

**Description**: Récupère la liste des fournisseurs de financement disponibles.

**Paramètres de requête**:
- `type` (optionnel) - Type de financement pour filtrer les fournisseurs

**Réponse**: Un tableau d'objets `FinancingProvider`.

### Vérifier l'éligibilité au financement

**Endpoint**: `POST /finance/eligibility`

**Description**: Vérifie l'éligibilité à un financement selon les critères fournis.

**Corps de la requête**:
```typescript
{
  amount: number;         // Montant souhaité
  currency: string;       // Devise
  type: FINANCING_TYPES;  // Type de financement
  term?: number;          // Durée souhaitée en mois (optionnel)
}
```

**Réponse**: Un objet `FinancingEligibility`.

## Endpoints des offres de financement

### Accepter une offre

**Endpoint**: `POST /finance/applications/:applicationId/offers/:offerId/accept`

**Description**: Accepte une offre de financement pour une demande.

**Paramètres de chemin**:
- `applicationId` - ID de la demande de financement
- `offerId` - ID de l'offre à accepter

**Réponse**: Un objet `FinancingApplication` mis à jour.

### Rejeter une offre

**Endpoint**: `POST /finance/applications/:applicationId/offers/:offerId/reject`

**Description**: Rejette une offre de financement pour une demande.

**Paramètres de chemin**:
- `applicationId` - ID de la demande de financement
- `offerId` - ID de l'offre à rejeter

**Corps de la requête**:
```typescript
{
  reason?: string;  // Motif de rejet (optionnel)
}
```

**Réponse**: Un objet `FinancingApplication` mis à jour.

## Endpoints des financements actifs

### Obtenir les financements actifs

**Endpoint**: `GET /finance/active`

**Description**: Récupère la liste des financements actifs de l'entreprise.

**Réponse**: Un tableau d'objets `ActiveFinancing`.

### Obtenir un calendrier de remboursement

**Endpoint**: `GET /finance/active/:financingId/schedule`

**Description**: Récupère le calendrier de remboursement pour un financement spécifique.

**Paramètres de chemin**:
- `financingId` - ID du financement

**Réponse**: Un objet `RepaymentSchedule`.

### Effectuer un remboursement

**Endpoint**: `POST /finance/active/:financingId/repayment`

**Description**: Enregistre un paiement pour un financement.

**Paramètres de chemin**:
- `financingId` - ID du financement

**Corps de la requête**:
```typescript
{
  amount: number;                       // Montant du remboursement
  method: 'bank_transfer' | 'card' | 'mobile_money';  // Méthode de paiement
  reference?: string;                  // Référence externe (optionnel)
}
```

**Réponse**:
```typescript
{
  success: boolean;       // Indique si le paiement a réussi
  transactionId: string;  // ID de la transaction
}
```

## Endpoint des statistiques

### Obtenir les statistiques de financement

**Endpoint**: `GET /finance/stats`

**Description**: Récupère les statistiques globales concernant les financements de l'entreprise.

**Réponse**:
```typescript
{
  totalRequested: number;   // Montant total demandé
  totalApproved: number;    // Montant total approuvé
  totalActive: number;      // Montant total des financements actifs
  totalRepaid: number;      // Montant total remboursé
  approvalRate: number;     // Taux d'approbation (pourcentage)
  avgInterestRate: number;  // Taux d'intérêt moyen
}
```

## Types de données

### Types de financement (FINANCING_TYPES)

```typescript
enum FINANCING_TYPES {
  LOAN = 'loan',                      // Prêt standard
  LINE_OF_CREDIT = 'line_of_credit',  // Ligne de crédit
  INVOICE_FINANCING = 'invoice_financing',  // Financement de factures
  EQUIPMENT_FINANCING = 'equipment_financing',  // Financement d'équipement
  MERCHANT_ADVANCE = 'merchant_advance',  // Avance sur recettes
  GRANT = 'grant',                    // Subvention
  EQUITY = 'equity'                   // Investissement en capital
}
```

### Structure d'une demande de financement (FinancingApplication)

```typescript
interface FinancingApplication {
  id: string;
  companyId: string;
  type: FINANCING_TYPES;
  amount: number;
  currency: string;
  purpose: string;
  term?: number;
  interestRate?: number;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'cancelled' | 'funded';
  submittedAt?: string;
  updatedAt: string;
  createdAt: string;
  notes?: string;
  documents: FinancingDocument[];
  requirements: ApplicationRequirement[];
  offers?: FinancingOffer[];
  selectedOfferId?: string;
  reviewFeedback?: string;
}
```

### Structure d'un document (FinancingDocument)

```typescript
interface FinancingDocument {
  id: string;
  applicationId: string;
  type: 'identity' | 'financial' | 'business' | 'tax' | 'invoice' | 'other';
  name: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}
```

### Structure d'une offre de financement (FinancingOffer)

```typescript
interface FinancingOffer {
  id: string;
  applicationId: string;
  providerId: string;
  providerName: string;
  providerLogo?: string;
  amount: number;
  currency: string;
  interestRate: number;
  term: number;
  monthlyPayment: number;
  totalRepayment: number;
  fees: {
    originationFee?: number;
    processingFee?: number;
    otherFees?: {
      name: string;
      amount: number;
    }[];
    totalFees: number;
  };
  apr: number;
  disbursementMethod: 'bank_transfer' | 'check' | 'mobile_money';
  repaymentMethod: 'automatic' | 'manual';
  conditions: string[];
  expiresAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}
```