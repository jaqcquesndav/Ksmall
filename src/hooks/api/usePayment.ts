import { useCallback } from 'react';
import { useApi } from './useApi';
import API from '../../services/API';

/**
 * Type représentant un abonnement
 */
export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'expired' | 'trial' | 'past_due' | 'unpaid';
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  nextBillingDate?: string;
  cancelAtPeriodEnd: boolean;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  metadata?: Record<string, any>;
}

/**
 * Type représentant un plan d'abonnement
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  isPopular?: boolean;
  trialDays?: number;
  metadata?: Record<string, any>;
}

/**
 * Type représentant une facture
 */
export interface Invoice {
  id: string;
  subscriptionId?: string;
  number: string;
  date: string;
  dueDate: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible' | 'draft';
  amount: number;
  currency: string;
  description?: string;
  pdfUrl?: string;
  items: InvoiceItem[];
}

/**
 * Type représentant un élément de facture
 */
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  metadata?: Record<string, any>;
}

/**
 * Type représentant une méthode de paiement
 */
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'mobile_money';
  isDefault: boolean;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountType?: string;
  holderName?: string;
  metadata?: Record<string, any>;
}

/**
 * Type représentant une transaction de paiement
 */
export interface PaymentTransaction {
  id: string;
  type: 'payment' | 'refund' | 'payout';
  status: 'succeeded' | 'pending' | 'failed' | 'canceled';
  amount: number;
  currency: string;
  date: string;
  description?: string;
  paymentMethodId?: string;
  invoiceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Type représentant le statut du compte
 */
export interface AccountStatus {
  currentPeriodUsage: number;
  currentPeriodLimit: number;
  remainingCredits: number;
  percentUsed: number;
  daysLeft: number;
  isOverLimit: boolean;
  features: {
    [feature: string]: {
      enabled: boolean;
      limit?: number;
      used?: number;
    };
  };
}

/**
 * Options pour les requêtes de paiement
 */
interface PaymentQueryOptions {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  status?: string;
}

/**
 * Hook pour gérer les fonctionnalités de paiement et d'abonnement
 */
export function usePayment() {
  /**
   * Hook pour récupérer l'abonnement actif
   */
  const useActiveSubscription = () => {
    return useApi<Subscription>(
      () => API.payment.getActiveSubscription(),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: 'active-subscription',
          ttl: 5 * 60 * 1000, // 5 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer l'historique des abonnements
   */
  const useSubscriptionHistory = () => {
    return useApi<Subscription[]>(
      () => API.payment.getSubscriptionHistory(),
      {
        autoFetch: true,
        cache: {
          key: 'subscription-history',
          ttl: 15 * 60 * 1000, // 15 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les plans d'abonnement disponibles
   */
  const useSubscriptionPlans = () => {
    return useApi<SubscriptionPlan[]>(
      () => API.payment.getSubscriptionPlans(),
      {
        autoFetch: true,
        cache: {
          key: 'subscription-plans',
          ttl: 60 * 60 * 1000, // 1 heure
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les détails d'un plan d'abonnement
   */
  const useSubscriptionPlan = (planId: string | null) => {
    return useApi<SubscriptionPlan>(
      () => planId ? API.payment.getSubscriptionPlan(planId) : Promise.reject('ID plan requis'),
      {
        autoFetch: !!planId,
        cache: {
          key: `subscription-plan-${planId}`,
          ttl: 60 * 60 * 1000, // 1 heure
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour s'abonner à un plan
   */
  const useSubscribe = () => {
    return useApi<Subscription>(
      (planId: string, paymentMethodId?: string, couponCode?: string) => 
        API.payment.subscribe(planId, paymentMethodId, couponCode),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour annuler un abonnement
   */
  const useCancelSubscription = () => {
    return useApi<Subscription>(
      (atPeriodEnd: boolean = true) => API.payment.cancelSubscription(atPeriodEnd),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour modifier un abonnement
   */
  const useUpdateSubscription = () => {
    return useApi<Subscription>(
      (planId: string, immediate: boolean = false) => 
        API.payment.updateSubscription(planId, immediate),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les factures
   */
  const useInvoices = (options: PaymentQueryOptions = {}) => {
    return useApi<Invoice[]>(
      () => API.payment.getInvoices(options),
      {
        autoFetch: true,
        cache: {
          key: `invoices-${JSON.stringify(options)}`,
          ttl: 15 * 60 * 1000, // 15 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer une facture spécifique
   */
  const useInvoice = (invoiceId: string | null) => {
    return useApi<Invoice>(
      () => invoiceId ? API.payment.getInvoice(invoiceId) : Promise.reject('ID facture requis'),
      {
        autoFetch: !!invoiceId,
        cache: {
          key: `invoice-${invoiceId}`,
          ttl: 15 * 60 * 1000, // 15 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les méthodes de paiement
   */
  const usePaymentMethods = () => {
    return useApi<PaymentMethod[]>(
      () => API.payment.getPaymentMethods(),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: 'payment-methods',
          ttl: 15 * 60 * 1000, // 15 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour ajouter une méthode de paiement
   */
  const useAddPaymentMethod = () => {
    return useApi<PaymentMethod>(
      (paymentMethodData: Record<string, any>) => API.payment.addPaymentMethod(paymentMethodData),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour supprimer une méthode de paiement
   */
  const useDeletePaymentMethod = () => {
    return useApi<boolean>(
      (paymentMethodId: string) => API.payment.deletePaymentMethod(paymentMethodId),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour définir une méthode de paiement par défaut
   */
  const useSetDefaultPaymentMethod = () => {
    return useApi<PaymentMethod>(
      (paymentMethodId: string) => API.payment.setDefaultPaymentMethod(paymentMethodId),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les transactions
   */
  const useTransactions = (options: PaymentQueryOptions = {}) => {
    return useApi<PaymentTransaction[]>(
      () => API.payment.getTransactions(options),
      {
        autoFetch: true,
        cache: {
          key: `payment-transactions-${JSON.stringify(options)}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer le statut du compte
   */
  const useAccountStatus = () => {
    return useApi<AccountStatus>(
      () => API.payment.getAccountStatus(),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: 'account-status',
          ttl: 5 * 60 * 1000, // 5 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Fonction pour télécharger une facture en PDF
   */
  const downloadInvoice = useCallback(async (invoiceId: string): Promise<string> => {
    try {
      const result = await API.payment.downloadInvoice(invoiceId);
      return result.pdfUrl;
    } catch (error) {
      console.error('Erreur lors du téléchargement de la facture:', error);
      throw error;
    }
  }, []);

  /**
   * Fonction pour appliquer un coupon à un abonnement
   */
  const applyCoupon = useCallback(async (
    couponCode: string
  ): Promise<{ valid: boolean; discount?: number; message?: string }> => {
    try {
      return await API.payment.applyCoupon(couponCode);
    } catch (error) {
      console.error('Erreur lors de l\'application du coupon:', error);
      throw error;
    }
  }, []);

  return {
    useActiveSubscription,
    useSubscriptionHistory,
    useSubscriptionPlans,
    useSubscriptionPlan,
    useSubscribe,
    useCancelSubscription,
    useUpdateSubscription,
    useInvoices,
    useInvoice,
    usePaymentMethods,
    useAddPaymentMethod,
    useDeletePaymentMethod,
    useSetDefaultPaymentMethod,
    useTransactions,
    useAccountStatus,
    downloadInvoice,
    applyCoupon
  };
}