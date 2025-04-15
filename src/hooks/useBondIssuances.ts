import { useState, useEffect, useCallback } from 'react';
import DatabaseService from '../services/DatabaseService';
import FinanceAccountingService from '../services/FinanceAccountingService';
import * as CompanyService from '../services/CompanyService';

export interface BondIssuance {
  id: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  isPublic: boolean;
  description: string;
  bondType: string;
  issuance_date: string;
  status: 'active' | 'completed' | 'cancelled';
  total_interest_paid: number;
  next_interest_payment_date: string;
  last_interest_payment_date?: string;
  maturity_date: string;
  issuer_id: string;
  issuer_name: string;
  total_bonds_sold: number;
  minimumInvestment?: number;
  type?: string;        // Added for compatibility with existing code
  interest_rate?: number; // Added for compatibility with existing code
  term_months?: number;   // Added for compatibility with existing code
  is_public?: boolean;   // Added for compatibility with existing code
}

export interface BondPayment {
  id: string;
  issuance_id: string;
  payment_date: string;
  payment_amount: number;
  payment_type: 'interest' | 'principal';
  status: 'scheduled' | 'paid' | 'missed';
  actual_payment_date?: string;
}

/**
 * Hook pour gérer les émissions d'obligations de l'entreprise
 */
export const useBondIssuances = () => {
  const [issuances, setIssuances] = useState<BondIssuance[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<BondPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalIssuanceAmount, setTotalIssuanceAmount] = useState<number>(0);
  const [totalInterestPaid, setTotalInterestPaid] = useState<number>(0);

  /**
   * Charger toutes les émissions d'obligations de l'entreprise
   */
  const loadIssuances = useCallback(async () => {
    try {
      setLoading(true);
      // Récupérer l'ID de l'entreprise actuelle
      const companyId = await CompanyService.getCurrentCompanyId();
      
      // Charger les émissions d'obligations de l'entreprise
      const companyIssuances = await DatabaseService.getBondIssuancesByIssuer(companyId);
      
      // Map the property names for backwards compatibility
      const mappedIssuances = companyIssuances.map(issuance => ({
        ...issuance,
        type: issuance.bondType,
        interest_rate: issuance.interestRate,
        term_months: issuance.termMonths,
        is_public: issuance.isPublic
      }));
      
      setIssuances(mappedIssuances);
      
      // Calculate totals
      const totalAmount = mappedIssuances.reduce((sum, issuance) => sum + issuance.amount, 0);
      const totalPaid = mappedIssuances.reduce((sum, issuance) => sum + issuance.total_interest_paid, 0);
      setTotalIssuanceAmount(totalAmount);
      setTotalInterestPaid(totalPaid);
      
      // Charger les prochains paiements d'intérêts à effectuer
      const payments = await DatabaseService.getUpcomingBondPayments(companyId);
      setUpcomingPayments(payments);
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des émissions obligataires:', err);
      setError('Impossible de charger les émissions obligataires');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Créer une nouvelle émission d'obligations
   */
  const createIssuance = useCallback(async (issuanceData: {
    amount: number;
    interestRate: number;
    termMonths: number;
    isPublic: boolean;
    description: string;
    bondType: string;
    minimumInvestment?: number;
  }) => {
    try {
      setLoading(true);
      
      // Enregistrer l'émission avec synchronisation comptable
      const issuanceId = await FinanceAccountingService.recordBondIssuance(issuanceData);
      
      // Recharger les émissions pour mettre à jour la liste
      await loadIssuances();
      
      return issuanceId;
    } catch (err) {
      console.error('Erreur lors de la création de l\'émission obligataire:', err);
      setError('Impossible de créer l\'émission obligataire');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadIssuances]);

  /**
   * Effectuer un paiement d'intérêts sur une émission obligataire
   */
  const makeInterestPayment = useCallback(async (paymentId: string) => {
    try {
      setLoading(true);
      
      // Récupérer les informations sur le paiement
      const payment = await DatabaseService.getBondPayment(paymentId);
      
      // Enregistrer le paiement avec synchronisation comptable
      await FinanceAccountingService.recordBondInterestPayment(payment.issuance_id, payment.payment_amount);
      
      // Mettre à jour le statut du paiement
      await DatabaseService.updateBondPayment(paymentId, {
        status: 'paid',
        actual_payment_date: new Date().toISOString()
      });
      
      // Recharger les données
      await loadIssuances();
      
      return true;
    } catch (err) {
      console.error('Erreur lors du paiement d\'intérêts:', err);
      setError('Impossible d\'effectuer le paiement d\'intérêts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadIssuances]);

  /**
   * Calculer le montant total des intérêts à payer sur la durée de l'émission
   */
  const calculateTotalInterest = useCallback((issuance: BondIssuance) => {
    const quarterlyRate = issuance.interestRate / 4; // Taux trimestriel
    const quarterlyPayment = (issuance.amount * quarterlyRate) / 100;
    const numberOfPayments = Math.floor(issuance.termMonths / 3);
    return quarterlyPayment * numberOfPayments;
  }, []);

  /**
   * Calculer les statistiques sur les émissions obligataires
   */
  const calculateIssuanceStats = useCallback(() => {
    if (issuances.length === 0) return null;
    
    const totalIssuedAmount = issuances.reduce((sum, issuance) => sum + issuance.amount, 0);
    const totalInterestToPay = issuances.reduce((sum, issuance) => {
      return sum + calculateTotalInterest(issuance);
    }, 0);
    const totalInterestPaid = issuances.reduce((sum, issuance) => sum + issuance.total_interest_paid, 0);
    
    const activeIssuances = issuances.filter(i => i.status === 'active').length;
    const completedIssuances = issuances.filter(i => i.status === 'completed').length;
    
    return {
      totalIssuedAmount,
      totalInterestToPay,
      totalInterestPaid,
      remainingInterest: totalInterestToPay - totalInterestPaid,
      activeIssuances,
      completedIssuances,
      totalIssuances: issuances.length
    };
  }, [issuances, calculateTotalInterest]);

  /**
   * Refresh issuances data explicitly
   */
  const refreshIssuances = useCallback(async () => {
    await loadIssuances();
  }, [loadIssuances]);

  // Charger les données lors de l'initialisation du hook
  useEffect(() => {
    loadIssuances();
  }, [loadIssuances]);

  return {
    issuances,
    upcomingPayments,
    loading,
    error,
    loadIssuances,
    createIssuance,
    makeInterestPayment,
    calculateTotalInterest,
    stats: calculateIssuanceStats(),
    refreshIssuances,
    totalIssuanceAmount,
    totalInterestPaid
  };
};

export default useBondIssuances;