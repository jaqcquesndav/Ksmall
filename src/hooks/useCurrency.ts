import { useContext } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { Currency, CurrencyInfo } from '../services/CurrencyService';

/**
 * Type de retour du hook useCurrency
 */
export interface UseCurrencyReturnType {
  /**
   * Code de la devise actuelle
   */
  currency: Currency;
  
  /**
   * Informations complètes sur la devise actuelle
   */
  currencyInfo: CurrencyInfo;
  
  /**
   * Fonction pour changer la devise actuelle
   */
  setCurrency: (currency: Currency) => void;
  
  /**
   * Fonction pour formater un montant selon la devise actuelle
   */
  formatAmount: (amount: number, options?: { showSymbol?: boolean; numberOfDecimals?: number }) => string;
  
  /**
   * Fonction pour convertir un montant d'une devise à la devise actuelle
   */
  convertToCurrentCurrency: (amount: number, fromCurrency: Currency) => Promise<number>;

  /**
   * Indique si les opérations de devises sont en cours de chargement
   */
  loading: boolean;

  /**
   * La devise sélectionnée
   */
  selectedCurrency: Currency;

  /**
   * Fonction pour mettre à jour la devise
   */
  updateCurrency: (currency: Currency) => Promise<void>;

  /**
   * Fonction pour obtenir toutes les devises disponibles
   */
  getAllCurrencies: () => CurrencyInfo[];
}

/**
 * Hook personnalisé pour accéder et manipuler la devise courante
 */
export function useCurrency(): UseCurrencyReturnType {
  const context = useContext(CurrencyContext);
  
  if (!context) {
    throw new Error(
      "useCurrency doit être utilisé à l'intérieur d'un CurrencyProvider"
    );
  }
  
  return context;
}

// Export par défaut pour la compatibilité avec les imports existants
export default useCurrency;