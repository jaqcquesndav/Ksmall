import ApiService from '../ApiService';
import logger from '../../../utils/logger';

/**
 * Interface pour un abonnement
 */
export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'expired' | 'trial';
  startDate: string;
  endDate: string;
  renewalDate?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  paymentMethodId?: string;
}

/**
 * Interface pour un plan d'abonnement
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  isPopular?: boolean;
  maxUsers?: number;
  maxStorage?: number;
}

/**
 * Interface pour une méthode de paiement
 */
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'mobile_money';
  default: boolean;
  details: {
    brand?: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    holderName?: string;
    bankName?: string;
    phoneNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface pour une facture
 */
export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled';
  amount: number;
  currency: string;
  description: string;
  items: InvoiceItem[];
  paidAt?: string;
  pdfUrl?: string;
}

/**
 * Interface pour un élément de facture
 */
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * Interface pour une transaction de paiement
 */
export interface PaymentTransaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  invoiceId?: string;
  description: string;
}

/**
 * Interface pour les détails d'une carte de crédit
 */
export interface CardDetails {
  number: string;
  expiryMonth: number;
  expiryYear: number;
  cvc: string;
  holderName: string;
}

/**
 * Service API pour les paiements
 */
class PaymentApiService {
  private static readonly BASE_PATH = '/payments';

  /**
   * Récupère les abonnements de l'utilisateur
   */
  async getSubscriptions(): Promise<Subscription[]> {
    try {
      return await ApiService.get<Subscription[]>(`${PaymentApiService.BASE_PATH}/subscriptions`);
    } catch (error) {
      logger.error('Erreur lors de la récupération des abonnements', error);
      throw error;
    }
  }

  /**
   * Récupère les plans d'abonnement disponibles
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      return await ApiService.get<SubscriptionPlan[]>(`${PaymentApiService.BASE_PATH}/subscription-plans`);
    } catch (error) {
      logger.error('Erreur lors de la récupération des plans d\'abonnement', error);
      throw error;
    }
  }

  /**
   * Souscrit à un plan d'abonnement
   */
  async subscribeToPlan(planId: string, paymentMethodId?: string, interval: 'month' | 'year' = 'month'): Promise<Subscription> {
    try {
      return await ApiService.post<Subscription>(`${PaymentApiService.BASE_PATH}/subscriptions`, {
        planId,
        paymentMethodId,
        interval
      });
    } catch (error) {
      logger.error('Erreur lors de la souscription au plan', error);
      throw error;
    }
  }

