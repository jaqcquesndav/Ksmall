import React, { createContext, useContext, ReactNode } from 'react';
import { usePayment } from '../hooks/api/usePayment';
import type { 
  Subscription, 
  SubscriptionPlan, 
  Invoice, 
  PaymentMethod, 
  PaymentTransaction, 
  AccountStatus
} from '../hooks/api/usePayment';

/**
 * Type pour les valeurs du contexte de paiement
 */
interface PaymentContextType {
  // Hooks pour les abonnements
  useActiveSubscription: ReturnType<typeof usePayment>['useActiveSubscription'];
  useSubscriptionHistory: ReturnType<typeof usePayment>['useSubscriptionHistory'];
  useSubscriptionPlans: ReturnType<typeof usePayment>['useSubscriptionPlans'];
  useSubscriptionPlan: ReturnType<typeof usePayment>['useSubscriptionPlan'];
  useSubscribe: ReturnType<typeof usePayment>['useSubscribe'];
  useCancelSubscription: ReturnType<typeof usePayment>['useCancelSubscription'];
  useUpdateSubscription: ReturnType<typeof usePayment>['useUpdateSubscription'];
  
  // Hooks pour les factures
  useInvoices: ReturnType<typeof usePayment>['useInvoices'];
  useInvoice: ReturnType<typeof usePayment>['useInvoice'];
  downloadInvoice: ReturnType<typeof usePayment>['downloadInvoice'];
  
  // Hooks pour les méthodes de paiement
  usePaymentMethods: ReturnType<typeof usePayment>['usePaymentMethods'];
  useAddPaymentMethod: ReturnType<typeof usePayment>['useAddPaymentMethod'];
  useDeletePaymentMethod: ReturnType<typeof usePayment>['useDeletePaymentMethod'];
  useSetDefaultPaymentMethod: ReturnType<typeof usePayment>['useSetDefaultPaymentMethod'];
  
  // Hooks pour les transactions
  useTransactions: ReturnType<typeof usePayment>['useTransactions'];
  useTransaction: undefined; // This property doesn't exist in the usePayment hook
  
  // État du compte
  useAccountStatus: ReturnType<typeof usePayment>['useAccountStatus'];
}

/**
 * Création du contexte de paiement
 */
export const PaymentContext = createContext<PaymentContextType | null>(null);

/**
 * Hook pour utiliser le contexte de paiement
 */
export const usePaymentContext = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePaymentContext doit être utilisé à l\'intérieur d\'un PaymentProvider');
  }
  return context;
};

/**
 * Props pour PaymentProvider
 */
interface PaymentProviderProps {
  children: ReactNode;
}

/**
 * Fournisseur de contexte pour les fonctionnalités de paiement
 */
export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const payment = usePayment();
  
  // Valeur du contexte qui expose toutes les fonctionnalités de paiement
  const value: PaymentContextType = {
    // Abonnements
    useActiveSubscription: payment.useActiveSubscription,
    useSubscriptionHistory: payment.useSubscriptionHistory,
    useSubscriptionPlans: payment.useSubscriptionPlans,
    useSubscriptionPlan: payment.useSubscriptionPlan,
    useSubscribe: payment.useSubscribe,
    useCancelSubscription: payment.useCancelSubscription,
    useUpdateSubscription: payment.useUpdateSubscription,
    
    // Factures
    useInvoices: payment.useInvoices,
    useInvoice: payment.useInvoice,
    downloadInvoice: payment.downloadInvoice,
    
    // Méthodes de paiement
    usePaymentMethods: payment.usePaymentMethods,
    useAddPaymentMethod: payment.useAddPaymentMethod,
    useDeletePaymentMethod: payment.useDeletePaymentMethod,
    useSetDefaultPaymentMethod: payment.useSetDefaultPaymentMethod,
    
    // Transactions
    useTransactions: payment.useTransactions,
    useTransaction: undefined, // This property doesn't exist in the usePayment hook
    
    // État du compte
    useAccountStatus: payment.useAccountStatus,
  };
  
  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};