/**
 * Types relatifs au module de financement
 */

import { Company } from './user';

/**
 * Types de financement disponibles
 */
export enum FINANCING_TYPES {
  LOAN = 'loan',
  LINE_OF_CREDIT = 'line_of_credit',
  INVOICE_FINANCING = 'invoice_financing',
  EQUIPMENT_FINANCING = 'equipment_financing',
  MERCHANT_ADVANCE = 'merchant_advance',
  GRANT = 'grant',
  EQUITY = 'equity'
}

/**
 * Interface pour une demande de financement
 */
export interface FinancingApplication {
  id: string;
  companyId: string;
  type: FINANCING_TYPES;
  amount: number;
  currency: string;
  purpose: string;
  term?: number; // en mois
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

/**
 * Interface pour un document relatif à une demande de financement
 */
export interface FinancingDocument {
  id: string;
  applicationId: string;
  type: 'identity' | 'financial' | 'business' | 'tax' | 'invoice' | 'other';
  name: string;
  description?: string;
  fileUrl: string;
  fileType: string; // ex: pdf, jpg, png
  fileSize: number;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}

/**
 * Interface pour une exigence de demande de financement
 */
export interface ApplicationRequirement {
  id: string;
  type: 'document' | 'information' | 'verification';
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  order: number;
}

/**
 * Interface pour une offre de financement
 */
export interface FinancingOffer {
  id: string;
  applicationId: string;
  providerId: string;
  providerName: string;
  providerLogo?: string;
  amount: number;
  currency: string;
  interestRate: number;
  term: number; // en mois
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
  apr: number; // taux annuel effectif global
  disbursementMethod: 'bank_transfer' | 'check' | 'mobile_money';
  repaymentMethod: 'automatic' | 'manual';
  conditions: string[];
  expiresAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

/**
 * Interface pour un plan de remboursement
 */
export interface RepaymentSchedule {
  loanId: string;
  totalPayments: number;
  remainingPayments: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  installments: RepaymentInstallment[];
}

/**
 * Interface pour une échéance de remboursement
 */
export interface RepaymentInstallment {
  id: string;
  number: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  fees: number;
  status: 'scheduled' | 'pending' | 'paid' | 'overdue' | 'partial';
  paidAmount?: number;
  paidDate?: string;
  remainingBalance: number;
}

/**
 * Interface pour un fournisseur de financement
 */
export interface FinancingProvider {
  id: string;
  name: string;
  logo?: string;
  types: FINANCING_TYPES[];
  minAmount: number;
  maxAmount: number;
  minTerm?: number;
  maxTerm?: number;
  interestRateRange: {
    min: number;
    max: number;
  };
  processingTime: string; // ex: "24-48 hours"
  requirements: string[];
  eligibilityCriteria: {
    minTimeInBusiness: number; // en mois
    minRevenue: number;
    minCreditScore?: number;
    industries?: string[];
    countries: string[];
  };
  rating: number;
  reviewCount: number;
}

/**
 * Interface pour une évaluation d'éligibilité au financement
 */
export interface FinancingEligibility {
  eligible: boolean;
  score: number; // score sur 100
  maxAmount: number;
  estimatedRate: {
    min: number;
    max: number;
  };
  availableProducts: FINANCING_TYPES[];
  factors: {
    positive: {
      factor: string;
      impact: 'low' | 'medium' | 'high';
    }[];
    negative: {
      factor: string;
      impact: 'low' | 'medium' | 'high';
    }[];
  };
  recommendations: string[];
}

/**
 * Interface pour un compte de financement actif
 */
export interface ActiveFinancing {
  id: string;
  type: FINANCING_TYPES;
  provider: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'paid' | 'defaulted' | 'restructured';
  nextPayment: {
    date: string;
    amount: number;
  };
  remainingPayments: number;
}

/**
 * Interface pour les options d'une requête de financement
 */
export interface FinancingQueryOptions {
  type?: FINANCING_TYPES;
  status?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}