  /**
   * Annule un abonnement
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription> {
    try {
      return await ApiService.put<Subscription>(
        `${PaymentApiService.BASE_PATH}/subscriptions/${subscriptionId}/cancel`,
        { reason }
      );
    } catch (error) {
      logger.error(`Erreur lors de l'annulation de l'abonnement ${subscriptionId}`, error);
      throw error;
    }
  }

  /**
   * Réactive un abonnement annulé
   */
  async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      return await ApiService.put<Subscription>(
        `${PaymentApiService.BASE_PATH}/subscriptions/${subscriptionId}/reactivate`,
        {}
      );
    } catch (error) {
      logger.error(`Erreur lors de la réactivation de l'abonnement ${subscriptionId}`, error);
      throw error;
    }
  }

  /**
   * Récupère les méthodes de paiement de l'utilisateur
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      return await ApiService.get<PaymentMethod[]>(`${PaymentApiService.BASE_PATH}/payment-methods`);
    } catch (error) {
      logger.error('Erreur lors de la récupération des méthodes de paiement', error);
      throw error;
    }
  }

  /**
   * Ajoute une nouvelle méthode de paiement par carte
   */
  async addCardPaymentMethod(cardDetails: CardDetails): Promise<PaymentMethod> {
    try {
      return await ApiService.post<PaymentMethod>(`${PaymentApiService.BASE_PATH}/payment-methods/card`, cardDetails);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de la méthode de paiement par carte', error);
      throw error;
    }
  }

  /**
   * Ajoute une nouvelle méthode de paiement par compte bancaire
   */
  async addBankAccountPaymentMethod(bankDetails: any): Promise<PaymentMethod> {
    try {
      return await ApiService.post<PaymentMethod>(`${PaymentApiService.BASE_PATH}/payment-methods/bank-account`, bankDetails);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de la méthode de paiement par compte bancaire', error);
      throw error;
    }
  }

  /**
   * Ajoute une nouvelle méthode de paiement par mobile money
   */
  async addMobileMoneyPaymentMethod(mobileDetails: { phoneNumber: string; provider: string }): Promise<PaymentMethod> {
    try {
      return await ApiService.post<PaymentMethod>(`${PaymentApiService.BASE_PATH}/payment-methods/mobile-money`, mobileDetails);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de la méthode de paiement par mobile money', error);
      throw error;
    }
  }

  /**
   * Supprime une méthode de paiement
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await ApiService.delete(`${PaymentApiService.BASE_PATH}/payment-methods/${paymentMethodId}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la méthode de paiement ${paymentMethodId}`, error);
      throw error;
    }
  }

  /**
   * Définit une méthode de paiement par défaut
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await ApiService.put(
        `${PaymentApiService.BASE_PATH}/payment-methods/${paymentMethodId}/default`,
        {}
      );
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la définition de la méthode de paiement par défaut ${paymentMethodId}`, error);
      throw error;
    }
  }

  /**
   * Récupère les factures de l'utilisateur
   */
  async getInvoices(): Promise<Invoice[]> {
    try {
      return await ApiService.get<Invoice[]>(`${PaymentApiService.BASE_PATH}/invoices`);
    } catch (error) {
      logger.error('Erreur lors de la récupération des factures', error);
      throw error;
    }
  }

  /**
   * Récupère une facture par ID
   */
  async getInvoiceById(invoiceId: string): Promise<Invoice> {
    try {
      return await ApiService.get<Invoice>(`${PaymentApiService.BASE_PATH}/invoices/${invoiceId}`);
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la facture ${invoiceId}`, error);
      throw error;
    }
  }

  /**
   * Paie une facture
   */
  async payInvoice(invoiceId: string, paymentMethodId?: string): Promise<PaymentTransaction> {
    try {
      return await ApiService.post<PaymentTransaction>(
        `${PaymentApiService.BASE_PATH}/invoices/${invoiceId}/pay`,
        { paymentMethodId }
      );
    } catch (error) {
      logger.error(`Erreur lors du paiement de la facture ${invoiceId}`, error);
      throw error;
    }
  }

  /**
   * Télécharge une facture en PDF
   */
  async downloadInvoicePdf(invoiceId: string): Promise<{ url: string }> {
    try {
      return await ApiService.get<{ url: string }>(
        `${PaymentApiService.BASE_PATH}/invoices/${invoiceId}/pdf`
      );
    } catch (error) {
      logger.error(`Erreur lors du téléchargement de la facture ${invoiceId}`, error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des transactions de paiement
   */
  async getPaymentTransactions(): Promise<PaymentTransaction[]> {
    try {
      return await ApiService.get<PaymentTransaction[]>(`${PaymentApiService.BASE_PATH}/transactions`);
    } catch (error) {
      logger.error('Erreur lors de la récupération des transactions de paiement', error);
      throw error;
    }
  }

  /**
   * Effectue un paiement ponctuel
   */
  async makePayment(amount: number, currency: string, description: string, paymentMethodId?: string): Promise<PaymentTransaction> {
    try {
      return await ApiService.post<PaymentTransaction>(`${PaymentApiService.BASE_PATH}/transactions`, {
        amount,
        currency,
        description,
        paymentMethodId
      });
    } catch (error) {
      logger.error('Erreur lors de l\'exécution du paiement', error);
      throw error;
    }
  }

  /**
   * Récupère les détails d'une transaction
   */
  async getTransactionById(transactionId: string): Promise<PaymentTransaction> {
    try {
      return await ApiService.get<PaymentTransaction>(
        `${PaymentApiService.BASE_PATH}/transactions/${transactionId}`
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la transaction ${transactionId}`, error);
      throw error;
    }
  }

  /**
   * Demande un remboursement pour une transaction
   */
  async requestRefund(transactionId: string, reason: string): Promise<PaymentTransaction> {
    try {
      return await ApiService.post<PaymentTransaction>(
        `${PaymentApiService.BASE_PATH}/transactions/${transactionId}/refund`,
        { reason }
      );
    } catch (error) {
      logger.error(`Erreur lors de la demande de remboursement pour la transaction ${transactionId}`, error);
      throw error;
    }
  }

  /**
   * Vérifie l'état du compte utilisateur et les fonctionnalités disponibles
   */
  async checkAccountStatus(): Promise<{
    status: 'active' | 'suspended' | 'trial' | 'expired';
    expiresAt?: string;
    remainingDays?: number;
    features: string[];
    restrictions?: any;
  }> {
    try {
      return await ApiService.get(`${PaymentApiService.BASE_PATH}/account-status`);
    } catch (error) {
      logger.error('Erreur lors de la vérification de l\'état du compte', error);
      throw error;
    }
  }
}

export default new PaymentApiService();